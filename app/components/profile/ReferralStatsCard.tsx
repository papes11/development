import { motion } from 'motion/react';
import { User, Zap, Rocket } from 'lucide-react';

interface ReferralStatsCardProps {
  title: string;
  value: string;
  icon: string;
  color: 'yellow' | 'orange';
}

export function ReferralStatsCard({ title, value, icon, color }: ReferralStatsCardProps) {
  const colorClasses = {
    yellow: {
      bg: 'bg-yellow-500/20',
      shadow: 'shadow-yellow-500/20',
      text: 'text-yellow-400',
      gradient: 'from-yellow-500/5'
    },
    orange: {
      bg: 'bg-orange-500/20',
      shadow: 'shadow-orange-500/20',
      text: 'text-orange-400',
      gradient: 'from-orange-500/5'
    }
  };

  const IconComponent = color === 'yellow' ? Zap : Rocket;
  const classes = colorClasses[color];

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: color === 'yellow' ? 0.6 : 0.7 }}
      whileHover={{ scale: 1.02, x: 5 }}
      className="relative flex items-center gap-3 p-4 backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl overflow-hidden group"
    >
      <div className={`absolute inset-0 bg-gradient-to-r ${classes.gradient} to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />
      <motion.div
        whileHover={{ rotate: 360 }}
        transition={{ duration: 0.6 }}
        className={`relative w-10 h-10 rounded-xl ${classes.bg} flex items-center justify-center flex-shrink-0 shadow-lg ${classes.shadow}`}
      >
        <span className="text-lg">{icon}</span>
      </motion.div>
      <div className="flex-1 relative z-10">
        <span className="text-white text-sm font-medium">{title}</span>
      </div>
      <div className="flex items-center gap-1.5 relative z-10">
        <IconComponent className={`w-4 h-4 ${classes.text}`} />
        <span className="text-white font-bold">{value}</span>
      </div>
    </motion.div>
  );
}