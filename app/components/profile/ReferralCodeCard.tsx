import { motion } from 'motion/react';
import { useState } from 'react';
import { Lock } from 'lucide-react';

interface ReferralCodeCardProps {
  referralCode: string;
  isLocked?: boolean;
}

export function ReferralCodeCard({ referralCode, isLocked = false }: ReferralCodeCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (isLocked) return;
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Show code only if account is verified (not locked) and it's valid (not default)
  const showCode = !isLocked && referralCode && referralCode !== '000000';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      whileHover={{ scale: isLocked ? 1 : 1.02 }}
      className={`relative mb-3 p-4 backdrop-blur-xl border rounded-2xl overflow-hidden group ${
        isLocked 
          ? 'bg-white/5 border-white/10 opacity-60' 
          : 'bg-white/5 border-white/10'
      }`}
    >
      {!isLocked && (
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            isLocked ? 'bg-gray-500/20' : 'bg-purple-500/20'
          }`}>
            {isLocked ? (
              <Lock className="w-5 h-5 text-gray-400" />
            ) : (
              <span className="text-lg">🏠</span>
            )}
          </div>
          <div className={`px-4 py-2 backdrop-blur-xl rounded-xl border ${
            isLocked 
              ? 'bg-gray-500/20 border-gray-500/30' 
              : 'bg-purple-500/20 border-purple-500/30'
          }`}>
            <span className={`font-bold tracking-wider ${
              isLocked ? 'text-gray-400' : 'text-white'
            }`}>
              {showCode ? referralCode : '••••••'}
            </span>
          </div>
        </div>
        <motion.button 
          whileHover={{ scale: isLocked ? 1 : 1.1 }}
          whileTap={{ scale: isLocked ? 1 : 0.9 }}
          onClick={handleCopy}
          disabled={isLocked}
          className={`px-4 py-2 rounded-xl backdrop-blur-xl transition-colors border ${
            isLocked
              ? 'bg-gray-500/20 border-gray-500/30 cursor-not-allowed'
              : 'bg-purple-500/20 hover:bg-purple-500/30 border-purple-500/30'
          }`}
        >
          <span className={`text-sm font-medium ${
            isLocked ? 'text-gray-400' : 'text-white'
          }`}>
            {isLocked ? 'Locked' : (copied ? 'Copied!' : 'Copy')}
          </span>
        </motion.button>
      </div>
    </motion.div>
  );
}