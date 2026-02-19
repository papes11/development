/**
 * Registration Points - Handles initial gift points for new users
 * Manages the 100 point gift system for app installation
 */

/**
 * Get initial gift points for new users (100 points for installing app)
 * Gift persists until user verifies account (then it goes to blockchain)
 */
export { getRegistrationPoints } from './homepoint';

/**
 * Mark gift points as received (called when user first opens app)
 */
export function markGiftReceived(): void {
  try {
    const giftReceived = localStorage.getItem('desocial_gift_received');
    if (!giftReceived) {
      localStorage.setItem('desocial_gift_received', 'true');
      console.log('🎁 Gift marked as received for new user');
      
      // Dispatch event to update all components
      window.dispatchEvent(new CustomEvent('pointsUpdated'));
    }
  } catch (error) {
    console.error('Failed to mark gift as received:', error);
  }
}

/**
 * Clear gift points (called when user verifies account)
 */
export function clearGiftPoints(): void {
  try {
    localStorage.setItem('desocial_gift_claimed', 'true');
    console.log('🎁 Gift points cleared - moved to blockchain');
    
    // Dispatch event to update all components
    window.dispatchEvent(new CustomEvent('pointsUpdated'));
  } catch (error) {
    console.error('Failed to clear gift points:', error);
  }
}

/**
 * Check if user is eligible for gift points
 */
export function isEligibleForGift(): boolean {
  try {
    const isVerified = localStorage.getItem('desocial_verified') === 'true';
    const giftClaimed = localStorage.getItem('desocial_gift_claimed') === 'true';
    
    // Eligible if not verified and gift not claimed
    return !isVerified && !giftClaimed;
  } catch (error) {
    console.error('Failed to check gift eligibility:', error);
    return false;
  }
}

/**
 * Get gift status for UI display
 */
export function getGiftStatus(): {
  hasGift: boolean;
  giftAmount: number;
  reason: string;
} {
  try {
    const isVerified = localStorage.getItem('desocial_verified') === 'true';
    const giftClaimed = localStorage.getItem('desocial_gift_claimed') === 'true';
    
    if (isVerified) {
      return {
        hasGift: false,
        giftAmount: 0,
        reason: 'Gift moved to blockchain after verification'
      };
    }
    
    if (giftClaimed) {
      return {
        hasGift: false,
        giftAmount: 0,
        reason: 'Gift already claimed'
      };
    }
    
    return {
      hasGift: true,
      giftAmount: 100,
      reason: 'Welcome gift for new users'
    };
  } catch (error) {
    console.error('Failed to get gift status:', error);
    return {
      hasGift: false,
      giftAmount: 0,
      reason: 'Error checking gift status'
    };
  }
}