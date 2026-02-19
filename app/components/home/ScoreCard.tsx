import { motion } from 'motion/react';

interface ScoreCardProps {
  score: string;
  title: string;
  boost: string;
  isVerified?: boolean;
  signatureValid?: boolean;
}

export function ScoreCard({ score, title, boost, isVerified = false, signatureValid = false }: ScoreCardProps) {
  // Determine boost color based on verification status
  const getBoostColor = () => {
    if (isVerified && signatureValid) {
      return 'bg-green-500/25 border-green-500/30 text-green-300';
    } else if (isVerified && !signatureValid) {
      return 'bg-red-500/25 border-red-500/30 text-red-300';
    } else {
      return 'bg-white/25 border-white/20 text-white';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative mb-6 rounded-3xl p-8 overflow-hidden border border-white/10 backdrop-blur-xl"
      style={{
        background: 'linear-gradient(135deg, rgba(65, 88, 208, 0.3) 0%, rgba(200, 80, 192, 0.3) 50%, rgba(255, 204, 112, 0.3) 100%)',
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
      <motion.div
        animate={{
          scale: [1, 1.05, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute -top-20 -right-20 w-60 h-60 bg-purple-500/30 rounded-full blur-3xl"
      />
      <div className="relative z-10">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="text-6xl font-bold text-white mb-1"
        >
          {score}
        </motion.div>
        <p className="text-white/90 text-base mb-4">{title}</p>
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 backdrop-blur-md rounded-lg border ${getBoostColor()}`}
        >
          <span className="text-sm font-medium">{boost}</span>
        </motion.div>
      </div>
      <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-500/20 rounded-full blur-2xl" />
    </motion.div>
  );
}