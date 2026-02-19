'use client'

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BottomNavigation } from './components/BottomNavigation';
import { HomeTab } from './components/home/HomeTab';
import { ClaimTab } from './components/claim/ClaimTab';
import { EpochsTab } from './components/epochs/EpochsTab';
import { ProfileTab } from './components/profile/ProfileTab';
import { WelcomeScreen } from './components/WelcomeScreen';
import { SplashScreen } from './components/SplashScreen';
import { UserStateDisplay } from './solana/memo';

type Tab = 'home' | 'claim' | 'epochs' | 'profile';

// Generate static star positions to avoid hydration mismatch
const generateStars = () => {
  const stars = [];
  for (let i = 0; i < 50; i++) {
    stars.push({
      id: i,
      top: Math.random() * 100,
      left: Math.random() * 100,
      duration: 2 + Math.random() * 3,
      delay: Math.random() * 3,
    });
  }
  return stars;
};

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [showSplash, setShowSplash] = useState(true);
  const [showWelcome, setShowWelcome] = useState(true);
  const [username, setUsername] = useState('');
  const [userData, setUserData] = useState<UserStateDisplay | null>(null);
  const [stars, setStars] = useState<Array<{id: number, top: number, left: number, duration: number, delay: number}>>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setStars(generateStars());
    
    const storedUsername = localStorage.getItem('desocial_username');
    const storedUserData = localStorage.getItem('desocial_userdata');
    
    if (storedUsername) {
      setUsername(storedUsername);
      setShowWelcome(false);
      
      // Load stored blockchain data if available
      if (storedUserData) {
        try {
          const parsedData = JSON.parse(storedUserData);
          setUserData(parsedData); // Use real data including points
        } catch (error) {
          console.warn('Failed to parse stored user data:', error);
        }
      }
    }
  }, []);

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  const handleLogout = () => {
    setUsername('');
    setUserData(null);
    setShowWelcome(true);
  };

  const handleWelcomeComplete = (newUsername: string, blockchainData?: UserStateDisplay) => {
    setUsername(newUsername);
    setUserData(blockchainData || null); // Use real blockchain data
    localStorage.setItem('desocial_username', newUsername);
    
    // Store blockchain data if available
    if (blockchainData) {
      localStorage.setItem('desocial_userdata', JSON.stringify(blockchainData));
      localStorage.setItem('desocial_referralcount', blockchainData.referralCount.toString());
    }
    
    setShowWelcome(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0b1e] overflow-hidden">
      {/* Cosmic Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a1b3e] via-[#0a0b1e] to-[#0a0b1e]" />
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-20 left-10 w-72 h-72 bg-purple-600/20 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute top-40 right-10 w-80 h-80 bg-blue-600/15 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
          <div className="absolute bottom-40 left-1/3 w-64 h-64 bg-pink-600/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '4s' }} />
        </div>
        {/* Stars - Only render after mount to avoid hydration mismatch */}
        {mounted && (
          <div className="absolute inset-0">
            {stars.map((star) => (
              <div
                key={star.id}
                className="absolute w-1 h-1 bg-white rounded-full opacity-60"
                style={{
                  top: `${star.top}%`,
                  left: `${star.left}%`,
                  animation: `twinkle ${star.duration}s infinite`,
                  animationDelay: `${star.delay}s`
                }}
              />
            ))}
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {showSplash ? (
          <motion.div
            key="splash"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="relative z-10"
          >
            <SplashScreen onComplete={handleSplashComplete} />
          </motion.div>
        ) : showWelcome ? (
          <motion.div
            key="welcome"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="relative z-10"
          >
            <WelcomeScreen onComplete={handleWelcomeComplete} />
          </motion.div>
        ) : (
          <motion.div
            key="app"
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="relative z-10"
          >
            {/* Main Content Container */}
            <div className="max-w-lg mx-auto min-h-screen flex flex-col">
              {/* Content Area with bottom padding for navigation */}
              <div className="flex-1 pb-24 overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="h-full"
                  >
                    {activeTab === 'home' && <HomeTab userData={userData} />}
                    {activeTab === 'claim' && <ClaimTab />}
                    {activeTab === 'epochs' && <EpochsTab />}
                    {activeTab === 'profile' && <ProfileTab username={username} userData={userData} onLogout={handleLogout} />}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* Bottom Navigation - Fixed Position */}
            <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        
        /* Prevent pull-to-refresh and overscroll */
        body {
          overscroll-behavior: none;
          -webkit-overflow-scrolling: touch;
        }
        
        /* Prevent text selection on navigation */
        .touch-manipulation {
          touch-action: manipulation;
        }
      `}</style>
    </div>
  );
}