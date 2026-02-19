import { motion } from 'motion/react';
import { LucideIcon } from 'lucide-react';
import Image from 'next/image';


interface AppData {
  name: string;
  icon: LucideIcon | string; // Either a Lucide icon or a path to an image
  todayPoints: number;
  todayMinutes: number;
}

interface AppCardProps {
  app: AppData;
  index: number;
}



export function AppCard({ app, index }: AppCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.5 + index * 0.05 }}
      whileHover={{ scale: 1.02, x: 5 }}
      whileTap={{ scale: 0.98 }}
      className="relative flex items-center gap-4 p-4 backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl group hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/5 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
      
      {/* App Icon */}
      <motion.div
        whileHover={{ rotate: 360 }}
        transition={{ duration: 0.6 }}
        className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0 shadow-lg"
      >
        {typeof app.icon === 'string' ? (
          <Image 
            src={app.icon} 
            alt={`${app.name} icon`} 
            width={32} 
            height={32} 
            className="w-8 h-8"
          />
        ) : (
          <app.icon className="w-8 h-8 text-white" />
        )}
      </motion.div>

      {/* Left Side - App Name and Today Used */}
      <div className="flex-1">
        <h3 className="text-white font-medium text-sm">{app.name}</h3>
        <p className="text-xs text-gray-400">Today used</p>
      </div>

      {/* Right Side - Points and Minutes */}
      <div className="text-right">
        <div className="text-sm font-medium text-purple-400">{app.todayPoints}p</div>
        <div className="text-xs text-gray-400">{app.todayMinutes} min</div>
      </div>
    </motion.div>
  );
}