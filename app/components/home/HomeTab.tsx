import { motion } from 'motion/react';
import { formatPoints } from '../../lib/formatUtils';
import { ScoreCard } from './ScoreCard';
import { AppCard } from './AppCard';
import { UserStateDisplay } from '../../solana/memo';
import { useWallet } from '@solana/wallet-adapter-react';
import { useEffect, useState } from 'react';
import { getUsageData } from '../../lib/useTracking';
import { calculatePoints, createPointsListener, type PointsData } from '../../lib/points';
import { calculateBonusPoints, getPurchasedBonusPoints } from '../../lib/sigPoint';

interface HomeTabProps {
  userData: UserStateDisplay | null;
}

interface AppUsage {
  name: string;
  icon: string;
  todayPoints: number;
  todayMinutes: number;
}

export function HomeTab({ userData }: HomeTabProps) {
  const { publicKey } = useWallet();
  const [isVerified, setIsVerified] = useState(false);
  const [pointsData, setPointsData] = useState<PointsData>({ totalPoints: 100, blockchainPoints: 0, claimablePoints: 100 });
  const [apps, setApps] = useState<AppUsage[]>([
    { name: 'Instagram', icon: '/instagram.svg', todayPoints: 0, todayMinutes: 0 },
    { name: 'WhatsApp', icon: '/whatsapp.svg', todayPoints: 0, todayMinutes: 0 },
    { name: 'X', icon: '/twitter.svg', todayPoints: 0, todayMinutes: 0 },
    { name: 'YouTube', icon: '/youtube.svg', todayPoints: 0, todayMinutes: 0 },
    { name: 'TikTok', icon: '/tiktok.svg', todayPoints: 0, todayMinutes: 0 },
    { name: 'Facebook', icon: '/facebook.svg', todayPoints: 0, todayMinutes: 0 },
    { name: 'Telegram', icon: '/telegram.svg', todayPoints: 0, todayMinutes: 0 },
  ]);

  // Load usage data from native tracking (only when app opens)
  useEffect(() => {
    const loadUsageData = async () => {
      try {
        const usageData = await getUsageData();
        console.log('Usage data loaded:', usageData);
        
        // Update apps with actual usage data
        setApps(prevApps => 
          prevApps.map(app => {
            const appKey = app.name.toLowerCase();
            const minutes = usageData.newMinutes[app.name] || usageData.newMinutes[appKey] || 0;
            const points = minutes; // 1 minute = 1 point for now
            
            return {
              ...app,
              todayMinutes: minutes,
              todayPoints: points
            };
          })
        );
      } catch (error) {
        console.error('Failed to load usage data:', error);
      }
    };

    // Only load once when component mounts (when user opens app)
    loadUsageData();
  }, []);

  // Use centralized points system
  useEffect(() => {
    const cleanup = createPointsListener((points) => {
      console.log('🏠 HomeTab received points update:', points);
      setPointsData(points);
    });

    return cleanup;
  }, []);

  useEffect(() => {
    const storedVerification = typeof window !== 'undefined' ? localStorage.getItem('desocial_verified') : null;
    const verified = storedVerification === 'true';
    setIsVerified(verified);
    
    // Track wallet connection for bonus points (ONLY ONCE - first time)
    if (publicKey) {
      const alreadyConnected = localStorage.getItem('desocial_wallet_connected');
      if (!alreadyConnected) {
        localStorage.setItem('desocial_wallet_connected', 'true');
        console.log('🎉 First wallet connection - bonus eligible');
      }
    }
  }, [userData, publicKey]);

  // 🏠 HOME TAB: Show TOTAL POINTS (lifetime)
  const displayPoints = formatPoints(pointsData.totalPoints);
  
  return (
    <div className="pb-1 px-5 pt-6">
      {/* Main Score Card - Shows TOTAL POINTS (lifetime) */}
      <ScoreCard 
        score={displayPoints}
        title="Proof-of-Attention Score"
        boost={isVerified ? `Lifetime Score` : '🔒 Not Verified'}
        isVerified={isVerified}
        signatureValid={isVerified}
      />

      {/* Section Title */}
      <motion.h2
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-1"
      >
        YOUR APPS
      </motion.h2>

      {/* App Usage Cards - Column Layout like Instagram */}
      <div className="space-y-3">
        {apps.map((app, index) => (
          <AppCard
            key={app.name}
            app={app}
            index={index}
          />
        ))}
      </div>

      
      
      
    </div>
  );
}