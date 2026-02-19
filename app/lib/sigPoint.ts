/**
 * sig-point API integration
 * 
 * Handles cryptographic verification of points to prevent client-side tampering
 */

import { getApiUrl, API_ENDPOINTS } from './apiUtils';

interface SigPointRequest {
  previousPoints: number;
  newPoints: number;
  walletAddress: string;
  bonusPoints?: number;
}

interface SigPointResponse {
  total_points: number;
  signature: string;
  bonus_applied: number;
}

/**
 * Request signed points from backend
 * 
 * Flow:
 * 1. Send previous total + newly collected points
 * 2. Backend adds bonus points and generates signature
 * 3. Returns total_points + signature for UI display and validation
 */
export async function requestSignedPoints(data: SigPointRequest): Promise<SigPointResponse> {
  try {
    console.log('Requesting signed points:', data);

    const response = await fetch(getApiUrl(API_ENDPOINTS.SIG_POINT), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('sig-point API error:', response.status, errorText);
      throw new Error(`Failed to get signed points: ${response.status}`);
    }

    const result: SigPointResponse = await response.json();
    console.log('Signed points received:', result);
    return result;

  } catch (error) {
    console.error('sig-point request failed:', error);
    throw new Error(`Point signing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Verify signature with backend
 */
export async function verifySignature(
  signature: string,
  totalPoints: number,
  walletAddress: string,
  bonusApplied: number
): Promise<boolean> {
  try {
    const params = new URLSearchParams({
      signature,
      total_points: totalPoints.toString(),
      wallet: walletAddress,
      bonus_applied: bonusApplied.toString()
    });

    const response = await fetch(`/api/sig-point?${params}`);
    
    if (!response.ok) {
      console.error('Signature verification failed:', response.status);
      return false;
    }

    const result = await response.json();
    return result.valid === true;

  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

/**
 * Store signed points data in localStorage
 */
export function storeSignedPoints(data: SigPointResponse, walletAddress: string): void {
  const signedData = {
    ...data,
    wallet: walletAddress,
    timestamp: Date.now()
  };

  localStorage.setItem('desocial_signed_points', JSON.stringify(signedData));
  console.log('Signed points stored:', signedData);
}

/**
 * Get stored signed points data
 */
export function getStoredSignedPoints(): (SigPointResponse & { wallet: string; timestamp: number }) | null {
  try {
    const stored = localStorage.getItem('desocial_signed_points');
    if (!stored) return null;

    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to parse stored signed points:', error);
    return null;
  }
}

/**
 * Calculate bonus points based on user state
 */
export function calculateBonusPoints(
  walletConnected: boolean,
  accountVerified: boolean,
  referralUsed: boolean,
  referralCount: number
): number {
  let bonusPoints = 0;

  if (walletConnected) bonusPoints += 20; // +20 pts
  if (accountVerified) bonusPoints += 40; // +40 pts
  if (referralUsed) bonusPoints += 40; // +40 pts
  bonusPoints += referralCount * 50; // +50 pts per referral

  return bonusPoints;
}

/**
 * Get purchased bonus points
 */
export function getPurchasedBonusPoints(): number {
  try {
    const bonusPurchases = localStorage.getItem('desocial_bonus_purchases');
    if (!bonusPurchases) return 0;
    
    const purchases = JSON.parse(bonusPurchases);
    return purchases.reduce((total: number, purchase: any) => total + (purchase.points || 0), 0);
  } catch (error) {
    console.error('Failed to get purchased bonus points:', error);
    return 0;
  }
}