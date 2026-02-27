import { Connection, PublicKey } from '@solana/web3.js';
import { generateAddresses } from './addressUtils';
import { getLatestMemo, UserState } from './memo';
import { createMultipleTransferMemoTransaction, sendTransaction, requestSig, decryptSigFromBackend } from './transactionUtils';
import { getApiUrl, API_ENDPOINTS } from '../lib/apiUtils';

export interface VerifyReferralParams {
  referralCode: string;  // The code user entered (referrer's rf)
  userWalletAddress: string;  // Current user's wallet
  username: string;  // Current user's username
  connection: Connection;
  signTransaction: (transaction: any) => Promise<any>;
}

export interface VerifyReferralResult {
  success: boolean;
  referrerData?: {
    username: string;
    referralCode: string;
    referralCount: number;
    newReferralCount: number;
  };
  error?: string;
  signature?: string;  // Single transaction signature for both updates
}

/**
 * Verify referral code and increment referrer's count (SIG-ONLY)
 * 
 * Process:
 * 1. Fetch user's current sig to check if rb is already set
 * 2. If rb is already set, reject (can't use multiple codes)
 * 3. Verify referrer exists and is valid
 * 4. Send ONE transaction with TWO transfers:
 *    a) Update user's sig with rb field set
 *    b) Update referrer's sig with rc incremented
 */
export async function verifyReferral(params: VerifyReferralParams): Promise<VerifyReferralResult> {
  const { referralCode, userWalletAddress, username, connection, signTransaction } = params;
  
  try {
    console.log('Verifying referral code:', referralCode);
    
    // Validate referral code format (should be 6 characters: first3 + last3)
    if (!referralCode || referralCode.length !== 6) {
      return {
        success: false,
        error: 'Invalid referral code format (must be 6 characters)'
      };
    }
    
    // Step 1: Check user's current sig to see if they already used a referral code
    const userAddresses = await generateAddresses(userWalletAddress);
    console.log('🔍 DEBUG - Fetching user state:', {
      userWallet: userWalletAddress,
      userAddress: userAddresses.referralAddress.toString()
    });
    
    const userSig = await getLatestMemo(connection, userAddresses.referralAddress, userWalletAddress);
    
    if (!userSig) {
      return {
        success: false,
        error: 'Please verify your account first'
      };
    }
    
    // Decrypt user's sig
    const userState = await decryptSigFromBackend(userSig);
    
    console.log('🔍 DEBUG - User current state:', {
      username: userState.u,
      wallet: userState.w,
      referralCode: userState.rf,
      referredBy: userState.rb,
      referralCount: userState.rc,
      points: userState.p
    });
    
    // Check if user already used a referral code
    if (userState.rb !== null) {
      return {
        success: false,
        error: `You already used referral code: ${userState.rb}`
      };
    }
    
    // Step 2: Derive referrer's address from their referral code
    // Send referral code to backend to generate the real address using mnemonic + RF code
    let referrerAddress: PublicKey;
    
    try {
      const response = await fetch(getApiUrl(API_ENDPOINTS.DERIVE_ADDRESS), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          referralCode: referralCode  // Send RF code to backend
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to derive referrer address: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      referrerAddress = new PublicKey(result.referralAddress);
      
      console.log('Referrer address derived from RF code:', referrerAddress.toString());
    } catch (error) {
      console.error('Failed to derive referrer address:', error);
      return {
        success: false,
        error: 'Failed to generate referrer address from referral code'
      };
    }
    
    // Fetch referrer's latest sig
    const referrerSig = await getLatestMemo(connection, referrerAddress);
    
    if (!referrerSig) {
      return {
        success: false,
        error: 'Referral code not found - user does not exist'
      };
    }
    
    // Decrypt referrer's sig
    const referrerState = await decryptSigFromBackend(referrerSig);
    
    console.log('Found referrer state:', referrerState);
    
    // Verify the referral code matches
    console.log('Comparing referral codes:', {
      entered: referralCode,
      inState: referrerState.rf,
      match: referrerState.rf === referralCode
    });
    
    if (referrerState.rf !== referralCode) {
      return {
        success: false,
        error: `Referral code mismatch: entered "${referralCode}" but found "${referrerState.rf}"`
      };
    }
    
    // Can't refer yourself
    const userReferralCode = userWalletAddress.slice(0, 3) + userWalletAddress.slice(-3);
    if (referralCode === userReferralCode) {
      return {
        success: false,
        error: 'You cannot use your own referral code'
      };
    }
    
    console.log('Referrer verified successfully');
    
    // Step 3: Create updated state for USER (with rb set and +40 bonus points)
    const updatedUserState: UserState = {
      u: userState.u,
      w: userState.w,
      rf: userState.rf,
      rb: referralCode,  // Set rb to the referral code used
      rc: userState.rc,
      p: userState.p + 40  // Add 40 bonus points directly to blockchain
    };
    
    console.log('Updated user state (with +40 referral bonus):', updatedUserState);
    
    // Get new sig for user from backend
    console.log('Requesting new sig for user from backend...');
    const userNewSig = await requestSig(updatedUserState);
    
    console.log('User sig received, length:', userNewSig.length);
    const userMemoData = userNewSig;  // Just the sig, no prefix
    
    // Step 4: Create updated state for REFERRER (with rc incremented and +50 bonus points)
    const newReferralCount = referrerState.rc + 1;
    console.log('Incrementing referral count:', referrerState.rc, '->', newReferralCount);
    
    const updatedReferrerState: UserState = {
      u: referrerState.u,
      w: referrerState.w,
      rf: referrerState.rf,
      rb: referrerState.rb,
      rc: newReferralCount,
      p: referrerState.p + 50  // Add 50 bonus points for getting a referral
    };
    
    console.log('Updated referrer state (with +50 referral bonus):', updatedReferrerState);
    
    // Get new sig for referrer from backend
    console.log('Requesting new sig for referrer from backend...');
    const referrerNewSig = await requestSig(updatedReferrerState);
    
    console.log('Referrer sig received, length:', referrerNewSig.length);
    const referrerMemoData = referrerNewSig;  // Just the sig, no prefix
    
    // Step 5: Create ONE transaction with TWO transfers (to both addresses)
    const userPublicKey = new PublicKey(userWalletAddress);
    
    console.log('🔍 DEBUG - Transaction details:', {
      userWallet: userWalletAddress,
      userAddress: userAddresses.referralAddress.toString(),
      referrerAddress: referrerAddress.toString(),
      userRbBefore: userState.rb,
      userRbAfter: updatedUserState.rb,
      referrerRbBefore: referrerState.rb,
      referrerRbAfter: updatedReferrerState.rb,
      userPointsBefore: userState.p,
      userPointsAfter: updatedUserState.p,
      referrerRcBefore: referrerState.rc,
      referrerRcAfter: updatedReferrerState.rc
    });
    
    const transfers = [
      {
        toPubkey: userAddresses.referralAddress,
        memoData: userMemoData,
        lamports: 0  // Just update memo, no SOL transfer needed
      },
      {
        toPubkey: referrerAddress,
        memoData: referrerMemoData,
        lamports: 0  // Just update memo, no SOL transfer needed
      }
    ];
    
    console.log('Creating single transaction with two transfers...');
    const transaction = createMultipleTransferMemoTransaction(userPublicKey, transfers);
    
    console.log('Sending referral verification transaction...');
    const txSignature = await sendTransaction(connection, transaction, signTransaction);
    console.log('Both sigs updated! Transaction:', txSignature);
    
    console.log('Referral verification successful!');
    
    // Update localStorage - add 40 points directly to blockchain points
    const currentBlockchainPoints = parseInt(localStorage.getItem('desocial_points') || '0', 10);
    const newBlockchainPoints = currentBlockchainPoints + 40;
    localStorage.setItem('desocial_points', newBlockchainPoints.toString());
    
    // Update user data with new points
    const userData = localStorage.getItem('desocial_userdata');
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        parsed.points = newBlockchainPoints;
        parsed.referredBy = referralCode;
        localStorage.setItem('desocial_userdata', JSON.stringify(parsed));
      } catch (error) {
        console.error('Failed to update user data:', error);
      }
    }
    
    // Mark referral as used and bonus as claimed (since it's added directly)
    localStorage.setItem('desocial_referral_used', 'true');
    localStorage.setItem('desocial_referredby', referralCode);
    localStorage.setItem('desocial_referral_bonus_claimed', 'true'); // Already added to blockchain
    console.log('✅ Updated localStorage: referral used, +40 points added to blockchain');
    
    // Trigger points update
    window.dispatchEvent(new CustomEvent('pointsUpdated'));
    
    return {
      success: true,
      referrerData: {
        username: referrerState.u,
        referralCode: referrerState.rf,
        referralCount: referrerState.rc,
        newReferralCount: newReferralCount
      },
      signature: txSignature  // Single transaction signature
    };
    
  } catch (error) {
    console.error('Referral verification failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Referral verification failed'
    };
  }
}

/**
 * Check if referral code is valid (without incrementing) - SIG-ONLY
 */
export async function checkReferralCode(
  referralCode: string,
  connection: Connection
): Promise<{ valid: boolean; error?: string; referrerUsername?: string }> {
  try {
    console.log('Checking referral code:', referralCode);
    
    // Validate referral code format
    if (!referralCode || referralCode.length !== 6) {
      return {
        valid: false,
        error: 'Invalid referral code format (must be 6 characters)'
      };
    }
    
    // Derive referrer's address from referral code using backend API
    let referrerAddress: PublicKey;
    
    try {
      const response = await fetch(getApiUrl(API_ENDPOINTS.DERIVE_ADDRESS), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          referralCode: referralCode  // Send RF code to backend
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          valid: false,
          error: `Failed to derive referrer address: ${response.status} - ${errorText}`
        };
      }

      const result = await response.json();
      referrerAddress = new PublicKey(result.referralAddress);
      
      console.log('Referrer address derived from RF code:', referrerAddress.toString());
      
      // Fetch referrer's latest sig
      const referrerSig = await getLatestMemo(connection, referrerAddress);
      
      if (!referrerSig) {
        return {
          valid: false,
          error: 'Referral code not found'
        };
      }
      
      // Decrypt sig
      const referrerState = await decryptSigFromBackend(referrerSig);
      
      // Verify code matches
      console.log('Comparing referral codes in check:', {
        entered: referralCode,
        inState: referrerState.rf,
        match: referrerState.rf === referralCode
      });
      
      if (referrerState.rf !== referralCode) {
        return {
          valid: false,
          error: `Referral code mismatch: entered "${referralCode}" but found "${referrerState.rf}"`
        };
      }
      
      return {
        valid: true,
        referrerUsername: referrerState.u
      };
      
    } catch (error) {
      console.error('Failed to derive referrer address:', error);
      return {
        valid: false,
        error: 'Failed to generate referrer address from referral code'
      };
    }
    
  } catch (error) {
    console.error('Referral code check failed:', error);
    return {
      valid: false,
      error: 'Failed to check referral code'
    };
  }
}
