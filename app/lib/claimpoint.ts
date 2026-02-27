/**
 * Claim Points - Handles blockchain points and claiming functionality
 * Shows: claimedPoints (on-chain) and claimablePoints (derived)
 */

import { getTotalPoints, getBlockchainPoints } from './homepoint';

/**
 * Get blockchain points (CLAIMED - on-chain total)
 * PRIORITY: Blockchain data > localStorage
 */
export { getBlockchainPoints } from './homepoint';

/**
 * Calculate claimable points (DERIVED: totalPoints - blockchainPoints)
 */
export function getClaimablePoints(): number {
  const totalPoints = getTotalPoints();
  const blockchainPoints = getBlockchainPoints();
  return Math.max(0, totalPoints - blockchainPoints);
}

/**
 * Claim points on blockchain (SIMPLE SYNC + CLEAR SOURCES)
 * CLAIM LOGIC: blockchainPoints = totalPoints, then clear unclaimed sources
 */
export function claimPointsOnBlockchain(pointsToClaim: number): void {
  try {
    console.log('🎯 CLAIM START - Before claiming:', {
      pointsToClaim,
      currentTotal: getTotalPoints(),
      currentBlockchain: getBlockchainPoints(),
      currentClaimable: getClaimablePoints()
    });
    
    const currentTotal = getTotalPoints();
    
    // STEP 1: Sync blockchain points to total
    localStorage.setItem('desocial_points', currentTotal.toString());
    
    // STEP 2: Update blockchain user data if it exists
    const userData = localStorage.getItem('desocial_userdata');
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        parsed.points = currentTotal;
        localStorage.setItem('desocial_userdata', JSON.stringify(parsed));
        console.log('📊 Updated blockchain user data to:', currentTotal);
      } catch (error) {
        console.error('Failed to update blockchain user data:', error);
      }
    }
    
    // STEP 3: CLEAR CLAIMABLE SOURCES (but keep task completion records)
    localStorage.removeItem('desocial_points_proof'); // Clear usage points
    // NOTE: No need to clear desocial_bonus_purchases - bonus points go directly to blockchain
    
    // STEP 4: Mark achievements and gift as claimed
    localStorage.setItem('desocial_achievements_claimed', 'true');
    localStorage.setItem('desocial_gift_claimed', 'true'); // Mark gift as claimed
    localStorage.setItem('desocial_referral_bonus_claimed', 'true'); // Mark referral bonus as claimed
    localStorage.setItem('desocial_referral_bonus_claimed', 'true'); // Mark referral bonus as claimed
    
    // STEP 5: Mark individual tasks as claimed (not all at once)
    const claimedTasks = JSON.parse(localStorage.getItem('desocial_claimed_tasks') || '{}');
    const taskClaimStatus = JSON.parse(localStorage.getItem('desocial_task_claim_status') || '{}');
    
    // Mark each completed task as claimed
    Object.keys(claimedTasks).forEach(taskTitle => {
      if (claimedTasks[taskTitle]) {
        taskClaimStatus[taskTitle] = true;
        console.log(`📋 Marked task "${taskTitle}" as claimed`);
      }
    });
    
    localStorage.setItem('desocial_task_claim_status', JSON.stringify(taskClaimStatus));
    
    // KEEP: desocial_claimed_tasks (task completion records - prevent re-claiming)
    // DON'T CLEAR: wallet_connected, verified, referral status (permanent achievements)
    
    console.log(`🎉 CLAIM SUCCESS: Moved ${pointsToClaim} points to blockchain`);
    
    // Debug: Check state after claiming
    console.log('🎯 CLAIM END - After claiming:', {
      newTotal: getTotalPoints(),
      newBlockchain: getBlockchainPoints(),
      newClaimable: getClaimablePoints(),
      giftClaimed: localStorage.getItem('desocial_gift_claimed'),
      achievementsClaimed: localStorage.getItem('desocial_achievements_claimed')
    });
    
    // Dispatch event to update all components
    window.dispatchEvent(new CustomEvent('pointsUpdated'));
  } catch (error) {
    console.error('Failed to claim points on blockchain:', error);
  }
}

/**
 * Points data interface for components
 */
export interface PointsData {
  totalPoints: number;      // 🔵 HOME (lifetime total)
  blockchainPoints: number; // 🟢 CLAIMED (on-chain)
  claimablePoints: number;  // 🟡 CLAIMABLE (derived: total - blockchain)
}

/**
 * Calculate all points data for components
 */
export function calculateClaimPoints(): PointsData {
  const blockchainPoints = getBlockchainPoints();
  const totalPoints = getTotalPoints();
  const claimablePoints = getClaimablePoints();
  
  console.log('📊 Claim Points Calculation:', {
    blockchainPoints,    // What's on blockchain
    totalPoints,         // Lifetime total
    claimablePoints,     // What can be claimed
  });
  
  return {
    totalPoints,
    blockchainPoints,
    claimablePoints
  };
}