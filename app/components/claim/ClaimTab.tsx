import { motion } from 'motion/react';
import { Heart, MessageCircle, Repeat2, ThumbsUp } from 'lucide-react';
import { ClaimCard } from './ClaimCard';
import { TaskCard } from './TaskCard';
import { ClaimButton } from './ClaimButton';
import { BoostCard } from './BoostCard';
import { BoostBuy } from './BoostBuy';
import { useWallet } from '@solana/wallet-adapter-react';
import { useState, useEffect } from 'react';
import { UserStateDisplay } from '../../solana/memo';
import { calculatePoints, addTaskPoints, claimPointsOnBlockchain, createPointsListener, type PointsData } from '../../lib/points';
import { calculateBonusPoints, getPurchasedBonusPoints } from '../../lib/sigPoint';

const tasks = [
  { 
    title: 'Follow us on X', 
    description: 'Follow @DeSocial on X', 
    status: 'inprogress' as const, 
    icon: Heart,
    reward: '',
    points: 100,
    actionUrl: 'https://x.com/desocial_app',
    actionLabel: 'Follow'
  },
  { 
    title: 'Like our post', 
    description: 'Like our latest post', 
    status: 'inprogress' as const, 
    icon: ThumbsUp,
    reward: '',
    points: 50,
    actionUrl: 'https://x.com/desocial_app/status/1234567890',
    actionLabel: 'Like'
  },
  { 
    title: 'Repost our content', 
    description: 'Share with your followers', 
    status: 'inprogress' as const, 
    icon: Repeat2,
    reward: '',
    points: 75,
    actionUrl: 'https://x.com/intent/retweet?tweet_id=1234567890',
    actionLabel: 'Repost'
  },
  { 
    title: 'Comment on our post', 
    description: 'Leave a comment', 
    status: 'inprogress' as const, 
    icon: MessageCircle,
    reward: '',
    points: 25,
    actionUrl: 'https://x.com/intent/tweet?in_reply_to=1234567890',
    actionLabel: 'Comment'
  },
];

export function ClaimTab() {
  const { publicKey } = useWallet();
  const [userData, setUserData] = useState<UserStateDisplay | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [pointsData, setPointsData] = useState<PointsData>({ totalPoints: 100, blockchainPoints: 0, claimablePoints: 100 });
  const [claimedTasks, setClaimedTasks] = useState<Record<string, boolean>>({});

  // Calculate actual bonus points for display (including task points)
  const calculateBonusPoints = () => {
    let bonusPoints = 0;
    
    // Achievement bonus points
    if (publicKey) bonusPoints += 20; // Wallet connected
    if (isVerified) bonusPoints += 40; // Account verified
    if (userData?.referredBy) bonusPoints += 40; // Used referral
    bonusPoints += (userData?.referralCount || 0) * 50; // Each referral
    
    // Task points
    const claimedTasks = localStorage.getItem('desocial_claimed_tasks');
    if (claimedTasks) {
      try {
        const tasks = JSON.parse(claimedTasks);
        const taskPointsMap: Record<string, number> = {
          'Follow us on X': 100,
          'Like our post': 50,
          'Repost our content': 75,
          'Comment on our post': 25
        };
        
        Object.keys(tasks).forEach(taskTitle => {
          if (tasks[taskTitle] && taskPointsMap[taskTitle]) {
            bonusPoints += taskPointsMap[taskTitle];
          }
        });
      } catch (error) {
        console.error('Failed to get task points:', error);
      }
    }
    
    // Purchased bonus points
    const bonusPurchases = localStorage.getItem('desocial_bonus_purchases');
    if (bonusPurchases) {
      try {
        const purchases = JSON.parse(bonusPurchases);
        const purchasedPoints = purchases.reduce((total: number, purchase: any) => total + (purchase.points || 0), 0);
        bonusPoints += purchasedPoints;
      } catch (error) {
        console.error('Failed to get purchased bonus points:', error);
      }
    }
    
    return bonusPoints;
  };

  // Use centralized points system
  useEffect(() => {
    const cleanup = createPointsListener((points) => {
      console.log('🎯 ClaimTab received points update:', points);
      setPointsData(points);
    });

    return cleanup;
  }, []);

  // Listen for user data updates (referral verification, rescan, etc.)
  useEffect(() => {
    const handleUserDataUpdate = () => {
      const storedUserData = localStorage.getItem('desocial_userdata');
      if (storedUserData) {
        try {
          const parsed = JSON.parse(storedUserData);
          setUserData(parsed);
          console.log('🔄 Updated user data from event:', parsed);
        } catch (error) {
          console.error('❌ Failed to parse updated user data:', error);
        }
      }
    };

    // Listen for user data updates
    window.addEventListener('userDataUpdated', handleUserDataUpdate);
    
    return () => {
      window.removeEventListener('userDataUpdated', handleUserDataUpdate);
    };
  }, []);

  // Load claimed tasks and verification status
  useEffect(() => {
    const storedClaimedTasks = localStorage.getItem('desocial_claimed_tasks');
    const storedVerification = localStorage.getItem('desocial_verified');
    const storedUserData = localStorage.getItem('desocial_userdata');
    
    setIsVerified(storedVerification === 'true');
    
    // Load user data for referral information
    if (storedUserData) {
      try {
        const parsed = JSON.parse(storedUserData);
        setUserData(parsed);
        console.log('✅ Loaded user data from localStorage:', parsed);
      } catch (error) {
        console.error('❌ Failed to parse user data:', error);
      }
    }
    
    // Track wallet connection for bonus points
    if (publicKey) {
      localStorage.setItem('desocial_wallet_connected', 'true');
    }

    if (storedClaimedTasks) {
      try {
        const parsed = JSON.parse(storedClaimedTasks);
        setClaimedTasks(parsed);
        console.log('✅ Loaded claimed tasks from localStorage:', parsed);
      } catch (error) {
        console.error('❌ Failed to parse claimed tasks:', error);
      }
    } else {
      console.log('ℹ️ No claimed tasks found in localStorage');
    }
  }, [publicKey]);

  useEffect(() => {
    if (Object.keys(claimedTasks).length > 0) {
      localStorage.setItem('desocial_claimed_tasks', JSON.stringify(claimedTasks));
      console.log('💾 Saved claimed tasks to localStorage:', claimedTasks);
    }
  }, [claimedTasks]);

  const totalBonusPoints = calculateBonusPoints();

  return (
    <div className="pb-1 px-5 pt-6">
      {/* 🎁 CLAIM TAB - FINAL MODEL */}
      
      {/* Claimable vs Claimed */}
      <ClaimCard 
        points={pointsData.claimablePoints.toString()}
        claimed={pointsData.blockchainPoints}
      />

      {/* Claim Button - SIMPLE LOGIC */}
      <ClaimButton 
        pointsToClaim={pointsData.claimablePoints}
        onClaimSuccess={() => {
          // SIMPLE CLAIM: blockchainPoints = totalPoints
          claimPointsOnBlockchain(pointsData.claimablePoints);
        }}
      />

      {/* Earn Bonus Points Section */}
      <motion.h2
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-1"
      >
        EARN BONUS POINTS
      </motion.h2>

      <BoostCard
        walletConnected={!!publicKey}
        accountVerified={isVerified}
        referralUsed={!!userData?.referredBy}
        referralCount={userData?.referralCount || 0}
        totalBonusPoints={totalBonusPoints}
      />

      {/* Daily Tasks Section */}
      <motion.h2
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
        className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-1"
      >
        DAILY TASKS
      </motion.h2>

      <div className="space-y-2.5 mb-6">
        {tasks.map((task, index) => {
          const isCompleted = claimedTasks[task.title];
          
          // Determine task status
          let taskStatus: 'completed' | 'inprogress' | 'locked' = 'inprogress';
          
          if (isCompleted) {
            taskStatus = 'completed';
          }
          
          return (
            <TaskCard
              key={task.title}
              task={{ ...task, status: taskStatus }}
              index={index}
              onClaim={!isCompleted ? () => {
                // Add task points (increases totalPoints)
                addTaskPoints(task.title, task.points);
                
                // Update local state for immediate UI feedback
                setClaimedTasks(prev => ({
                  ...prev,
                  [task.title]: true,
                }));
              } : undefined}
            />
          );
        })}
      </div>

      {/* Buy Bonus Points Section */}
      <motion.h2
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-1"
      >
        BUY BONUS POINTS
      </motion.h2>

      <BoostBuy 
        onPurchaseSuccess={() => {
          console.log('Bonus points purchased successfully!');
          // Trigger points update
          window.dispatchEvent(new CustomEvent('pointsUpdated'));
        }}
      />
    </div>
  );
}