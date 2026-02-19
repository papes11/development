/**
 * 🧮 DeSocial Points Model (FINAL – MATCHES YOUR UX)
 * 
 * ✅ Stored State (ONLY 2 VALUES):
 * - blockchainPoints: claimed, on-chain total
 * - totalPoints: lifetime total earned
 * 
 * ✅ Derived Values (FORMULAS – LOCKED):
 * - HOME = totalPoints
 * - CLAIMED = blockchainPoints  
 * - CLAIMABLE = totalPoints - blockchainPoints
 * 
 * 🔁 USER FLOW:
 * 1. New User: totalPoints=100, blockchainPoints=0 → Home=100, Claimable=100, Claimed=0
 * 2. After Verify: totalPoints=100, blockchainPoints=100 → Home=100, Claimable=0, Claimed=100
 * 3. Earn More: totalPoints=500, blockchainPoints=100 → Home=500, Claimable=400, Claimed=100
 * 4. Claim: totalPoints=500, blockchainPoints=500 → Home=500, Claimable=0, Claimed=500
 */

// Import modular point systems
import { getTotalPoints, getUsagePoints, getBonusPoints, addUsagePoints, getBlockchainPoints, getTaskPoints, getRegistrationPoints } from './homepoint';
import { getClaimablePoints, claimPointsOnBlockchain, calculateClaimPoints, type PointsData } from './claimpoint';
import { markGiftReceived, clearGiftPoints, isEligibleForGift, getGiftStatus } from './registrationpoint';
import { addTaskPoints, getCompletedTasks, isTaskCompleted, getTaskStats, resetAllTasks, getTasksWithStatus, TASK_POINTS_MAP, isTaskClaimed, getTasksWithClaimStatus } from './taskpoint';

// Re-export all functions for backward compatibility
export {
  // Home Points
  getTotalPoints,
  getUsagePoints,
  getBonusPoints,
  addUsagePoints,
  
  // Claim Points
  getBlockchainPoints,
  getClaimablePoints,
  claimPointsOnBlockchain,
  calculateClaimPoints,
  type PointsData,
  
  // Registration Points
  getRegistrationPoints,
  markGiftReceived,
  clearGiftPoints,
  isEligibleForGift,
  getGiftStatus,
  
  // Task Points
  getTaskPoints,
  addTaskPoints,
  getCompletedTasks,
  isTaskCompleted,
  isTaskClaimed,
  getTaskStats,
  resetAllTasks,
  getTasksWithStatus,
  getTasksWithClaimStatus,
  TASK_POINTS_MAP
};

/**
 * FINAL MODEL IMPLEMENTATION (Main function for components)
 * CLAIMABLE = totalPoints - blockchainPoints
 */
export function calculatePoints(): PointsData {
  const blockchainPoints = getBlockchainPoints();
  const usagePoints = getUsagePoints();
  const taskPoints = getTaskPoints();
  const bonusPoints = getBonusPoints();
  const giftPoints = getRegistrationPoints();
  
  // Total = Blockchain + Current unclaimed earnings + Gift
  const totalPoints = blockchainPoints + usagePoints + taskPoints + bonusPoints + giftPoints;
  
  // LOCKED FORMULA: CLAIMABLE = totalPoints - blockchainPoints
  const claimablePoints = Math.max(0, totalPoints - blockchainPoints);
  
  console.log('📊 Points Calculation (FINAL MODEL - DEBUG):', {
    blockchainPoints,    // What's on blockchain
    usagePoints,         // Current usage points
    taskPoints,          // Current task points  
    bonusPoints,         // Current bonus points
    giftPoints,          // New user gift (100 pts)
    totalPoints,         // Blockchain + unclaimed + gift
    claimablePoints,     // Should equal: usage + task + bonus + gift
    'EXPECTED_TOTAL': `${giftPoints} gift + ${taskPoints} tasks + ${bonusPoints} bonus + ${usagePoints} usage + ${blockchainPoints} blockchain = ${totalPoints}`
  });
  
  return {
    totalPoints,
    blockchainPoints,
    claimablePoints
  };
}

/**
 * Listen for points updates
 */
export function createPointsListener(callback: (points: PointsData) => void): () => void {
  const handleUpdate = () => {
    const points = calculatePoints();
    callback(points);
  };
  
  // Initial calculation
  handleUpdate();
  
  // Listen for updates
  window.addEventListener('pointsUpdated', handleUpdate);
  
  // Return cleanup function
  return () => {
    window.removeEventListener('pointsUpdated', handleUpdate);
  };
}