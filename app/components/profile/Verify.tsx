"use client";
import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Shield, CheckCircle, Lock, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { verifyAccount } from '../../solana/verifyAccount';

interface VerifyProps {
  onVerificationChange?: (isVerified: boolean) => void;
  isWalletConnected: boolean;
  username: string;
}

export function Verify({ onVerificationChange, isWalletConnected, username }: VerifyProps) {
  const [isVerified, setIsVerified] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { connection } = useConnection();
  const { publicKey, signTransaction } = useWallet();

  // Check verification status from localStorage
  useEffect(() => {
    if (publicKey) {
      const verified = localStorage.getItem('desocial_verified') === 'true';
      setIsVerified(verified);
      onVerificationChange?.(verified);
    } else {
      setIsVerified(false);
      onVerificationChange?.(false);
    }
  }, [publicKey, onVerificationChange]);

  const handleVerify = async () => {
    if (!isWalletConnected || !publicKey || !signTransaction || !username.trim()) {
      setError('Missing requirements for verification');
      return;
    }
    
    // Prevent multiple verification attempts
    if (isVerifying) {
      console.log('Verification already in progress, ignoring duplicate request');
      return;
    }
    
    // Check if already verified
    if (isVerified) {
      setError('Account is already verified');
      return;
    }
    
    // Check for recent verification attempts (cooldown)
    const lastAttempt = localStorage.getItem('desocial_last_verify_attempt');
    if (lastAttempt) {
      const timeSinceLastAttempt = Date.now() - parseInt(lastAttempt);
      if (timeSinceLastAttempt < 10000) { // 10 second cooldown
        const remainingTime = Math.ceil((10000 - timeSinceLastAttempt) / 1000);
        setError(`Please wait ${remainingTime} seconds before trying again`);
        return;
      }
    }
    
    setIsVerifying(true);
    setError(null);
    
    // Store attempt timestamp
    localStorage.setItem('desocial_last_verify_attempt', Date.now().toString());
    
    try {
      const result = await verifyAccount({
        username: username.trim(),
        walletAddress: publicKey.toString(),
        connection,
        signTransaction
      });
      
      if (result.success) {
        setIsVerified(true);
        onVerificationChange?.(true);
        // Clear attempt timestamp on success
        localStorage.removeItem('desocial_last_verify_attempt');
        console.log('Verification successful:', result);
      } else {
        throw new Error(result.error || 'Verification failed');
      }
      
    } catch (error) {
      console.error('Verification error:', error);
      
      let errorMessage = 'Verification failed';
      if (error instanceof Error) {
        if (error.message.includes('already been processed')) {
          errorMessage = 'Transaction already processed. Please wait 10 seconds before trying again.';
        } else if (error.message.includes('Simulation failed')) {
          errorMessage = 'Transaction simulation failed. Please check your wallet balance and try again.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsVerifying(false);
    }
  };

  if (isVerified) {
    return (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex items-center justify-center gap-3 p-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-xl border border-green-500/30 rounded-2xl text-white"
      >
        <CheckCircle className="w-6 h-6 text-green-400" />
        <div className="text-center">
          <div className="font-semibold text-green-400">Account Verified</div>
          <div className="text-xs text-gray-300 mt-1">
            Your account is verified on blockchain
          </div>
        </div>
      </motion.div>
    );
  }

  const canVerify = isWalletConnected && username.trim().length > 0;

  return (
    <div className="space-y-3">
      <motion.div
        whileHover={canVerify ? { scale: 1.02 } : {}}
        whileTap={canVerify ? { scale: 0.98 } : {}}
      >
        <Button
          onClick={handleVerify}
          disabled={isVerifying || !canVerify}
          className={`w-full h-14 backdrop-blur-xl font-semibold text-base rounded-2xl transition-all duration-300 ${
            canVerify 
              ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 hover:border-blue-400/50 text-white hover:shadow-lg hover:shadow-blue-500/25'
              : 'bg-gradient-to-r from-gray-500/20 to-gray-600/20 border border-gray-500/30 text-gray-400 cursor-not-allowed'
          }`}
        >
          {isVerifying ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              VERIFYING...
            </>
          ) : !isWalletConnected ? (
            <>
              <Lock className="w-5 h-5 mr-2" />
              CONNECT WALLET TO VERIFY
            </>
          ) : !username.trim() ? (
            <>
              <Lock className="w-5 h-5 mr-2" />
              USERNAME REQUIRED
            </>
          ) : (
            <>
              <Shield className="w-5 h-5 mr-2" />
              VERIFY ACCOUNT
            </>
          )}
        </Button>
      </motion.div>
      
      {/* Loading Bar */}
      {isVerifying && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="w-full bg-gray-700/50 rounded-full h-2 mt-3">
            <motion.div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 3, ease: "easeInOut" }}
            />
          </div>
        </motion.div>
      )}
      
      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl"
        >
          <div className="text-red-400 text-sm font-medium">Verification Failed</div>
          <div className="text-red-300 text-xs mt-1">{error}</div>
        </motion.div>
      )}
      
      {/* Requirements */}
      {!canVerify && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs text-gray-400 text-center space-y-1"
        >
          <div>Requirements for verification:</div>
          <div className={`${isWalletConnected ? 'text-green-400' : 'text-gray-400'}`}>
            ✓ Wallet connected
          </div>
          <div className={`${username.trim() ? 'text-green-400' : 'text-gray-400'}`}>
            ✓ Username provided
          </div>
        </motion.div>
      )}
    </div>
  );
}
