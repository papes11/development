/**
 * Home Points - Handles total lifetime points calculation for Home tab
 * Shows: totalPoints (lifetime total earned)
 */

/**
 * Get blockchain points (CLAIMED - on-chain total)
 * PRIORITY: Blockchain data > localStorage
 */
function getBlockchainPoints(): number {
  try {
    // PRIORITY 1: Check blockchain user data (from rescan/verification) - MOST ACCURATE
    const userData = localStorage.getItem('desocial_userdata');
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        if (parsed && typeof parsed.points === 'number') {
          console.log('📊 Using blockchain points from userData (PRIORITY 1):', parsed.points);
          return parsed.points;
        }
      } catch (error) {
        console.error('Failed to parse blockchain user data:', error);
      }
    }
    
    // PRIORITY 2: Check localStorage for blockchain points (might be outdated)
    const storedPoints = localStorage.getItem('desocial_points');
    if (storedPoints) {
      const points = parseInt(storedPoints, 10);
      if (!Number.isNaN(points)) {
        console.log('📊 Using blockchain points from localStorage (PRIORITY 2):', points);
        return points;
      }
    }
    
    // PRIORITY 3: Check if verified (means 100 points were sent to blockchain)
    const isVerified = localStorage.getItem('desocial_verified') === 'true';
    if (isVerified) {
      console.log('📊 Verified user fallback (PRIORITY 3): 100 points');
      return 100; // Initial 100 points on blockchain after verification
    }
    
    // PRIORITY 4: New users: 0 points on blockchain
    console.log('📊 New user (PRIORITY 4): 0 blockchain points');
    return 0;
  } catch (error) {
    console.error('Failed to get blockchain points:', error);
    return 0;
  }
}

/**
 * Get task points from completed tasks
 */
function getTaskPoints(): number {
  try {
    const claimedTasks = localStorage.getItem('desocial_claimed_tasks');
    if (!claimedTasks) {
      console.log('📋 No claimed tasks found');
      return 0;
    }
    
    // Get individual task claim status
    const taskClaimStatus = JSON.parse(localStorage.getItem('desocial_task_claim_status') || '{}');
    
    const tasks = JSON.parse(claimedTasks);
    let totalTaskPoints = 0;
    
    // Task points mapping
    const taskPointsMap: Record<string, number> = {
      'Follow us on X': 100,
      'Like our post': 50,
      'Repost our content': 75,
      'Comment on our post': 25
    };
    
    console.log('📋 Calculating task points from:', tasks);
    console.log('📋 Task claim status:', taskClaimStatus);
    
    Object.keys(tasks).forEach(taskTitle => {
      if (tasks[taskTitle] && taskPointsMap[taskTitle]) {
        // Only count points if task is completed but NOT yet claimed
        const isCompleted = tasks[taskTitle];
        const isClaimed = taskClaimStatus[taskTitle] === true;
        
        if (isCompleted && !isClaimed) {
          const points = taskPointsMap[taskTitle];
          totalTaskPoints += points;
          console.log(`📋 Task "${taskTitle}": +${points} pts (completed: ${isCompleted}, claimed: ${isClaimed})`);
        } else if (isCompleted && isClaimed) {
          console.log(`📋 Task "${taskTitle}": completed but already claimed`);
        }
      }
    });
    
    console.log('📋 Total unclaimed task points:', totalTaskPoints);
    return totalTaskPoints;
  } catch (error) {
    console.error('Failed to get task points:', error);
    return 0;
  }
}

/**
 * Get initial gift points for new users (100 points for installing app)
 * Gift persists until user verifies account (then it goes to blockchain)
 */
function getRegistrationPoints(): number {
  try {
    // PRIORITY 1: Check if gift was explicitly claimed/cleared (most important)
    const giftClaimed = localStorage.getItem('desocial_gift_claimed') === 'true';
    console.log('🎁 Gift status check:', {
      giftClaimed,
      giftClaimedRaw: localStorage.getItem('desocial_gift_claimed')
    });
    
    if (giftClaimed) {
      console.log('🎁 Gift was claimed, returning 0');
      return 0;
    }
    
    // PRIORITY 2: Check if user has verified (gift goes to blockchain after verification)
    const isVerified = localStorage.getItem('desocial_verified') === 'true';
    if (isVerified) {
      console.log('🎁 User verified - gift is now on blockchain, returning 0');
      return 0; // Gift is now on blockchain
    }
    
    // PRIORITY 3: For unverified users who haven't claimed, give the gift
    console.log('🎁 Unverified user - giving 100 gift points');
    return 100;
  } catch (error) {
    console.error('Failed to get gift points:', error);
    return 0;
  }
}

/**
 * Get usage points from app tracking
 */
export function getUsagePoints(): number {
  try {
    const pointsProof = localStorage.getItem('desocial_points_proof');
    if (pointsProof) {
      const parsed = JSON.parse(pointsProof);
      return parsed.points || 0;
    }
    return 0;
  } catch (error) {
    console.error('Failed to get usage points:', error);
    return 0;
  }
}

/**
 * Get bonus points from achievements and purchases
 */
export function getBonusPoints(): number {
  try {
    let bonusPoints = 0;
    
    // Check if achievement bonuses have already been claimed
    const achievementsClaimed = localStorage.getItem('desocial_achievements_claimed') === 'true';
    
    if (!achievementsClaimed) {
      // Achievement bonus points (only if not yet claimed)
      const walletConnected = !!localStorage.getItem('desocial_wallet_connected');
      const accountVerified = localStorage.getItem('desocial_verified') === 'true';
      const referralUsed = !!localStorage.getItem('desocial_referral_used');
      
      // Get referral count from blockchain user data (most accurate)
      let referralCount = 0;
      const userData = localStorage.getItem('desocial_userdata');
      if (userData) {
        try {
          const parsed = JSON.parse(userData);
          referralCount = parsed.referralCount || 0;
          console.log('📊 Using referral count from blockchain data:', referralCount);
        } catch (error) {
          console.error('Failed to parse user data for referral count:', error);
          // Fallback to localStorage
          referralCount = parseInt(localStorage.getItem('desocial_referral_count') || '0', 10);
        }
      } else {
        // Fallback to localStorage
        referralCount = parseInt(localStorage.getItem('desocial_referral_count') || '0', 10);
      }
      
      if (walletConnected) bonusPoints += 20;
      if (accountVerified) bonusPoints += 40;
      if (referralUsed) bonusPoints += 40;
      bonusPoints += referralCount * 50;
      
      console.log('📊 Bonus points breakdown:', {
        walletConnected: walletConnected ? 20 : 0,
        accountVerified: accountVerified ? 40 : 0,
        referralUsed: referralUsed ? 40 : 0,
        referralCount: referralCount,
        referralPoints: referralCount * 50,
        total: bonusPoints
      });
    }
    
    // NOTE: Purchased bonus points now go directly to blockchain
    // No need to add them here as they're already in blockchainPoints
    
    return bonusPoints;
  } catch (error) {
    console.error('Failed to get bonus points:', error);
    return 0;
  }
}

/**
 * Get total points (LIFETIME TOTAL EARNED) - Main function for Home tab
 * FIXED: Blockchain points (p field) already includes all claimed points
 * We only add NEW unclaimed points on top of blockchain points
 */
export function getTotalPoints(): number {
  try {
    // Get blockchain points (what's already on-chain - this is the source of truth)
    const blockchainPoints = getBlockchainPoints();
    
    // Get ONLY NEW unclaimed earnings (not yet on blockchain)
    const usagePoints = getUsagePoints();
    const taskPoints = getTaskPoints();
    const bonusPoints = getBonusPoints();
    const giftPoints = getRegistrationPoints();
    
    // CORRECT FORMULA: Blockchain (already claimed) + New unclaimed only
    const newUnclaimedPoints = usagePoints + taskPoints + bonusPoints + giftPoints;
    const total = blockchainPoints + newUnclaimedPoints;
    
    console.log('📊 Total Points Calculation (FIXED):', {
      blockchainPoints,      // From blockchain (p field) - already claimed
      usagePoints,           // New usage points
      taskPoints,            // New task points  
      bonusPoints,           // New bonus points
      giftPoints,            // New gift points
      newUnclaimedPoints,    // Sum of new unclaimed
      total,                 // Blockchain + new unclaimed
      'FORMULA': `${blockchainPoints} (blockchain) + ${newUnclaimedPoints} (new unclaimed) = ${total}`
    });
    
    // FALLBACK: Ensure new users always see at least 100 points
    if (total === 0) {
      console.log('🎁 Fallback: Giving 100 points to ensure user sees something');
      return 100;
    }
    
    return Math.max(total, 0);
  } catch (error) {
    console.error('Failed to get total points:', error);
    return 100; // Default gift for new users
  }
}

// Export the helper functions for use in other modules
export { getBlockchainPoints, getTaskPoints, getRegistrationPoints };

/**
 * Add usage points from native tracking
 */
export function addUsagePoints(points: number, walletAddress: string): void {
  try {
    const pointsProof = {
      points,
      wallet: walletAddress,
      timestamp: Date.now(),
      apps: {},
      signature: '',
      boost_applied: 1
    };
    
    localStorage.setItem('desocial_points_proof', JSON.stringify(pointsProof));
    
    console.log(`📱 Added ${points} usage points`);
    
    // Dispatch event to update all components
    window.dispatchEvent(new CustomEvent('pointsUpdated'));
  } catch (error) {
    console.error('Failed to add usage points:', error);
  }
}