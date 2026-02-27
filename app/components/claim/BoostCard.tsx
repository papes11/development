import { motion } from 'motion/react';
import { CheckCircle2, Circle, Wallet, ShieldCheck, UserPlus, Users } from 'lucide-react';

interface BonusTask {
  title: string;
  description: string;
  points: string;
  completed: boolean;
  icon: any;
}

interface BoostCardProps {
  walletConnected: boolean;
  accountVerified: boolean;
  referralUsed: boolean;
  referralCount: number;
  totalBonusPoints: number;
}

export function BoostCard({ 
  walletConnected, 
  accountVerified, 
  referralUsed, 
  referralCount,
  totalBonusPoints 
}: BoostCardProps) {
  
  const bonusTasks: BonusTask[] = [
    {
      title: 'Connect Wallet',
      description: 'Get 20 bonus points!',
      points: '+20 pts',
      completed: walletConnected, // Always show if wallet connected
      icon: Wallet
    },
    {
      title: 'Verify Account',
      description: 'Unlock 40 bonus points!',
      points: '+40 pts',
      completed: accountVerified, // Always show if verified
      icon: ShieldCheck
    },
    {
      title: 'Use Referral Code',
      description: 'Bonus 40 points!',
      points: '+40 pts',
      completed: referralUsed, // Always show if used referral
      icon: UserPlus
    },
    {
      title: 'Refer Friends',
      description: 'Each friend adds 50 pts!',
      points: `+${referralCount * 50} pts`,
      completed: referralCount > 0, // Always show if has referrals
      icon: Users
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="mb-6"
    >
      {/* Bonus Tasks */}
      <div className="space-y-2.5">
        {bonusTasks.map((task, index) => (
          <motion.div
            key={task.title}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 + index * 0.1 }}
            className={`p-4 backdrop-blur-xl rounded-2xl border transition-all ${
              task.completed
                ? 'bg-green-500/10 border-green-500/30'
                : 'bg-white/5 border-white/10'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  task.completed
                    ? 'bg-green-500/20'
                    : 'bg-white/10'
                }`}>
                  <task.icon className={`w-5 h-5 ${
                    task.completed ? 'text-green-400' : 'text-gray-400'
                  }`} />
                </div>
                <div className="flex-1">
                  <div className={`font-semibold text-sm ${
                    task.completed ? 'text-white' : 'text-gray-300'
                  }`}>
                    {task.title}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {task.description}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className={`px-3 py-1.5 rounded-lg font-bold text-sm ${
                  task.completed
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-purple-500/20 text-purple-400'
                }`}>
                  {task.points}
                </div>
                {task.completed ? (
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                ) : (
                  <Circle className="w-5 h-5 text-gray-600" />
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
