import { Connection, PublicKey } from '@solana/web3.js';
import { getApiUrl, API_ENDPOINTS } from '../lib/apiUtils';

/**
 * SIG-ONLY MEMO DESIGN (COMPACT)
 * 
 * The blockchain stores ONLY: compact sig (no prefix)
 * 
 * sig = encrypt(u|w|rf|rb|rc|p, PROJECT_SECRET_KEY)
 * 
 * Format: URL-safe base64, no padding, no separators
 * Example: RHw5BGsY22GmjMK0bEbJtzyziAvWB7Jt3LqHQsnsgJUtu7k21r4KJCJDwO7h6NLWY52xsV7tGoaJR9fxjn76bdn7iuR1kGpApSkdqx3GL3duKWMuLU3ZBx6E3w
 * 
 * All user data is encrypted inside sig.
 * Users never see internal fields.
 */

export interface UserState {
  u: string;      // username
  w: string;      // wallet address
  rf: string;     // referral code (first3 + last3)
  rb: string | null;  // referred by (referral code used, null if none)
  rc: number;     // referral count
  p: number;      // points
}

export interface UserStateDisplay {
  username: string;
  walletAddress: string;
  referralCode: string;
  referredBy: string | null;
  referralCount: number;
  points: number;
  isValid: boolean;
}

/**
 * Generate referral code from wallet address (first3 + last3)
 */
export function generateReferralCode(walletAddress: string): string {
  return walletAddress.slice(0, 3) + walletAddress.slice(-3);
}

/**
 * Create canonical payload string for encryption
 * Format: u|w|rf|rb|rc|p (with pipe delimiter)
 */
export function createPayload(u: string, w: string, rf: string, rb: string | null, rc: number, p: number): string {
  return `${u}|${w}|${rf}|${rb || 'null'}|${rc}|${p}`;
}

/**
 * Parse payload string back to UserState
 */
export function parsePayload(payload: string): UserState | null {
  try {
    const parts = payload.split('|');
    
    if (parts.length !== 6) {
      console.warn('Invalid payload format - expected 6 parts');
      return null;
    }
    
    return {
      u: parts[0],
      w: parts[1],
      rf: parts[2],
      rb: parts[3] === 'null' ? null : parts[3],
      rc: parseInt(parts[4], 10),
      p: parseInt(parts[5], 10)
    };
  } catch (error) {
    console.error('Failed to parse payload:', error);
    return null;
  }
}

/**
 * Get latest memo (sig only) from blockchain
 * When a transaction has multiple memos, find the one for this specific address
 */
export async function getLatestMemo(
  connection: Connection,
  address: PublicKey,
  walletAddress?: string  // Optional: to verify which memo belongs to this user
): Promise<string | null> {
  try {
    console.log('Fetching latest memo from address:', address.toString());
    
    // Get recent transactions
    const signatures = await connection.getSignaturesForAddress(address, { limit: 10 });
    
    if (signatures.length === 0) {
      console.log('No transactions found');
      return null;
    }
    
    // Check each transaction for memo data
    for (const sig of signatures) {
      try {
        const tx = await connection.getTransaction(sig.signature, {
          commitment: 'confirmed',
          maxSupportedTransactionVersion: 0
        });
        
        if (tx?.meta?.logMessages) {
          // Collect all memos from this transaction
          const memos: string[] = [];
          
          // Look for memo program logs
          for (const log of tx.meta.logMessages) {
            if (log.includes('Program log: Memo')) {
              // Extract memo data from log
              // Format: "Program log: Memo (len XX): "DATA""
              const memoMatch = log.match(/Program log: Memo \(len \d+\): "(.+)"/);
              if (memoMatch && memoMatch[1]) {
                try {
                  // Unescape the string
                  let memoData = memoMatch[1];
                  memoData = memoData.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
                  
                  console.log('Found memo data:', memoData);
                  memos.push(memoData);
                } catch (parseError) {
                  console.warn('Failed to parse memo:', parseError);
                  continue;
                }
              }
            }
          }
          
          // If we have memos, try to find the right one
          if (memos.length > 0) {
            console.log(`Found ${memos.length} memo(s) in transaction`);
            
            // If wallet address provided, decrypt each memo and find the matching one
            if (walletAddress && memos.length > 1) {
              for (const memo of memos) {
                try {
                  // Try to decrypt and check if wallet matches
                  const response = await fetch(getApiUrl(API_ENDPOINTS.SIGN_MEMO), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sig: memo }),
                  });
                  
                  if (response.ok) {
                    const userState = await response.json();
                    if (userState.w === walletAddress) {
                      console.log('Found matching memo for wallet:', walletAddress);
                      return memo;
                    }
                  }
                } catch (error) {
                  console.warn('Failed to decrypt memo:', error);
                  continue;
                }
              }
              console.warn('No matching memo found for wallet:', walletAddress);
            }
            
            // Return first memo if no wallet address provided or only one memo
            console.log('Returning first memo, length:', memos[0].length);
            return memos[0];
          }
        }
      } catch (error) {
        console.warn('Failed to parse transaction:', error);
        continue;
      }
    }
    
    console.log('No valid memo found in transactions');
    return null;
    
  } catch (error) {
    console.error('Failed to get latest memo:', error);
    return null;
  }
}

/**
 * Convert UserState to display format
 */
export function userStateToDisplay(state: UserState, isValid: boolean): UserStateDisplay {
  return {
    username: state.u,
    walletAddress: state.w,
    referralCode: state.rf,
    referredBy: state.rb,
    referralCount: state.rc,
    points: state.p,
    isValid
  };
}
