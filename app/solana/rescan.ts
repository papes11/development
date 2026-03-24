/**
 * RESCAN BLOCKCHAIN LOGIC (SIG-ONLY)
 * 
 * This handles the "Rescan Blockchain" button functionality:
 * 1. Derive address from wallet (first3 + last3)
 * 2. Fetch latest sig from blockchain
 * 3. Decrypt sig to get user state
 * 4. Update local state with latest data
 */

import { Connection, PublicKey } from '@solana/web3.js';
import { generateAddresses } from './addressUtils';
import { getLatestMemo, generateReferralCode, UserState, UserStateDisplay, userStateToDisplay } from './memo';
import { decryptSigFromBackend } from './transactionUtils';

export interface RescanResult {
  success: boolean;
  userData?: UserStateDisplay;
  error?: string;
}

/**
 * Rescan blockchain - fetch latest user data and update local state
 */
export async function rescanBlockchain(
  walletAddress: string,
  connection: Connection
): Promise<RescanResult> {
  try {
    console.log('🔍 Starting blockchain rescan for wallet:', walletAddress);
    
    // Generate addresses
    const addresses = await generateAddresses(walletAddress);
    const referralCode = generateReferralCode(walletAddress);
    
    console.log('🔍 Checking address:', addresses.referralAddress.toString());
    console.log('🔍 Expected referral code:', referralCode);
    
    // Fetch latest sig from blockchain (pass wallet address to find correct memo)
    console.log('🔍 Fetching latest memo from blockchain...');
    const sig = await getLatestMemo(connection, addresses.referralAddress, walletAddress);
    
    if (!sig) {
      console.log('❌ No sig found - user not registered');
      
      // Clear localStorage
      localStorage.removeItem('desocial_verified');
      localStorage.removeItem('desocial_refcode');
      localStorage.removeItem('desocial_referralcount');
      localStorage.removeItem('desocial_points');
      localStorage.removeItem('desocial_referredby');
      localStorage.removeItem('desocial_userdata');
      
      return {
        success: false,
        error: 'No account found on blockchain'
      };
    }
    
    console.log('✅ Found sig on blockchain, length:', sig.length, 'chars');
    
    // Handle memo format - might include timestamp
    let cleanSig = sig;
    if (sig.includes(':')) {
      // Remove timestamp if present (format: sig:timestamp)
      cleanSig = sig.split(':')[0];
      console.log('🔧 Removed timestamp from sig, new length:', cleanSig.length, 'chars');
    }
    
    // Decrypt sig to get user state
    console.log('🔓 Decrypting sig...');
    const decryptedData = await decryptSigFromBackend(cleanSig);
    
    console.log('✅ Decrypted user state:', decryptedData);
    
    // Verify wallet address matches
    if (decryptedData.w !== walletAddress) {
      console.warn('❌ Wallet address mismatch:', decryptedData.w, 'vs', walletAddress);
      return {
        success: false,
        error: 'Wallet address mismatch in blockchain data'
      };
    }
    
    // Verify referral code matches
    if (decryptedData.rf !== referralCode) {
      console.warn('❌ Referral code mismatch:', decryptedData.rf, 'vs', referralCode);
      return {
        success: false,
        error: 'Referral code mismatch in blockchain data'
      };
    }
    
    // Convert to UserState format (add username field)
    const userState: UserState = {
      ...decryptedData
    };
    
    // Convert to display format
    const userData = userStateToDisplay(userState, true);
    
    console.log('✅ Rescan successful:', userData);
    
    // Update localStorage with latest data
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
    
    // IMPORTANT: Blockchain is source of truth - always mark achievements as claimed on rescan
    // wallet_connected and verified flags are set above, but achievements_claimed must be set
    // to prevent getBonusPoints() from double-counting them on top of blockchain points
    localStorage.setItem('desocial_achievements_claimed', 'true');
    localStorage.setItem('desocial_referral_bonus_claimed', 'true');
    localStorage.removeItem('desocial_points_proof'); // Blockchain is source of truth
    
    if (userData.points > 500) {
      console.log(`🧹 Blockchain shows ${userData.points} points (> 500), marking all tasks as claimed`);
      
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
    
    if (userData.points > 10000) {
      console.log(`💰 Blockchain shows ${userData.points} points (> 10k), marking bonus purchase as completed`);
      localStorage.setItem('desocial_bonus_purchased', 'true');
    }
    
    console.log('✅ Rescan complete - blockchain is source of truth, achievements marked as claimed');
    
    return {
      success: true,
      userData
    };
    
  } catch (error) {
    console.error('❌ Rescan failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Rescan failed'
    };
  }
}
