/**
 * VERIFY ACCOUNT LOGIC (SIG-ONLY)
 * 
 * This handles the "Verify Account" button functionality:
 * 1. Create user state (u, w, rf, rb=null, rc=0, p=0)
 * 2. Get sig from backend (encrypted state)
 * 3. Send transaction with sig only
 * 4. Store verification status
 */

import { Connection, PublicKey } from '@solana/web3.js';
import { generateAddresses } from './addressUtils';
import { generateReferralCode, UserState } from './memo';
import { createMultipleTransferMemoTransaction, sendTransaction, requestSig, getMinimumRentExempt } from './transactionUtils';

export interface VerifyAccountParams {
  username: string;
  walletAddress: string;
  connection: Connection;
  signTransaction: (transaction: any) => Promise<any>;
}

export interface VerifyAccountResult {
  success: boolean;
  signature?: string;
  error?: string;
  userData?: UserState;
}

/**
 * Verify account - sends transaction with sig-only memo to blockchain
 */
export async function verifyAccount(params: VerifyAccountParams): Promise<VerifyAccountResult> {
  const { username, walletAddress, connection, signTransaction } = params;
  
  try {
    // Check if already verified
    const alreadyVerified = localStorage.getItem('desocial_verified') === 'true';
    if (alreadyVerified) {
      console.log('Account already verified, skipping verification');
      return {
        success: false,
        error: 'Account is already verified'
      };
    }
    
    console.log('Starting account verification for:', walletAddress);
    
    // Get minimum rent exempt amount
    const rentExemptMinimum = await getMinimumRentExempt(connection);
    console.log('Rent-exempt minimum:', rentExemptMinimum, 'lamports');
    
    // Generate addresses
    const addresses = await generateAddresses(walletAddress);
    const referralCode = generateReferralCode(walletAddress);
    const userPublicKey = new PublicKey(walletAddress);
    
    console.log('Derived addresses:', {
      global: addresses.globalAddress.toString(),
      userRef: addresses.referralAddress.toString()
    });
    
    // Get current total points from the points system (includes gift + any earned points)
    // Import getTotalPoints dynamically to avoid circular dependency
    let currentTotalPoints = 100; // Default gift
    try {
      const giftPoints = localStorage.getItem('desocial_gift_claimed') === 'true' ? 0 : 100;
      const usageProof = localStorage.getItem('desocial_points_proof');
      const usagePoints = usageProof ? JSON.parse(usageProof).points || 0 : 0;
      
      // Calculate total points user has earned so far
      currentTotalPoints = giftPoints + usagePoints;
      console.log('Current total points before verification:', currentTotalPoints, {
        giftPoints,
        usagePoints
      });
    } catch (error) {
      console.error('Failed to calculate current points, using default 100:', error);
    }
    
    // Create initial user state (rc=0, rb=null)
    const userState: UserState = {
      u: username,
      w: walletAddress,
      rf: referralCode,
      rb: null,  // No referral code used yet
      rc: 0,     // Initial referral count
      p: currentTotalPoints  // Use current total points (includes gift + earned)
    };
    
    console.log('Initial user state:', userState);
    
    // Get sig from backend (encrypted state)
    console.log('Requesting sig from backend...');
    const sig = await requestSig(userState);
    
    console.log('Sig received, length:', sig.length, 'chars');
    
    // Add timestamp to make transaction unique
    const timestamp = Date.now();
    const memoData = `${sig}:${timestamp}`;
    
    console.log('Memo data prepared with timestamp:', timestamp);
    
    // Create 2 transfers:
    // 1. Global address - 0 SOL (just count users)
    // 2. User/Referral address - rent exempt + sig memo (user data)
    const transfers = [
      {
        toPubkey: addresses.globalAddress,
        memoData: "",
        lamports: 0
      },
      {
        toPubkey: addresses.referralAddress,
        memoData: memoData,
        lamports: rentExemptMinimum
      }
    ];
    
    // Create and send transaction
    console.log('Creating transaction...');
    const transaction = createMultipleTransferMemoTransaction(userPublicKey, transfers);
    
    console.log('Sending verification transaction...');
    const txSignature = await sendTransaction(connection, transaction, signTransaction);
    
    console.log('Verification successful! Transaction:', txSignature);
    
    // Store verification in localStorage
    localStorage.setItem('desocial_verified', 'true');
    localStorage.setItem('desocial_refcode', referralCode);
    localStorage.setItem('desocial_referralcount', '0');
    localStorage.setItem('desocial_points', currentTotalPoints.toString()); // Set blockchain points to current total
    localStorage.setItem('desocial_referredby', 'null');
    localStorage.setItem('desocial_userdata', JSON.stringify(userState)); // Store user data
    
    // Mark gift as claimed since it's now on blockchain
    localStorage.setItem('desocial_gift_claimed', 'true');
    
    // Clear usage points since they're now on blockchain
    localStorage.removeItem('desocial_points_proof');
    
    // Trigger points update to refresh UI immediately
    console.log('🔄 Triggering points update after verification');
    window.dispatchEvent(new CustomEvent('pointsUpdated'));
    
    return {
      success: true,
      signature: txSignature,
      userData: userState
    };
    
  } catch (error) {
    console.error('Verification failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}
