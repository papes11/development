import * as bip39 from "bip39";
import { Keypair } from "@solana/web3.js";

// Function to generate a new BIP-39 mnemonic and associated Solana Keypair
const generateSolanaWallet = () => {
    // 1. Generate a new 12-word mnemonic phrase (default is 12 words)
    const mnemonic = bip39.generateMnemonic();
    console.log("Mnemonic Phrase:", mnemonic);

    // 2. Convert the mnemonic to a seed
    // The second argument (optional) is a passphrase, which is typically an empty string
    const seed = bip39.mnemonicToSeedSync(mnemonic, "");

    // 3. Derive a Solana Keypair from the first 32 bytes of the seed
    // Solana uses the Ed25519 curve, and the keypair is generated from a 32-byte seed
    const keypair = Keypair.fromSeed(seed.slice(0, 32));

    console.log("Public Key (Address):", keypair.publicKey.toBase58());
    // Note: keypair.secretKey is a Uint8Array containing the full private key
    // You should handle private keys with extreme care and never log them publicly
    
    return { mnemonic, keypair };
};

// Example Usage:
generateSolanaWallet();
