/**
 * LOGIN WITH WALLET LOGIC (SIG-ONLY)
 * 
 * This handles the "Login with Wallet" button functionality:
 * 1. Derive address from wallet (first3 + last3)
 * 2. Fetch latest sig from blockchain
 * 3. Decrypt sig to get user state
 * 4. Return user state
 */

import { Connection, PublicKey } from '@solana/web3.js';
import { generateAddresses } from './addressUtils';
import { getLatestMemo, generateReferralCode, UserState, UserStateDisplay, userStateToDisplay } from './memo';
import { decryptSigFromBackend } from './transactionUtils';

export interface LoginResult {
  success: boolean;
  userData?: UserStateDisplay;
  error?: string;
}

/**
 * Login with wallet - fetch and decrypt user data from blockchain
 */
export async function loginWithWallet(
  walletAddress: string,
  connection: Connection
): Promise<LoginResult> {
  try {
    console.log('Login attempt for wallet:', walletAddress);
    
    // Generate addresses
    const addresses = await generateAddresses(walletAddress);
    const referralCode = generateReferralCode(walletAddress);
    
    console.log('Checking address:', addresses.referralAddress.toString());
    
    // Fetch latest sig from blockchain (pass wallet address to find correct memo)
    const sig = await getLatestMemo(connection, addresses.referralAddress, walletAddress);
    
    if (!sig) {
      console.log('No sig found - user not registered');
      return {
        success: false,
        error: 'Wallet not registered'
      };
    }
    
    console.log('Found sig, length:', sig.length, 'chars');
    
    // Decrypt sig to get user state
    console.log('Decrypting sig...');
    const decryptedData = await decryptSigFromBackend(sig);
    
    console.log('Decrypted user state:', decryptedData);
    
    // Verify wallet address matches
    if (decryptedData.w !== walletAddress) {
      console.warn('Wallet address mismatch');
      return {
        success: false,
        error: 'Wallet address mismatch'
      };
    }
    
    // Verify referral code matches
    if (decryptedData.rf !== referralCode) {
      console.warn('Referral code mismatch');
      return {
        success: false,
        error: 'Referral code mismatch'
      };
    }
    
    // Convert to UserState format (decryptedData already has the correct structure)
    const userState: UserState = {
      u: decryptedData.u,
      w: decryptedData.w,
      rf: decryptedData.rf,
      rb: decryptedData.rb,
      rc: decryptedData.rc,
      p: decryptedData.p
    };
    
    // Convert to display format
    const userData = userStateToDisplay(userState, true);
    
    console.log('Login successful:', userData);
    
    // Store in localStorage
    localStorage.setItem('desocial_username', userData.username);
    localStorage.setItem('desocial_verified', 'true');
    localStorage.setItem('desocial_refcode', userData.referralCode);
    localStorage.setItem('desocial_referralcount', userData.referralCount.toString());
    localStorage.setItem('desocial_points', userData.points.toString());
    localStorage.setItem('desocial_referredby', userData.referredBy || 'null');
    localStorage.setItem('desocial_userdata', JSON.stringify(userData));
    
    return {
      success: true,
      userData
    };
    
  } catch (error) {
    console.error('Login failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Login failed'
    };
  }
}
