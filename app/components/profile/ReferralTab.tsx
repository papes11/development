"use client";
import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { verifyReferral, checkReferralCode } from '../../solana/referralButton';

interface ReferralTabProps {
  username: string;
  isAccountVerified: boolean;
  referredBy?: string | null;
}

export function ReferralTab({ username, isAccountVerified, referredBy }: ReferralTabProps) {
  const [referralCode, setReferralCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [referrerUsername, setReferrerUsername] = useState<string | null>(null);
  const [hasUsedReferral, setHasUsedReferral] = useState(false);
  
  const { connection } = useConnection();
  const { publicKey, signTransaction } = useWallet();

  // Check if user has already used a referral code (from blockchain or localStorage)
  useState(() => {
    // First check if referredBy is provided from blockchain data
    if (referredBy) {
      setHasUsedReferral(true);
      return;
    }
    
    // Otherwise check localStorage
    const usedReferral = localStorage.getItem('desocial_used_referral');
    if (usedReferral === 'true') {
      setHasUsedReferral(true);
    }
  });

  const handleVerifyReferral = async () => {
    if (!referralCode.trim() || referralCode.length !== 6) {
      setMessage({ type: 'error', text: 'Please enter a valid 6-character referral code' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    setIsVerifying(true);
    setMessage({ type: 'info', text: 'Checking referral code...' });

    try {
      // Step 1: Always check if referral code is valid first
      const checkResult = await checkReferralCode(referralCode.trim(), connection);
      
      if (!checkResult.valid) {
        setMessage({ type: 'error', text: checkResult.error || 'Invalid referral code' });
        // Auto-clear error message after 3 seconds
        setTimeout(() => setMessage(null), 3000);
        setIsVerifying(false);
        return;
      }

      // Step 2: If wallet is NOT connected, just show success message
      if (!publicKey || !signTransaction) {
        setMessage({ 
          type: 'success', 
          text: `Valid referral code from @${checkResult.referrerUsername}! Connect wallet to use it.` 
        });
        setIsVerifying(false);
        return;
      }

      // Step 3: If wallet IS connected but account not verified
      if (!isAccountVerified) {
        setMessage({ 
          type: 'success', 
          text: `Valid referral code from @${checkResult.referrerUsername}! Verify your account to use it.` 
        });
        setIsVerifying(false);
        return;
      }

      // Step 4: If wallet connected AND account verified, proceed with verification
      setMessage({ type: 'info', text: `Verifying referral from @${checkResult.referrerUsername}...` });

      const result = await verifyReferral({
        referralCode: referralCode.trim(),
        userWalletAddress: publicKey.toString(),
        username: username,
        connection,
        signTransaction
      });

      if (result.success && result.referrerData) {
        setMessage({ 
          type: 'success', 
          text: `Referral verified! @${result.referrerData.username}'s count: ${result.referrerData.referralCount} → ${result.referrerData.newReferralCount}` 
        });
        setHasUsedReferral(true);
        localStorage.setItem('desocial_used_referral', 'true');
        localStorage.setItem('desocial_referrer_code', referralCode.trim());
        
        // Clear input after success
        setTimeout(() => {
          setReferralCode('');
          setReferrerUsername(null);
        }, 3000);
      } else {
        setMessage({ type: 'error', text: result.error || 'Referral verification failed' });
        // Auto-clear error message after 3 seconds
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (error) {
      console.error('Referral verification error:', error);
      setMessage({ type: 'error', text: 'Failed to verify referral code' });
      // Auto-clear error message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setIsVerifying(false);
    }
  };

  // If user already used a referral
  if (hasUsedReferral) {
    // Use referredBy from blockchain data if available, otherwise from localStorage
    const usedCode = referredBy || localStorage.getItem('desocial_referrer_code') || 'XXXXXX';
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 backdrop-blur-xl bg-green-500/10 border border-green-500/30 rounded-2xl text-center"
      >
        <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-6 h-6 text-green-400" />
        </div>
        <h3 className="text-green-300 font-semibold mb-2">Referral Used</h3>
        <p className="text-green-400/80 text-sm">
          You were referred by: <span className="font-mono font-bold">{usedCode}</span>
        </p>
        <p className="text-green-400/60 text-xs mt-2">
          You can only use one referral code per account
        </p>
      </motion.div>
    );
  }

  // Main referral input form (no wallet or verification check needed)
  return (
    <div className="space-y-4">
      {/* Input Field */}
      <div className="space-y-2">
        <label className="text-xs text-gray-400 uppercase tracking-wider">
          Referral Code (6 characters)
        </label>
        <input
          type="text"
          value={referralCode}
          onChange={(e) => setReferralCode(e.target.value)}
          placeholder="ABC123"
          maxLength={6}
          className="w-full h-12 px-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 transition-all font-mono text-center text-lg tracking-wider"
          disabled={isVerifying}
        />
      </div>

      {/* Single Verify Button - Always enabled with 6 chars */}
      <motion.div
        whileHover={{ scale: (isVerifying || referralCode.length !== 6) ? 1 : 1.02 }}
        whileTap={{ scale: (isVerifying || referralCode.length !== 6) ? 1 : 0.98 }}
      >
        <Button
          onClick={handleVerifyReferral}
          disabled={isVerifying || referralCode.length !== 6}
          className="w-full h-14 bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-xl border border-purple-500/30 hover:border-purple-400/50 text-white font-semibold text-base rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/25 disabled:opacity-50"
        >
          {isVerifying ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              CHECKING...
            </>
          ) : (
            <>
              <UserPlus className="w-5 h-5 mr-2" />
              {!publicKey ? 'CHECK CODE' : !isAccountVerified ? 'CHECK & VERIFY ACCOUNT' : 'VERIFY & USE REFERRAL'}
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
          <div className="w-full bg-gray-700/50 rounded-full h-2">
            <motion.div
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 3, ease: "easeInOut" }}
            />
          </div>
        </motion.div>
      )}

      {/* Message Display */}
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-xl border ${
            message.type === 'success'
              ? 'bg-green-500/10 border-green-500/30 text-green-400'
              : message.type === 'error'
              ? 'bg-red-500/10 border-red-500/30 text-red-400'
              : 'bg-blue-500/10 border-blue-500/30 text-blue-400'
          }`}
        >
          <div className="text-sm font-medium text-center">{message.text}</div>
        </motion.div>
      )}
    </div>
  );
}
