const { PublicKey } = require('@solana/web3.js');
const { derivePath } = require('ed25519-hd-key');
const bip39 = require('bip39');
const nacl = require('tweetnacl');

// Configuration - Fill these in
const mnemonics = "security bridge flush protect master organ report path adapt arena trust first";
const rf = "5tAcXy"; // Referral code (first3 + last3 of wallet address)

/**
 * Derives a Solana address from mnemonic and seed string
 */
function deriveFromMnemonic(mnemonic, seedString) {
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
 * Generate addresses for a referral code
 */
function generateAddresses(mnemonic, refCode) {
  return {
    referralAddress: deriveFromMnemonic(mnemonic, `USER_${refCode}`),
    userRegAddress: deriveFromMnemonic(mnemonic, `USER_${refCode}`), // Same as referral
    pointsAddress: deriveFromMnemonic(mnemonic, `USER_${refCode}`)   // Same as referral
  };
}

// Main execution
function main() {
  try {
    console.log('=== Address Generator ===');
    console.log('Mnemonic:', mnemonics);
    console.log('Referral Code (rf):', rf);
    console.log('');
    
    // Validate inputs
    if (!mnemonics || mnemonics === "your twelve word mnemonic phrase goes here like this example") {
      console.error('❌ Please set the mnemonics variable with your actual mnemonic phrase');
      return;
    }
    
    if (!rf || rf === "ABC123") {
      console.error('❌ Please set the rf variable with your actual referral code');
      return;
    }
    
    if (!bip39.validateMnemonic(mnemonics)) {
      console.error('❌ Invalid mnemonic phrase');
      return;
    }
    
    // Generate addresses
    const addresses = generateAddresses(mnemonics, rf);
    
    console.log('Generated Addresses:');
    console.log('===================');
    console.log('Referral Address:', addresses.referralAddress.toString());
    console.log('User Reg Address:', addresses.userRegAddress.toString());
    console.log('Points Address:  ', addresses.pointsAddress.toString());
    console.log('');
    console.log('✅ All addresses generated successfully!');
    console.log('');
    console.log('Note: All three addresses are the same in the current implementation.');
    console.log('The referral address is used for storing user data and points.');
    
  } catch (error) {
    console.error('❌ Error generating addresses:', error.message);
  }
}

// Export functions for use as module
module.exports = {
  deriveFromMnemonic,
  generateAddresses,
  main
};

// Run if called directly
if (require.main === module) {
  main();
}