import { PublicKey } from '@solana/web3.js';
import { getApiUrl, API_ENDPOINTS } from '../lib/apiUtils';

// Hardcoded global address (safe to be public)
const DESOCIAL_GLOBAL_ADDRESS = '5tAGt4aFT9Eqom5DJKht3uJUsYkVq5FHHy2mrRmiFcXy';

/**
 * Generate wallet substrings for address derivation
 */
export function getWalletSubstrings(walletAddress: string) {
  return {
    first6: walletAddress.slice(0, 6),
    last6: walletAddress.slice(-6),
    first3: walletAddress.slice(0, 3),
    last3: walletAddress.slice(-3),
    refCode: walletAddress.slice(0, 3) + walletAddress.slice(-3)
  };
}

/**
 * Generate addresses for a wallet by calling backend API for user-specific addresses
 * Global address is hardcoded since it's public and only used for counting
 */
export async function generateAddresses(walletAddress: string) {
  try {
    const response = await fetch(getApiUrl(API_ENDPOINTS.DERIVE_ADDRESS), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ walletAddress }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Backend API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    
    return {
      globalAddress: new PublicKey(DESOCIAL_GLOBAL_ADDRESS), // Hardcoded in frontend
      referralAddress: new PublicKey(result.referralAddress),
      userRegAddress: new PublicKey(result.userRegAddress),
      pointsAddress: new PublicKey(result.pointsAddress),
      refCode: result.refCode
    };
  } catch (error) {
    console.error('Address generation failed:', error);
    throw new Error(`Failed to generate addresses: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate addresses synchronously (legacy compatibility)
 * Note: Returns partial data, use generateAddresses() for full functionality
 */
export function generateAddressesSync(walletAddress: string) {
  const { refCode } = getWalletSubstrings(walletAddress);
  
  return {
    globalAddress: new PublicKey(DESOCIAL_GLOBAL_ADDRESS),
    referralAddress: null, // Backend will derive using PROJECT_MNEMONIC
    userRegAddress: null,  // Backend will derive using PROJECT_MNEMONIC  
    pointsAddress: null,   // Backend will derive using PROJECT_MNEMONIC
    refCode // Used by backend for derivation
  };
}

/**
 * Get the global registry address
 */
export function getGlobalRegistryAddress(): PublicKey {
  return new PublicKey(DESOCIAL_GLOBAL_ADDRESS);
}