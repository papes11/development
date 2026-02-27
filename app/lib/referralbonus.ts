/**
 * Referral Bonus Points - Separate tracking for referral code usage bonus
 * When user uses a referral code, they get 40 points that need to be claimed
 */

/**
 * Get referral bonus points (40 pts for using a referral code)
 * Only counted if not yet claimed
 */
export function getReferralBonusPoints(): number {
  try {
    // Check if user used a referral code
    const referralUsed = localStorage.getItem('desocial_referral_used') === 'true';
    
    // Check if referral bonus was already claimed
    const referralBonusClaimed = localStorage.getItem('desocial_referral_bonus_claimed') === 'true';
    
    if (referralUsed && !referralBonusClaimed) {
      console.log('🎁 Referral bonus: 40 points (not yet claimed)');
      return 40;
    }
    
    console.log('🎁 Referral bonus: 0 points (not used or already claimed)');
    return 0;
  } catch (error) {
    console.error('Failed to get referral bonus points:', error);
    return 0;
  }
}

/**
 * Mark referral bonus as used (when user enters a referral code)
 */
export function markReferralUsed(referralCode: string): void {
  try {
    localStorage.setItem('desocial_referral_used', 'true');
    localStorage.setItem('desocial_referral_code_used', referralCode);
    console.log('🎁 Marked referral code as used:', referralCode);
    
    // Dispatch event to update all components
    window.dispatchEvent(new CustomEvent('pointsUpdated'));
  } catch (error) {
    console.error('Failed to mark referral as used:', error);
  }
}

/**
 * Mark referral bonus as claimed (called when user claims points)
 */
export function markReferralBonusClaimed(): void {
  try {
    localStorage.setItem('desocial_referral_bonus_claimed', 'true');
    console.log('🎁 Marked referral bonus as claimed');
    
    // Dispatch event to update all components
    window.dispatchEvent(new CustomEvent('pointsUpdated'));
  } catch (error) {
    console.error('Failed to mark referral bonus as claimed:', error);
  }
}

/**
 * Check if user has used a referral code
 */
export function hasUsedReferralCode(): boolean {
  try {
    return localStorage.getItem('desocial_referral_used') === 'true';
  } catch (error) {
    console.error('Failed to check referral usage:', error);
    return false;
  }
}

/**
 * Check if referral bonus has been claimed
 */
export function isReferralBonusClaimed(): boolean {
  try {
    return localStorage.getItem('desocial_referral_bonus_claimed') === 'true';
  } catch (error) {
    console.error('Failed to check referral bonus claim status:', error);
    return false;
  }
}

/**
 * Get referral bonus status for UI
 */
export function getReferralBonusStatus(): {
  hasBonus: boolean;
  bonusAmount: number;
  isClaimed: boolean;
  referralCode: string | null;
} {
  try {
    const referralUsed = hasUsedReferralCode();
    const bonusClaimed = isReferralBonusClaimed();
    const referralCode = localStorage.getItem('desocial_referral_code_used');
    
    return {
      hasBonus: referralUsed && !bonusClaimed,
      bonusAmount: referralUsed && !bonusClaimed ? 40 : 0,
      isClaimed: bonusClaimed,
      referralCode
    };
  } catch (error) {
    console.error('Failed to get referral bonus status:', error);
    return {
      hasBonus: false,
      bonusAmount: 0,
      isClaimed: false,
      referralCode: null
    };
  }
}
