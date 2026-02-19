import { motion } from 'motion/react';

interface PointsCardProps {
  points: string;
  label: string;
  icon?: string;
  gradient?: string;
}

export function PointsCard({ 
  points, 
  label, 
  icon = "⭐", 
  gradient = "from-purple-500 to-blue-500" 
}: PointsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05 }}
      className={`relative p-4 rounded-2xl backdrop-blur-xl bg-gradient-to-br ${gradient}/20 border border-white/10 overflow-hidden group cursor-pointer`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="relative z-10 text-center">
        <div className="text-2xl mb-2">{icon}</div>
        <div className="text-2xl font-bold text-white mb-1">{points}</div>
        <div className="text-xs text-gray-300">{label}</div>
      </div>
    </motion.div>
  );
}