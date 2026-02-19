import { motion } from 'motion/react';
import { ReferralCodeCard } from './ReferralCodeCard';
import { ReferralStatsCard } from './ReferralStatsCard';
import { InviteButton } from './InviteButton';

interface ReferralSectionProps {
  referralCode: string;
  totalReferrals: string;
  isVerified?: boolean;
}

export function ReferralSection({ referralCode, totalReferrals, isVerified = false }: ReferralSectionProps) {
  // Only check isVerified
  const isFullyVerified = isVerified;
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.4 }}
      className="mb-6"
    >
      <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">
        REFERRAL
      </h2>

      {/* Always show Referral Code Display */}
      <ReferralCodeCard referralCode={referralCode} isLocked={!isFullyVerified} />

      {isFullyVerified ? (
        <>
          {/* Referral Stats - Only Total Referrals */}
          <div className="space-y-2.5 mb-5">
            <ReferralStatsCard 
              title="Total Referrals"
              value={totalReferrals}
              icon="👥"
              color="yellow"
            />
          </div>

          {/* Invite Button */}
          <InviteButton />
        </>
      ) : (
        /* Locked Message */
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 p-4 backdrop-blur-xl bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-center"
        >
          <p className="text-yellow-400 text-sm">
            Complete account verification to unlock referral stats and rewards
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}