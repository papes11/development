const MNEMONIC = "security bridge flush protect master organ report path adapt arena trust first";

const SIG = "0hEyOvMwiTZA1AltRRRNoPPvPUsgjPl5YGbqwnOi_lM88SVeKAuFJdl8NIXbpyaXcVy6ruLDjo4DolycqNezs7v_bGvrBB3Ii59H-qKJ87Z8FI57LMbzZBezqz2EpQ:1768980010051"
// ============================================================================
// END OF EDITABLE FIELDS
// ============================================================================

const crypto = require('crypto');
const bip39 = require('bip39');
const fs = require('fs');
const path = require('path');

// ANSI color codes for pretty output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

/**
 * Get project mnemonic from hardcoded value, .env.local, or argument
 */
function getProjectMnemonic(mnemonicArg) {
  // Priority 1: Command line argument
  if (mnemonicArg) {
    if (!bip39.validateMnemonic(mnemonicArg)) {
      throw new Error('Invalid mnemonic provided');
    }
    return mnemonicArg;
  }

  // Priority 2: Hardcoded MNEMONIC constant
  if (MNEMONIC && MNEMONIC.trim() !== '') {
    if (!bip39.validateMnemonic(MNEMONIC)) {
      throw new Error('Invalid hardcoded MNEMONIC');
    }
    return MNEMONIC;
  }

  // Priority 3: Read from .env.local
  const envPath = path.join(process.cwd(), '.env.local');
  
  if (!fs.existsSync(envPath)) {
    throw new Error('.env.local not found. Please set MNEMONIC in code or provide as argument.');
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/PROJECT_MNEMONIC=(.+)/);
  
  if (!match || !match[1]) {
    throw new Error('PROJECT_MNEMONIC not found in .env.local');
  }

  const mnemonic = match[1].trim();
  
  if (!bip39.validateMnemonic(mnemonic)) {
    throw new Error('Invalid mnemonic in .env.local');
  }

  return mnemonic;
}

/**
 * Derive encryption key from mnemonic
 */
function deriveKeyFromMnemonic(mnemonic) {
  // Convert mnemonic to seed (64 bytes)
  const seed = bip39.mnemonicToSeedSync(mnemonic);
  
  // Use the first 32 bytes as the encryption key
  return seed.subarray(0, 32);
}

/**
 * Decrypt sig using AES-256-GCM
 */
function decryptSig(sig, key) {
  try {
    // Convert URL-safe base64 back to standard base64
    let base64 = sig
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    
    // Add padding if needed
    while (base64.length % 4) {
      base64 += '=';
    }
    
    // Decode from base64
    const combined = Buffer.from(base64, 'base64');
    
    // Extract parts: iv (12 bytes) + authTag (16 bytes) + encrypted (rest)
    const iv = combined.subarray(0, 12);
    const authTag = combined.subarray(12, 28);
    const encrypted = combined.subarray(28);
    
    // Create decipher
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    
    // Decrypt
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final()
    ]);
    
    return decrypted.toString('utf8');
  } catch (error) {
    throw new Error(`Decryption failed: ${error.message}`);
  }
}

/**
 * Parse payload string to user state
 */
function parsePayload(payload) {
  const parts = payload.split('|');
  
  if (parts.length !== 6) {
    throw new Error(`Invalid payload format - expected 6 parts, got ${parts.length}`);
  }
  
  return {
    u: parts[0],           // username
    w: parts[1],           // wallet address
    rf: parts[2],          // referral code
    rb: parts[3] === 'null' ? null : parts[3],  // referred by
    rc: parseInt(parts[4], 10),  // referral count
    p: parseInt(parts[5], 10)    // points
  };
}

/**
 * Pretty print user state
 */
function printUserState(userState) {
  console.log(`\n${colors.bright}${colors.cyan}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}║${colors.reset}  ${colors.bright}USER STATE EXTRACTED${colors.reset}                                   ${colors.cyan}║${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}╚════════════════════════════════════════════════════════════╝${colors.reset}\n`);
  
  console.log(`${colors.bright}${colors.yellow}Username:${colors.reset}        ${colors.green}${userState.u}${colors.reset}`);
  console.log(`${colors.bright}${colors.yellow}Wallet:${colors.reset}          ${colors.white}${userState.w}${colors.reset}`);
  console.log(`${colors.bright}${colors.yellow}Referral Code:${colors.reset}   ${colors.magenta}${userState.rf}${colors.reset}`);
  console.log(`${colors.bright}${colors.yellow}Referred By:${colors.reset}     ${userState.rb ? colors.magenta + userState.rb : colors.dim + 'null'}${colors.reset}`);
  console.log(`${colors.bright}${colors.yellow}Referral Count:${colors.reset}  ${colors.cyan}${userState.rc}${colors.reset}`);
  console.log(`${colors.bright}${colors.yellow}Points:${colors.reset}          ${colors.cyan}${userState.p}${colors.reset}\n`);
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);
  
  // Use hardcoded SIG if no arguments provided
  let sig = args[0] || SIG;
  const mnemonicArg = args[1];
  
  // Show usage if no sig available
  if (!sig || sig.trim() === '') {
    console.log(`${colors.bright}${colors.cyan}SIG EXTRACTOR - Offline Decryption Tool${colors.reset}\n`);
    console.log(`${colors.yellow}Usage Option 1 (Edit code):${colors.reset}`);
    console.log(`  1. Edit MNEMONIC and SIG fields at the top of this file`);
    console.log(`  2. Run: node sigextract.js\n`);
    console.log(`${colors.yellow}Usage Option 2 (Command line):${colors.reset}`);
    console.log(`  node sigextract.js <sig>`);
    console.log(`  node sigextract.js <sig> <mnemonic>\n`);
    console.log(`${colors.yellow}Examples:${colors.reset}`);
    console.log(`  node sigextract.js RHw5BGsY22GmjMK0bEbJtzyziAvWB7Jt3LqHQ...`);
    console.log(`  node sigextract.js RHw5BGsY22GmjMK0bEbJtzyziAvWB7Jt3LqHQ... "word1 word2 ... word12"\n`);
    process.exit(0);
  }

  try {
    console.log(`${colors.dim}Decrypting sig...${colors.reset}`);
    
    // Handle timestamp format (sig:timestamp)
    let cleanSig = sig;
    if (sig.includes(':')) {
      cleanSig = sig.split(':')[0];
      console.log(`${colors.dim}Removed timestamp from sig, new length: ${cleanSig.length} chars${colors.reset}`);
    }
    
    // Get mnemonic
    const mnemonic = getProjectMnemonic(mnemonicArg);
    console.log(`${colors.dim}Mnemonic loaded${colors.reset}`);
    
    // Derive key
    const key = deriveKeyFromMnemonic(mnemonic);
    console.log(`${colors.dim}Key derived${colors.reset}`);
    
    // Decrypt sig
    const payload = decryptSig(cleanSig, key);
    console.log(`${colors.dim}Sig decrypted: ${payload}${colors.reset}`);
    
    // Parse payload
    const userState = parsePayload(payload);
    
    // Print result
    printUserState(userState);
    
    // Also output as JSON for scripting
    console.log(`${colors.dim}JSON Output:${colors.reset}`);
    console.log(JSON.stringify(userState, null, 2));
    console.log();
    
  } catch (error) {
    console.error(`\n${colors.red}${colors.bright}ERROR:${colors.reset} ${colors.red}${error.message}${colors.reset}\n`);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

// Export for use as module
module.exports = {
  decryptSig,
  parsePayload,
  deriveKeyFromMnemonic,
  getProjectMnemonic
};
