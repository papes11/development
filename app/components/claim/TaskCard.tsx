import { motion } from 'motion/react';
import { CheckCircle2, LucideIcon, ExternalLink } from 'lucide-react';
import { useState, useEffect } from 'react';

interface TaskData {
  title: string;
  description: string;
  status: 'completed' | 'inprogress' | 'locked';
  icon: LucideIcon;
  reward: string;
  points: number;
  actionUrl?: string;
  actionLabel?: string;
}

interface TaskCardProps {
  task: TaskData;
  index: number;
  onClaim?: () => void;
}

export function TaskCard({ task, index, onClaim }: TaskCardProps) {
  const [isVerified, setIsVerified] = useState(false);

  // Check verification status on component mount
  useEffect(() => {
    const verified = localStorage.getItem('desocial_verified') === 'true';
    setIsVerified(verified);
  }, []);

  const handleClaimClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Always open the task URL first
    if (task.actionUrl) {
      window.open(task.actionUrl, '_blank', 'noopener,noreferrer');
    }
    
    // Only execute claim logic if account is verified
    if (isVerified && onClaim) {
      onClaim();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.6 + index * 0.05 }}
      whileHover={{ scale: 1.02, x: 5 }}
      className={`relative flex items-center gap-3 p-4 backdrop-blur-xl border rounded-2xl overflow-hidden group transition-all ${
        task.status === 'locked'
          ? 'bg-white/[0.02] border-white/5'
          : task.status === 'completed'
          ? 'bg-green-500/10 border-green-500/30'
          : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
      }`}
    >
      <div className={`absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity ${
        task.status === 'completed' ? 'from-green-500/5 to-transparent' :
        task.status === 'inprogress' ? 'from-purple-500/5 to-transparent' :
        'from-gray-500/5 to-transparent'
      }`} />
      
      <motion.div
        whileHover={{ rotate: task.status === 'locked' ? 0 : 360 }}
        transition={{ duration: 0.5 }}
        className={`relative w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
          task.status === 'locked'
            ? 'bg-gray-700/30'
            : task.status === 'completed'
            ? 'bg-green-500/20 shadow-lg shadow-green-500/20'
            : 'bg-purple-500/20 shadow-lg shadow-purple-500/20'
        }`}
      >
        <task.icon className={`w-5 h-5 ${
          task.status === 'locked' 
            ? 'text-gray-500' 
            : task.status === 'completed'
            ? 'text-green-400'
            : 'text-purple-400'
        }`} />
      </motion.div>
      
      <div className="flex-1 min-w-0 relative z-10">
        <h3 className={`font-medium text-sm mb-0.5 ${
          task.status === 'locked' ? 'text-gray-500' : 'text-white'
        }`}>
          {task.title}
        </h3>
        <p className="text-gray-400 text-xs">{task.description}</p>
      </div>
      
      {/* Single Claim Button or Status */}
      <div className="flex items-center gap-2 relative z-10">
        {task.status === 'inprogress' && onClaim && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleClaimClick}
            className={`px-4 py-2 border rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              isVerified 
                ? 'bg-gradient-to-r from-purple-500/20 to-blue-500/20 hover:from-purple-500/30 hover:to-blue-500/30 border-purple-500/30 hover:border-purple-500/50 text-purple-400'
                : 'bg-gradient-to-r from-gray-500/20 to-gray-600/20 hover:from-gray-500/30 hover:to-gray-600/30 border-gray-500/30 hover:border-gray-500/50 text-gray-400'
            }`}
          >
            {isVerified ? (
              <>Claim {task.points}pts</>
            ) : (
              <>
                Visit <ExternalLink className="w-3 h-3" />
              </>
            )}
          </motion.button>
        )}
        
        {task.status === 'completed' && (
          <div className="flex items-center gap-2">
            <div className="text-green-400 text-sm font-semibold">
              Claimed ✓
            </div>
            <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
          </div>
        )}
        
        {task.status === 'locked' && (
          <div className="text-gray-500 text-sm">
            Locked
          </div>
        )}
      </div>
    </motion.div>
  );
}