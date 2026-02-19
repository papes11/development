// Bridge between Next.js and native iOS/Android tracking
// Web-only implementation without Capacitor dependencies

interface UsageData {
  newMinutes: Record<string, number>;
  totalNewMinutes: number;
  totalEarnedMinutes: number;
  dailyCap: number;
  remainingMinutes: number;
  isCapped: boolean;
}

// Daily usage cap in minutes (200 minutes = 3.33 hours)
const DAILY_USAGE_CAP = 200;

// Get today's date string for tracking daily usage
const getTodayKey = (): string => {
  const today = new Date();
  return `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
};

// Get daily usage from localStorage
const getDailyUsage = (): { minutes: number; date: string } => {
  try {
    const stored = localStorage.getItem('desocial_daily_usage');
    if (!stored) return { minutes: 0, date: getTodayKey() };
    
    const parsed = JSON.parse(stored);
    const today = getTodayKey();
    
    // Reset if it's a new day
    if (parsed.date !== today) {
      return { minutes: 0, date: today };
    }
    
    return parsed;
  } catch (error) {
    console.error('Failed to get daily usage:', error);
    return { minutes: 0, date: getTodayKey() };
  }
};

// Update daily usage in localStorage
const updateDailyUsage = (minutes: number): void => {
  try {
    const dailyUsage = {
      minutes,
      date: getTodayKey()
    };
    localStorage.setItem('desocial_daily_usage', JSON.stringify(dailyUsage));
  } catch (error) {
    console.error('Failed to update daily usage:', error);
  }
};

// Apply daily cap to usage data
const applyDailyCap = (rawMinutes: number): { cappedMinutes: number; remainingMinutes: number; isCapped: boolean } => {
  const dailyUsage = getDailyUsage();
  const currentDailyTotal = dailyUsage.minutes;
  const availableMinutes = Math.max(0, DAILY_USAGE_CAP - currentDailyTotal);
  
  if (rawMinutes <= availableMinutes) {
    // Under cap, allow all minutes
    const newTotal = currentDailyTotal + rawMinutes;
    updateDailyUsage(newTotal);
    
    return {
      cappedMinutes: rawMinutes,
      remainingMinutes: DAILY_USAGE_CAP - newTotal,
      isCapped: false
    };
  } else {
    // Over cap, limit to available minutes
    const cappedMinutes = availableMinutes;
    updateDailyUsage(DAILY_USAGE_CAP); // Set to max
    
    return {
      cappedMinutes,
      remainingMinutes: 0,
      isCapped: true
    };
  }
};

// Check if running in mobile environment (without Capacitor)
const isMobileEnvironment = () => {
  try {
    return typeof window !== 'undefined' && 
      /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  } catch {
    return false;
  }
};

export async function getUsageData(): Promise<UsageData> {
  try {
    // Web-only implementation - return zeros with cap info
    console.log('Web environment, returning zero data with daily cap info');
    const dailyUsage = getDailyUsage();
    const remainingMinutes = Math.max(0, DAILY_USAGE_CAP - dailyUsage.minutes);
    
    return {
      newMinutes: {},
      totalNewMinutes: 0,
      totalEarnedMinutes: 0,
      dailyCap: DAILY_USAGE_CAP,
      remainingMinutes,
      isCapped: remainingMinutes === 0,
    };
  } catch (error) {
    console.error('Error getting usage data:', error);
    // Return zero data on error with cap info
    const dailyUsage = getDailyUsage();
    const remainingMinutes = Math.max(0, DAILY_USAGE_CAP - dailyUsage.minutes);
    
    return {
      newMinutes: {},
      totalNewMinutes: 0,
      totalEarnedMinutes: 0,
      dailyCap: DAILY_USAGE_CAP,
      remainingMinutes,
      isCapped: remainingMinutes === 0,
    };
  }
}

export async function addMinutesEarned(minutes: number): Promise<void> {
  try {
    console.log('Web environment: Added', minutes, 'minutes');
  } catch (error) {
    console.error('Error adding minutes earned:', error);
  }
}

export async function resetEarnedMinutes(): Promise<void> {
  try {
    console.log('Web environment: Reset earned minutes');
  } catch (error) {
    console.error('Error resetting earned minutes:', error);
  }
}

export async function getTotalMinutesEarned(): Promise<number> {
  try {
    console.log('Web environment: Getting total minutes earned');
    return 0;
  } catch (error) {
    console.error('Error getting total minutes earned:', error);
    return 0;
  }
}

/**
 * Get daily usage statistics
 */
export function getDailyUsageStats(): { 
  usedMinutes: number; 
  remainingMinutes: number; 
  dailyCap: number; 
  isCapped: boolean;
  resetTime: string;
} {
  const dailyUsage = getDailyUsage();
  const remainingMinutes = Math.max(0, DAILY_USAGE_CAP - dailyUsage.minutes);
  const isCapped = remainingMinutes === 0;
  
  // Calculate reset time (midnight)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  const resetTime = tomorrow.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  return {
    usedMinutes: dailyUsage.minutes,
    remainingMinutes,
    dailyCap: DAILY_USAGE_CAP,
    isCapped,
    resetTime
  };
}

/**
 * Export the daily usage cap constant
 */
export { DAILY_USAGE_CAP };
