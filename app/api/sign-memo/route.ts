import { NextRequest, NextResponse } from 'next/server';
import { createPayload, parsePayload } from '../../solana/memo';
import crypto from 'crypto';
import * as bip39 from 'bip39';

// Get project mnemonic from environment (server-side only)
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
 * Derive a 32-byte key from the project mnemonic
 */
function deriveKeyFromMnemonic(): Buffer {
  const mnemonic = getProjectMnemonic();
  
  // Convert mnemonic to seed (64 bytes)
  const seed = bip39.mnemonicToSeedSync(mnemonic);
  
  // Use the first 32 bytes as the encryption key
  return seed.subarray(0, 32);
}

/**
 * Encrypt payload using AES-256-GCM (same as keyUtils)
 */
function encryptPayload(payload: string): string {
  try {
    console.log('API: Encrypting payload:', payload);
    
    // Get key from mnemonic
    const key = deriveKeyFromMnemonic();
    
    // Generate random IV (12 bytes for GCM)
    const iv = crypto.randomBytes(12);
    
    // Create cipher
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    
    // Encrypt
    const encrypted = Buffer.concat([
      cipher.update(payload, 'utf8'),
      cipher.final()
    ]);
    
    // Get auth tag
    const authTag = cipher.getAuthTag();
    
    // Combine all parts into single buffer: iv + authTag + encrypted
    const combined = Buffer.concat([iv, authTag, encrypted]);
    
    // Convert to URL-safe base64 (no padding, replace +/ with -_)
    const result = combined.toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
    
    console.log('API: Encrypted sig length:', result.length, 'chars');
    
    return result;
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error(`Failed to encrypt payload: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Decrypt sig using AES-256-GCM (same as keyUtils)
 */
function decryptSig(sig: string): string {
  try {
    console.log('API: Decrypting sig, length:', sig.length);
    
    // Get key from mnemonic
    const key = deriveKeyFromMnemonic();
    
    // Convert URL-safe base64 back to standard base64
    let base64 = sig
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    
    // Add padding if needed
    while (base64.length % 4) {
      base64 += '=';
    }
    
    console.log('API: Base64 length after padding:', base64.length);
    
    // Decode from base64
    const combined = Buffer.from(base64, 'base64');
    console.log('API: Combined buffer length:', combined.length);
    
    // Extract parts: iv (12 bytes) + authTag (16 bytes) + encrypted (rest)
    if (combined.length < 28) {
      throw new Error('Invalid sig format - too short');
    }
    
    const iv = combined.subarray(0, 12);
    const authTag = combined.subarray(12, 28);
    const encrypted = combined.subarray(28);
    
    console.log('API: IV length:', iv.length, 'AuthTag length:', authTag.length, 'Encrypted length:', encrypted.length);
    
    // Create decipher
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    
    // Decrypt
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final()
    ]);
    
    const payload = decrypted.toString('utf8');
    console.log('API: Decrypted payload:', payload);
    
    return payload;
  } catch (error) {
    console.error('API: Decryption failed:', error);
    throw new Error(`Failed to decrypt sig: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * API endpoint to create or decrypt sig
 * 
 * POST /api/sign-memo
 * 
 * Two modes:
 * 1. CREATE: Encrypt user state into sig
 *    Body: { u, w, rf, rb, rc, p }
 *    Returns: { sig }
 * 
 * 2. DECRYPT: Decrypt sig back to user state
 *    Body: { sig }
 *    Returns: { u, w, rf, rb, rc, p }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Mode 1: CREATE sig from user state
    if (body.u && body.w && body.rf !== undefined && 
        typeof body.rc === 'number' && typeof body.p === 'number') {
      
      console.log('API: Creating sig from user state:', {
        u: body.u,
        w: body.w,
        rf: body.rf,
        rb: body.rb,
        rc: body.rc,
        p: body.p
      });
      
      // Create payload
      const payload = createPayload(
        body.u,
        body.w,
        body.rf,
        body.rb || null,
        body.rc,
        body.p
      );
      
      console.log('API: Payload:', payload);
      
      // Encrypt payload into sig
      const sig = encryptPayload(payload);
      
      console.log('API: Generated sig length:', sig.length, 'chars');
      
      return NextResponse.json({ sig });
    }
    
    // Mode 2: DECRYPT sig to user state
    if (body.sig && typeof body.sig === 'string') {
      console.log('API: Decrypting sig to user state');
      
      // Decrypt sig
      const payload = decryptSig(body.sig);
      
      // Parse payload
      const userState = parsePayload(payload);
      
      if (!userState) {
        return NextResponse.json(
          { error: 'Invalid payload format after decryption' },
          { status: 400 }
        );
      }
      
      console.log('API: Decrypted user state:', userState);
      
      return NextResponse.json(userState);
    }
    
    // Invalid request
    return NextResponse.json(
      { error: 'Invalid request - provide either user state (u,w,rf,rb,rc,p) or sig' },
      { status: 400 }
    );
    
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Operation failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}