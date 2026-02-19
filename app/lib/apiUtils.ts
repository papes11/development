/**
 * API URL utilities for web environment
 */

const VERCEL_BASE_URL = 'https://sigpoints.vercel.app';

/**
 * Get the correct API URL based on environment
 * - In development: uses relative paths (local API)
 * - In production: uses relative paths (deployed API)
 */
export function getApiUrl(endpoint: string): string {
  // Always use relative paths for web environment
  console.log(`🏠 Using API: ${endpoint}`);
  return endpoint;
}

/**
 * Common API endpoints
 */
export const API_ENDPOINTS = {
  SIGN_MEMO: '/api/sign-memo',
  SIG_POINT: '/api/sig-point',
  DERIVE_ADDRESS: '/api/derive-address'
} as const;