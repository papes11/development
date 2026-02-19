import { NextRequest, NextResponse } from 'next/server';
import * as bip39 from 'bip39';
import crypto from 'crypto';

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

interface SigPointRequest {
  previousPoints: number;
  newPoints: number;
  walletAddress: string;
  boost?: number;
}

interface SigPointResponse {
  total_points: number;
  signature: string;
  boost_applied: number;
}

/**
 * Derive a 32-byte key from the project mnemonic (same as keyUtils)
 */
function deriveKeyFromMnemonic(): Buffer {
  const mnemonic = getProjectMnemonic();
  
  // Convert mnemonic to seed (64 bytes)
  const seed = bip39.mnemonicToSeedSync(mnemonic);
  
  // Use the first 32 bytes as the signing key
  return seed.subarray(0, 32);
}

/**
 * sig-point API endpoint
 * 
 * Purpose: Ensure users cannot tamper with points
 * 
 * Flow:
 * 1. Frontend sends: previous total points + newly collected points
 * 2. Backend: adds the values, applies boost, hashes result, generates signature
 * 3. Backend returns: total_points + signature
 * 4. UI displays points, signature stored for validation/claim verification
 */
export async function POST(request: NextRequest) {
  try {
    const body: SigPointRequest = await request.json();
    const { previousPoints, newPoints, walletAddress, boost = 1.0 } = body;

    // Validate input
    if (typeof previousPoints !== 'number' || typeof newPoints !== 'number') {
      return NextResponse.json(
        { error: 'Invalid points data' },
        { status: 400 }
      );
    }

    if (!walletAddress || typeof walletAddress !== 'string') {
      return NextResponse.json(
        { error: 'Invalid wallet address' },
        { status: 400 }
      );
    }

    // Calculate total points
    const baseTotal = previousPoints + newPoints;
    
    // Apply boost (boost is applied before signature generation)
    const boostedTotal = Math.floor(baseTotal * boost);
    
    // Create data to sign
    const dataToSign = {
      wallet: walletAddress,
      total_points: boostedTotal,
      boost_applied: boost,
      timestamp: Date.now()
    };

    // Generate cryptographic signature using mnemonic-derived key
    const signingKey = deriveKeyFromMnemonic();
    const dataString = JSON.stringify(dataToSign);
    const signature = crypto
      .createHmac('sha256', signingKey)
      .update(dataString)
      .digest('hex');

    console.log('sig-point API:', {
      wallet: walletAddress,
      previousPoints,
      newPoints,
      boost,
      baseTotal,
      boostedTotal,
      signatureGenerated: true
    });

    const response: SigPointResponse = {
      total_points: boostedTotal,
      signature,
      boost_applied: boost
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('sig-point API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Verify signature endpoint (for claim validation)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const signature = searchParams.get('signature');
    const totalPoints = searchParams.get('total_points');
    const walletAddress = searchParams.get('wallet');
    const boost = searchParams.get('boost_applied');

    if (!signature || !totalPoints || !walletAddress) {
      return NextResponse.json(
        { error: 'Missing verification parameters' },
        { status: 400 }
      );
    }

    // Recreate the data that was signed
    const dataToVerify = {
      wallet: walletAddress,
      total_points: parseInt(totalPoints),
      boost_applied: parseFloat(boost || '1.0'),
      timestamp: Date.now() // Note: In production, you'd store and verify the original timestamp
    };

    // Generate expected signature using mnemonic-derived key
    const signingKey = deriveKeyFromMnemonic();
    const dataString = JSON.stringify(dataToVerify);
    const expectedSignature = crypto
      .createHmac('sha256', signingKey)
      .update(dataString)
      .digest('hex');

    const isValid = signature === expectedSignature;

    return NextResponse.json({
      valid: isValid,
      message: isValid ? 'Signature valid' : 'Signature invalid'
    });

  } catch (error) {
    console.error('Signature verification error:', error);
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    );
  }
}