#!/usr/bin/env node

/**
 * SIG CREATOR - Offline Encryption Tool
 * 
 * Create sig from user state without needing the backend API
 * 
 * Usage:
 *   1. Edit the fields below (mnemonic and user state)
 *   2. Run: node sigcreate.js
 *   
 *   OR use command line:
 *   node sigcreate.js <username> <wallet> <referralCode> <referredBy> <referralCount> <points>
 */

// ============================================================================
// EDIT THESE FIELDS
// ============================================================================

const MNEMONIC = "security bridge flush protect master organ report path adapt arena trust first";

// User State
const USERNAME = "123";
const WALLET = "5tAGt4aFT9Eqom5DJKht3uJUsYkVq5FHHy2mrRmiFcXy";
const REFERRAL_CODE = "5tAcXy";
const REFERRED_BY = null;  // null or "ABC123"
const REFERRAL_COUNT = 0;
const POINTS = 100;

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
 * Create payload string from user state
 */
function createPayload(u, w, rf, rb, rc, p) {
  return `${u}|${w}|${rf}|${rb || 'null'}|${rc}|${p}`;
}

/**
 * Encrypt payload using AES-256-GCM
 */
function encryptPayload(payload, key) {
  try {
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
    
    return result;
  } catch (error) {
    throw new Error(`Encryption failed: ${error.message}`);
  }
}

/**
 * Pretty print sig creation
 */
function printResult(userState, payload, sig, sigWithTimestamp) {
  console.log(`\n${colors.bright}${colors.cyan}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}║${colors.reset}  ${colors.bright}SIG CREATED SUCCESSFULLY${colors.reset}                              ${colors.cyan}║${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}╚════════════════════════════════════════════════════════════╝${colors.reset}\n`);
  
  console.log(`${colors.bright}${colors.yellow}Input State:${colors.reset}`);
  console.log(`  Username:        ${colors.green}${userState.u}${colors.reset}`);
  console.log(`  Wallet:          ${colors.white}${userState.w}${colors.reset}`);
  console.log(`  Referral Code:   ${colors.magenta}${userState.rf}${colors.reset}`);
  console.log(`  Referred By:     ${userState.rb ? colors.magenta + userState.rb : colors.dim + 'null'}${colors.reset}`);
  console.log(`  Referral Count:  ${colors.cyan}${userState.rc}${colors.reset}`);
  console.log(`  Points:          ${colors.cyan}${userState.p}${colors.reset}\n`);
  
  console.log(`${colors.bright}${colors.yellow}Payload:${colors.reset}`);
  console.log(`  ${colors.dim}${payload}${colors.reset}\n`);
  
  console.log(`${colors.bright}${colors.yellow}Encrypted Sig (Clean):${colors.reset}`);
  console.log(`  ${colors.green}${sig}${colors.reset}\n`);
  
  console.log(`${colors.bright}${colors.yellow}Sig with Timestamp (App Format):${colors.reset}`);
  console.log(`  ${colors.cyan}${sigWithTimestamp}${colors.reset}\n`);
  
  console.log(`${colors.bright}${colors.yellow}Sig Length:${colors.reset} ${colors.cyan}${sig.length}${colors.reset} characters (clean) / ${colors.cyan}${sigWithTimestamp.length}${colors.reset} characters (with timestamp)\n`);
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);
  
  // Use hardcoded values if no arguments provided
  let u, w, rf, rb, rc, p, mnemonicArg;
  
  if (args.length >= 6) {
    // Command line arguments
    u = args[0];
    w = args[1];
    rf = args[2];
    rb = args[3] === 'null' ? null : args[3];
    rc = parseInt(args[4], 10);
    p = parseInt(args[5], 10);
    mnemonicArg = args[6];
  } else if (USERNAME && WALLET && REFERRAL_CODE) {
    // Use hardcoded values
    u = USERNAME;
    w = WALLET;
    rf = REFERRAL_CODE;
    rb = REFERRED_BY;
    rc = REFERRAL_COUNT;
    p = POINTS;
  } else {
    // Show usage
    console.log(`${colors.bright}${colors.cyan}SIG CREATOR - Offline Encryption Tool${colors.reset}\n`);
    console.log(`${colors.yellow}Usage Option 1 (Edit code):${colors.reset}`);
    console.log(`  1. Edit MNEMONIC and user state fields at the top of this file`);
    console.log(`  2. Run: node sigcreate.js\n`);
    console.log(`${colors.yellow}Usage Option 2 (Command line):${colors.reset}`);
    console.log(`  node sigcreate.js <username> <wallet> <referralCode> <referredBy> <referralCount> <points>`);
    console.log(`  node sigcreate.js <username> <wallet> <referralCode> <referredBy> <referralCount> <points> <mnemonic>\n`);
    console.log(`${colors.yellow}Examples:${colors.reset}`);
    console.log(`  node sigcreate.js alice 9xQeWvG816bUx9EPfY6sZk8x... 9xQ8x null 0 0`);
    console.log(`  node sigcreate.js alice 9xQeWvG816bUx9EPfY6sZk8x... 9xQ8x ABC123 5 100\n`);
    process.exit(0);
  }

  // Validate inputs
  if (isNaN(rc)) {
    console.error(`\n${colors.red}${colors.bright}ERROR:${colors.reset} ${colors.red}Referral count must be a number${colors.reset}\n`);
    process.exit(1);
  }

  if (isNaN(p)) {
    console.error(`\n${colors.red}${colors.bright}ERROR:${colors.reset} ${colors.red}Points must be a number${colors.reset}\n`);
    process.exit(1);
  }

  try {
    console.log(`${colors.dim}Creating sig...${colors.reset}`);
    
    // Get mnemonic
    const mnemonic = getProjectMnemonic(mnemonicArg);
    console.log(`${colors.dim}Mnemonic loaded${colors.reset}`);
    
    // Derive key
    const key = deriveKeyFromMnemonic(mnemonic);
    console.log(`${colors.dim}Key derived${colors.reset}`);
    
    // Create payload
    const payload = createPayload(u, w, rf, rb, rc, p);
    console.log(`${colors.dim}Payload created: ${payload}${colors.reset}`);
    
    // Encrypt payload
    const sig = encryptPayload(payload, key);
    console.log(`${colors.dim}Payload encrypted${colors.reset}`);
    
    // Add timestamp to make it compatible with app format
    const timestamp = Date.now();
    const sigWithTimestamp = `${sig}:${timestamp}`;
    
    // Print result
    const userState = { u, w, rf, rb, rc, p };
    printResult(userState, payload, sig, sigWithTimestamp);
    
    // Also output as JSON for scripting
    console.log(`${colors.dim}JSON Output:${colors.reset}`);
    console.log(JSON.stringify({ 
      sig, 
      sigWithTimestamp, 
      timestamp,
      userState 
    }, null, 2));
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
  encryptPayload,
  createPayload,
  deriveKeyFromMnemonic,
  getProjectMnemonic
};
