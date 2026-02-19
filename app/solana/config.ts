import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';

/**
 * Solana configuration - hardcoded for deployment
 */
export const SOLANA_CONFIG = {
  // Network configuration (hardcoded)
  network: WalletAdapterNetwork.Devnet,
  
  // RPC endpoint (hardcoded)
  rpcUrl: 'https://api.devnet.solana.com',
  
  // Project mnemonic (from environment)
  projectMnemonic: process.env.NEXT_PUBLIC_PROJECT_MNEMONIC,
  
  // Global registry address (from environment)
  globalRegistryAddress: process.env.NEXT_PUBLIC_DESOCIAL_GLOBAL_ADDRESS,
  
  // Validation
  isValid: () => {
    return !!(
      process.env.NEXT_PUBLIC_PROJECT_MNEMONIC &&
      process.env.NEXT_PUBLIC_DESOCIAL_GLOBAL_ADDRESS
    );
  },
  
  // Get missing environment variables
  getMissingEnvVars: () => {
    const missing: string[] = [];
    
    if (!process.env.NEXT_PUBLIC_PROJECT_MNEMONIC) {
      missing.push('NEXT_PUBLIC_PROJECT_MNEMONIC');
    }
    if (!process.env.NEXT_PUBLIC_DESOCIAL_GLOBAL_ADDRESS) {
      missing.push('NEXT_PUBLIC_DESOCIAL_GLOBAL_ADDRESS');
    }
    
    return missing;
  }
};

/**
 * Validate environment configuration on app start
 */
export function validateSolanaConfig() {
  const missing = SOLANA_CONFIG.getMissingEnvVars();
  
  if (missing.length > 0) {
    console.warn('⚠️  Missing Solana environment variables:', missing);
    console.warn('📝 Please check your .env.local file and add the missing variables');
    console.warn('📋 See .env.example for reference');
  } else {
    console.log('✅ Solana configuration loaded successfully');
    console.log(`🌐 Network: ${SOLANA_CONFIG.network}`);
    console.log(`🔗 RPC: ${SOLANA_CONFIG.rpcUrl}`);
    console.log(`🏛️  Global Registry: ${SOLANA_CONFIG.globalRegistryAddress}`);
    console.log('🔐 Project keypair will be derived from mnemonic');
  }
  
  return missing.length === 0;
}