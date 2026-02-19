/**
 * Task Points - Handles task completion and task-related points
 * Manages social media tasks and their point rewards
 */

/**
 * Task points mapping - defines how many points each task gives
 */
export const TASK_POINTS_MAP: Record<string, number> = {
  'Follow us on X': 100,
  'Like our post': 50,
  'Repost our content': 75,
  'Comment on our post': 25
};

/**
 * Get task points from completed tasks
 */
export { getTaskPoints } from './homepoint';

/**
 * Check if a specific task has been claimed for points
 */
export function isTaskClaimed(taskTitle: string): boolean {
  try {
    const taskClaimStatus = JSON.parse(localStorage.getItem('desocial_task_claim_status') || '{}');
    return taskClaimStatus[taskTitle] === true;
  } catch (error) {
    console.error('Failed to check task claim status:', error);
    return false;
  }
}

/**
 * Get tasks with their completion and claim status
 */
export function getTasksWithClaimStatus(): Array<{
  title: string;
  points: number;
  completed: boolean;
  claimed: boolean;
}> {
  try {
    const completedTasks = getCompletedTasks();
    const taskClaimStatus = JSON.parse(localStorage.getItem('desocial_task_claim_status') || '{}');
    
    return Object.keys(TASK_POINTS_MAP).map(taskTitle => ({
      title: taskTitle,
      points: TASK_POINTS_MAP[taskTitle],
      completed: !!completedTasks[taskTitle],
      claimed: taskClaimStatus[taskTitle] === true
    }));
  } catch (error) {
    console.error('Failed to get tasks with claim status:', error);
    return [];
  }
}

/**
 * Add task points when a task is completed
 */
export function addTaskPoints(taskTitle: string, points: number): void {
  try {
    // Mark task as completed
    const claimedTasks = JSON.parse(localStorage.getItem('desocial_claimed_tasks') || '{}');
    claimedTasks[taskTitle] = true;
    localStorage.setItem('desocial_claimed_tasks', JSON.stringify(claimedTasks));
    
    console.log(`✅ Task "${taskTitle}" completed! +${points} points added`);
    
    // Dispatch event to update all components
    window.dispatchEvent(new CustomEvent('pointsUpdated'));
  } catch (error) {
    console.error('Failed to add task points:', error);
  }
}

/**
 * Get completed tasks list
 */
export function getCompletedTasks(): Record<string, boolean> {
  try {
    const claimedTasks = localStorage.getItem('desocial_claimed_tasks');
    if (!claimedTasks) {
      return {};
    }
    return JSON.parse(claimedTasks);
  } catch (error) {
    console.error('Failed to get completed tasks:', error);
    return {};
  }
}

/**
 * Check if a specific task is completed
 */
export function isTaskCompleted(taskTitle: string): boolean {
  try {
    const completedTasks = getCompletedTasks();
    return !!completedTasks[taskTitle];
  } catch (error) {
    console.error('Failed to check task completion:', error);
    return false;
  }
}

/**
 * Get task completion statistics
 */
export function getTaskStats(): {
  totalTasks: number;
  completedTasks: number;
  claimedTasks: number;
  completionRate: number;
  totalPointsEarned: number;
  availablePoints: number;
  claimablePoints: number;
} {
  try {
    const completedTasks = getCompletedTasks();
    const taskClaimStatus = JSON.parse(localStorage.getItem('desocial_task_claim_status') || '{}');
    
    const totalTasks = Object.keys(TASK_POINTS_MAP).length;
    const completedCount = Object.values(completedTasks).filter(Boolean).length;
    const completionRate = totalTasks > 0 ? (completedCount / totalTasks) * 100 : 0;
    
    let totalPointsEarned = 0;
    let availablePoints = 0;
    let claimablePoints = 0;
    let claimedCount = 0;
    
    Object.keys(TASK_POINTS_MAP).forEach(taskTitle => {
      const points = TASK_POINTS_MAP[taskTitle];
      const isCompleted = completedTasks[taskTitle];
      const isClaimed = taskClaimStatus[taskTitle] === true;
      
      if (isCompleted && isClaimed) {
        totalPointsEarned += points;
        claimedCount++;
      } else if (isCompleted && !isClaimed) {
        claimablePoints += points;
      } else if (!isCompleted) {
        availablePoints += points;
      }
    });
    
    return {
      totalTasks,
      completedTasks: completedCount,
      claimedTasks: claimedCount,
      completionRate,
      totalPointsEarned,
      availablePoints,
      claimablePoints
    };
  } catch (error) {
    console.error('Failed to get task stats:', error);
    return {
      totalTasks: 0,
      completedTasks: 0,
      claimedTasks: 0,
      completionRate: 0,
      totalPointsEarned: 0,
      availablePoints: 0,
      claimablePoints: 0
    };
  }
}

/**
 * Reset all task progress (admin function)
 */
export function resetAllTasks(): void {
  try {
    localStorage.removeItem('desocial_claimed_tasks');
    console.log('🔄 All tasks reset');
    
    // Dispatch event to update all components
    window.dispatchEvent(new CustomEvent('pointsUpdated'));
  } catch (error) {
    console.error('Failed to reset tasks:', error);
  }
}

/**
 * Get available tasks with their completion status
 */
export function getTasksWithStatus(): Array<{
  title: string;
  points: number;
  completed: boolean;
}> {
  try {
    const completedTasks = getCompletedTasks();
    
    return Object.keys(TASK_POINTS_MAP).map(taskTitle => ({
      title: taskTitle,
      points: TASK_POINTS_MAP[taskTitle],
      completed: !!completedTasks[taskTitle]
    }));
  } catch (error) {
    console.error('Failed to get tasks with status:', error);
    return [];
  }
}