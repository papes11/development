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
    
    // Mark gift as claimed since user already has points on blockchain
    localStorage.setItem('desocial_gift_claimed', 'true');
    
    // Mark wallet as connected (first time bonus already on blockchain)
    localStorage.setItem('desocial_wallet_connected', 'true');
    
    // If user has referredBy on blockchain, mark referral as used and bonus as claimed
    if (userData.referredBy && userData.referredBy !== 'null') {
      localStorage.setItem('desocial_referral_used', 'true');
      localStorage.setItem('desocial_referral_bonus_claimed', 'true');
      localStorage.setItem('desocial_referral_code_used', userData.referredBy);
      console.log('🎁 User has referral code on blockchain, marking bonus as claimed:', userData.referredBy);
    }
    
    // IMPORTANT: Clear unclaimed points if blockchain shows they were already claimed
    // If blockchain points > 100 (initial), it means user already claimed some points
    if (userData.points > 100) {
      console.log(`🧹 Blockchain shows ${userData.points} points (> 100), clearing unclaimed points`);
      localStorage.removeItem('desocial_points_proof'); // Clear usage points
      localStorage.setItem('desocial_achievements_claimed', 'true'); // Mark achievements as claimed
      localStorage.setItem('desocial_referral_bonus_claimed', 'true'); // Mark referral bonus as claimed
      
      // If points > 500, mark all tasks as claimed (user has claimed task points)
      if (userData.points > 500) {
        console.log(`🧹 Blockchain shows ${userData.points} points (> 500), marking all tasks as claimed`);
        
        // Mark all possible tasks as claimed
        const allTasksClaimed = {
          'Follow us on X': true,
          'Like our post': true,
          'Repost our content': true,
          'Comment on our post': true
        };
        
        const allTasksClaimStatus = {
          'Follow us on X': true,
          'Like our post': true,
          'Repost our content': true,
          'Comment on our post': true
        };
        
        localStorage.setItem('desocial_claimed_tasks', JSON.stringify(allTasksClaimed));
        localStorage.setItem('desocial_task_claim_status', JSON.stringify(allTasksClaimStatus));
        
        console.log('📋 All tasks marked as completed and claimed');
      }
      
      // If points > 10k, mark bonus purchase as completed (user bought 10k bonus)
      if (userData.points > 10000) {
        console.log(`💰 Blockchain shows ${userData.points} points (> 10k), marking bonus purchase as completed`);
        localStorage.setItem('desocial_bonus_purchased', 'true');
        console.log('💰 Bonus purchase marked as completed');
      }
    } else {
      console.log(`📊 Blockchain shows ${userData.points} points, preserving unclaimed points if any`);
    }
    
    // DON'T mark achievements as claimed - user may have unclaimed bonuses
    // They will be marked as claimed when user actually claims points
    
    // Preserve desocial_points_proof (unclaimed usage points) - don't clear it
    console.log('✅ Login complete - preserved unclaimed points if any exist');
    
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
