/**
 * FRONTEND KEY UTILITIES (NO MNEMONIC ACCESS)
 * 
 * This file provides cryptographic utilities for the frontend.
 * Mnemonic-based operations are handled by backend APIs.
 * 
 * For encryption/decryption operations, use the backend APIs:
 * - /api/sign-memo (create/decrypt sigs)
 * - /api/sig-point (generate point signatures)
 */

import { getApiUrl, API_ENDPOINTS } from '../lib/apiUtils';

/**
 * Verify sig by calling backend API
 * 
 * Returns true if backend can successfully decrypt the sig
 */
export async function verifySig(sig: string): Promise<boolean> {
  try {
    const response = await fetch(getApiUrl(API_ENDPOINTS.SIGN_MEMO), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sig }),
    });

    if (!response.ok) {
      return false;
    }

    const result = await response.json();
    
    // If we get a valid user state back, sig is valid
    return !!(result.u && result.w && result.rf !== undefined);
  } catch (error) {
    console.error('Sig verification failed:', error);
    return false;
  }
}

/**
 * Create encrypted sig by calling backend API
 * 
 * Sends user state to backend, receives encrypted sig
 */
export async function createSig(userState: {
  u: string;
  w: string;
  rf: string;
  rb: string | null;
  rc: number;
  p: number;
}): Promise<string> {
  try {
    const response = await fetch(getApiUrl(API_ENDPOINTS.SIGN_MEMO), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userState),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Backend API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    
    if (!result.sig) {
      throw new Error('No sig returned from backend');
    }

    return result.sig;
  } catch (error) {
    console.error('Sig creation failed:', error);
    throw new Error(`Failed to create sig: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Decrypt sig by calling backend API
 * 
 * Sends sig to backend, receives decrypted user state
 */
export async function decryptSig(sig: string): Promise<{
  u: string;
  w: string;
  rf: string;
  rb: string | null;
  rc: number;
  p: number;
}> {
  try {
    const response = await fetch(getApiUrl(API_ENDPOINTS.SIGN_MEMO), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sig }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Backend API error: ${response.status} - ${errorText}`);
    }

    const userState = await response.json();
    
    if (!userState.u || !userState.w || userState.rf === undefined) {
      throw new Error('Invalid user state returned from backend');
    }

    return userState;
  } catch (error) {
    console.error('Sig decryption failed:', error);
    throw new Error(`Failed to decrypt sig: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
