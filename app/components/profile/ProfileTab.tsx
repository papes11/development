import { motion } from 'motion/react';
import { UserHeader } from './UserHeader';
import { ReferralSection } from './ReferralSection';
import { ReferralTab } from './ReferralTab';
import { LogoutButton } from './LogoutButton';
import { RescanButton } from './RescanButton';
import WalletConnection from '../../wallets/WalletConnection';
import { Verify } from './Verify';
import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { UserStateDisplay, generateReferralCode } from '../../solana/memo';

interface ProfileTabProps {
  username: string;
  userData: UserStateDisplay | null;
  onLogout: () => void;
}

export function ProfileTab({ username, userData, onLogout }: ProfileTabProps) {
  const [isVerified, setIsVerified] = useState(false);
  const [userReferralCode, setUserReferralCode] = useState('000000');
  const { publicKey } = useWallet();

  const handleVerificationChange = (verified: boolean) => {
    setIsVerified(verified);
  };

  const handleDataUpdate = (newUserData: UserStateDisplay) => {
    if (newUserData.isValid) {
      setIsVerified(true);
      setUserReferralCode(newUserData.referralCode);
    }
  };

  // Initialize from userData prop or localStorage
  useEffect(() => {
    // If wallet is connected, always use wallet-derived code
    if (publicKey) {
      const refCode = generateReferralCode(publicKey.toString());
      setUserReferralCode(refCode);
    } else if (userData) {
      // No wallet, use userData if available
      setUserReferralCode(userData.referralCode || '000000');
    } else {
      // No wallet, no userData, check localStorage
      const storedRefCode = localStorage.getItem('desocial_refcode');
      if (storedRefCode) {
        setUserReferralCode(storedRefCode);
      }
    }
    
    // Set verification status
    if (userData) {
      setIsVerified(userData.isValid);
    } else {
      const storedVerification = localStorage.getItem('desocial_verified');
      if (storedVerification === 'true') {
        setIsVerified(true);
      }
    }
  }, [userData, publicKey]);

  // Format referral count
  const formatReferralCount = () => {
    return userData?.referralCount?.toString() || "0";
  };

  // Calculate bonus points with milestones:
  // - Wallet connected: +20 pts
  // - Account verified: +40 pts
  // - Used referral code: +40 pts
  // - Each referral: +50 pts
  const calculateBonusPoints = () => {
    let bonusPoints = 0;
    
    // Wallet connected: +20 pts
    if (publicKey) {
      bonusPoints += 20;
    }
    
    // Account verified: +40 pts
    if (isVerified) {
      bonusPoints += 40;
    }
    
    // Used referral code: +40 pts
    if (userData?.referredBy) {
      bonusPoints += 40;
    }
    
    // Each referral: +50 pts
    const rc = userData?.referralCount || 0;
    bonusPoints += rc * 50;
    
    return bonusPoints.toLocaleString() + " pts";
  };

  return (
    <div className="pb-1 px-5 pt-6">
      {/* User Header */}
      <UserHeader 
        username={username}
        verified={isVerified}
      />

      {/* Solana Wallet Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mb-6"
      >
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">
          SOLANA WALLET
        </h2>
        <div className="p-4 backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl">
          <WalletConnection />
        </div>
      </motion.div>

      {/* Verification Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mb-6"
      >
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">
          ACCOUNT VERIFICATION
        </h2>
        <div className="p-4 backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl">
          <Verify 
            onVerificationChange={handleVerificationChange} 
            isWalletConnected={!!publicKey}
            username={username}
          />
        </div>
      </motion.div>

      {/* Use Referral Code Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mb-6"
      >
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">
          USE REFERRAL CODE
        </h2>
        <div className="p-4 backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl">
          <ReferralTab 
            username={username}
            isAccountVerified={isVerified}
            referredBy={userData?.referredBy}
          />
        </div>
      </motion.div>

      {/* Referral Section */}
      <ReferralSection 
        referralCode={userReferralCode}
        totalReferrals={formatReferralCount()}
        isVerified={isVerified}
      />

      

      {/* Account Management Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mb-6"
      >
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">
          ACCOUNT MANAGEMENT
        </h2>
        <div className="p-4 backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl space-y-3">
          <RescanButton onDataUpdate={handleDataUpdate} />
          <LogoutButton onLogout={onLogout} />
        </div>
      </motion.div>
    </div>
  );
}
