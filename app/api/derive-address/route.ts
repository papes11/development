import { NextRequest, NextResponse } from 'next/server';
import { PublicKey } from '@solana/web3.js';
import { derivePath } from 'ed25519-hd-key';
import * as bip39 from 'bip39';
import nacl from 'tweetnacl';

/**
 * Get project mnemonic from environment (server-side only)
 */
function getProjectMnemonic(): string {
  const mnemonic = process.env.PROJECT_MNEMONIC;
  
  if (!mnemonic) {
    throw new Error('PROJECT_MNEMONIC environment variable is required');
  }
  
  if (!bip39.validateMnemonic(mnemonic)) {
    throw new Error('Invalid project mnemonic');
  }
  
  return mnemonic;
}

/**
 * Derives a Solana address from project mnemonic and seed string
 */
function deriveFromMnemonic(mnemonic: string, seedString: string): PublicKey {
  // Validate mnemonic
  if (!bip39.validateMnemonic(mnemonic)) {
    throw new Error('Invalid mnemonic phrase');
  }

  // Convert seed string to derivation path
  const seed = bip39.mnemonicToSeedSync(mnemonic);
  
  // Create a simple hash of the seed string for derivation
  const seedHash = Array.from(new TextEncoder().encode(seedString))
    .reduce((acc, byte) => acc + byte, 0) % 2147483647; // Keep within valid range
  
  const derivationPath = `m/44'/501'/${seedHash}'/0'`;
  const derivedSeed = derivePath(derivationPath, seed.toString('hex')).key;
  
  const keyPair = nacl.sign.keyPair.fromSeed(derivedSeed);
  return new PublicKey(keyPair.publicKey);
}

/**
 * API endpoint to derive user-specific addresses
 * 
 * POST /api/derive-address
 * Body: { walletAddress?: string, referralCode?: string }
 * Returns: { referralAddress, userRegAddress, pointsAddress, refCode }
 * 
 * Two modes:
 * 1. walletAddress: Generate refCode from wallet, then derive address
 * 2. referralCode: Use provided refCode directly to derive address
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress, referralCode } = body;

    let refCode: string;

    if (referralCode) {
      // Mode 2: Use provided referral code directly
      if (typeof referralCode !== 'string' || referralCode.length !== 6) {
        return NextResponse.json(
          { error: 'Invalid referral code (must be 6 characters)' },
          { status: 400 }
        );
      }
      refCode = referralCode;
      console.log('Using provided referral code:', refCode);
      
    } else if (walletAddress) {
      // Mode 1: Generate refCode from wallet address
      if (typeof walletAddress !== 'string') {
        return NextResponse.json(
          { error: 'Invalid wallet address' },
          { status: 400 }
        );
      }
      refCode = walletAddress.slice(0, 3) + walletAddress.slice(-3);
      console.log('Generated refCode from wallet:', refCode);
      
    } else {
      return NextResponse.json(
        { error: 'Either walletAddress or referralCode is required' },
        { status: 400 }
      );
    }
    
    // Get project mnemonic
    const mnemonic = getProjectMnemonic();
    
    // Derive user-specific address using refCode
    const referralAddress = deriveFromMnemonic(mnemonic, `USER_${refCode}`);
    
    const result = {
      referralAddress: referralAddress.toString(),
      userRegAddress: referralAddress.toString(), // Same as referral
      pointsAddress: referralAddress.toString(),  // Same as referral
      refCode
    };

    console.log('Address derivation:', {
      walletAddress: walletAddress || 'N/A',
      referralCode: referralCode || 'N/A',
      refCode,
      referralAddress: referralAddress.toString()
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('Address derivation error:', error);
    return NextResponse.json(
      { error: 'Address derivation failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}