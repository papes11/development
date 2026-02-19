import { motion } from 'motion/react';

interface ClaimCardProps {
  points: string;
  claimed: number;
}

export function ClaimCard({ points, claimed }: ClaimCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative mb-6 rounded-3xl p-6 overflow-hidden border border-white/10 backdrop-blur-xl bg-white/5"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-transparent to-blue-500/20" />
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 180, 360],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear"
        }}
        className="absolute top-0 right-0 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl"
      />
      <div className="relative z-10 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.2 }}
          className="flex items-center justify-center gap-2 mb-3"
        >
        </motion.div>
        <p className="text-xs font-bold text-purple-300 uppercase tracking-wider mb-2">
          UNCLAIMED POINTS:
        </p>
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, type: "spring" }}
          className="text-5xl font-bold text-white mb-3"
        >
          {points}
        </motion.div>
        <div className="space-y-1 text-sm text-gray-300">
          <p>Claimed: {claimed.toLocaleString()}</p>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl" />
    </motion.div>
  );
}