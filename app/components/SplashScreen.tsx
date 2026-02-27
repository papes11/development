import { motion } from 'motion/react';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { getUsageData } from '../lib/useTracking';
import { requestSignedPoints, storeSignedPoints, calculateBonusPoints } from '../lib/sigPoint';

interface SplashScreenProps {
  onComplete: () => void;
}

// Generate static particle positions to avoid hydration mismatch
const generateParticles = () => {
  const particles = [];
  for (let i = 0; i < 20; i++) {
    particles.push({
      id: i,
      left: Math.random() * 100,
      xOffset: Math.random() * 40 - 20,
      duration: 3 + Math.random() * 2,
      delay: Math.random() * 3,
    });
  }
  return particles;
};

// Generate particles descending from top
const generateTopParticles = () => {
  const particles = [];
  for (let i = 0; i < 20; i++) {
    particles.push({
      id: i + 100, // Different IDs to avoid conflicts
      left: Math.random() * 100,
      xOffset: Math.random() * 40 - 20,
      duration: 3 + Math.random() * 2,
      delay: Math.random() * 3,
    });
  }
  return particles;
};

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const { publicKey } = useWallet();
  const [particles, setParticles] = useState<Array<{id: number, left: number, xOffset: number, duration: number, delay: number}>>([]);
  const [topParticles, setTopParticles] = useState<Array<{id: number, left: number, xOffset: number, duration: number, delay: number}>>([]);
  const [mounted, setMounted] = useState(false);
  const [loadingText, setLoadingText] = useState('Initializing...');

  useEffect(() => {
    setMounted(true);
    setParticles(generateParticles());
    setTopParticles(generateTopParticles());
    
    // Implement usage tracking logic as per specification
    const collectUsageData = async () => {
      try {
        setLoadingText('Collecting usage data...');
        
        // Get usage data from native code (1 minute = 1 point)
        const usageData = await getUsageData();
        
        setLoadingText('Processing points...');
        
        // Get current user state for boost calculation
        const walletAddress = publicKey?.toString() || '';
        const isVerified = localStorage.getItem('desocial_verified') === 'true';
        const userData = JSON.parse(localStorage.getItem('desocial_userdata') || '{}');
        
        // Calculate bonus points (excluding tasks)
        const bonusPoints = calculateBonusPoints(
          !!walletAddress,
          isVerified,
          !!userData.referredBy,
          userData.referralCount || 0
        );
        
        // Get previous total points
        const previousPoints = parseInt(localStorage.getItem('desocial_points') || '100', 10);
        
        if (usageData.totalNewMinutes > 0) {
          setLoadingText('Signing points...');
          
          // Send to sig-point API for cryptographic verification
          const signedData = await requestSignedPoints({
            previousPoints,
            newPoints: usageData.totalNewMinutes,
            walletAddress,
            bonusPoints
          });
          
          // Store signed points
          storeSignedPoints(signedData, walletAddress);
          
          // Update total points in localStorage
          localStorage.setItem('desocial_points', signedData.total_points.toString());
          
          // Store the newly earned points for claim tab (ONLY if > 0)
          const pointsProof = {
            points: usageData.totalNewMinutes,
            wallet: walletAddress,
            timestamp: Date.now(),
            apps: usageData.newMinutes,
            signature: signedData.signature,
            boost_applied: 1 // No longer using multipliers, just direct points
          };
          
          localStorage.setItem('desocial_points_proof', JSON.stringify(pointsProof));
          console.log(`Earned ${usageData.totalNewMinutes} new points (+${signedData.bonus_applied} bonus pts applied)`);
        } else {
          console.log('No new usage points to claim');
        }
        
        setLoadingText('Ready!');
        
        // Complete after processing
        setTimeout(() => {
          onComplete();
        }, 1000);
        
      } catch (error) {
        console.error('Error collecting usage data:', error);
        setLoadingText('Ready!');
        
        // Complete even if there's an error
        setTimeout(() => {
          onComplete();
        }, 1000);
      }
    };

    // Start the collection process after a short delay
    const timer = setTimeout(() => {
      collectUsageData();
    }, 10000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Animated Background Orbs */}
      <div className="absolute inset-0">
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, -100, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-20 left-10 w-96 h-96 bg-purple-600/30 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, -80, 0],
            y: [0, 100, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
          className="absolute bottom-20 right-10 w-96 h-96 bg-blue-600/30 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, 50, 0],
            y: [0, -50, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-600/20 rounded-full blur-3xl"
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Logo with Scale Animation */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{
            duration: 1,
            ease: "easeOut"
          }}
          className="relative mb-8"
        >
          <Image
            src="/tlogo.png"
            alt="DeSocial Logo"
            width={200}
            height={200}
            className="rounded-md"
            priority
          />
          
          {/* Glow Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/30 via-pink-600/30 to-blue-600/30 rounded-full blur-2xl -z-10 animate-pulse" />
        </motion.div>

        {/* App Name */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="text-4xl font-bold text-white mb-2 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent"
        >
          DeSocial
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="text-gray-400 text-sm mb-4"
        >
          Proof-of-Attention Rewards
        </motion.p>

        {/* Loading Text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="text-gray-500 text-xs"
        >
          {loadingText}
        </motion.p>
      </div>

      {/* Floating Particles - Only render after mount to avoid hydration mismatch */}
      {/* Particles ascending from bottom */}
      {mounted && particles.map((particle) => (
        <motion.div
          key={particle.id}
          initial={{ opacity: 0 }}
          animate={{
            opacity: [0, 1, 0],
            y: [0, -100],
            x: particle.xOffset,
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
          }}
          className="absolute w-1 h-1 bg-white rounded-full"
          style={{
            left: `${particle.left}%`,
            bottom: 0,
          }}
        />
      ))}
      
      {/* Particles descending from top */}
      {mounted && topParticles.map((particle) => (
        <motion.div
          key={particle.id}
          initial={{ opacity: 0 }}
          animate={{
            opacity: [0, 1, 0],
            y: [0, 100],
            x: particle.xOffset,
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
          }}
          className="absolute w-1 h-1 bg-white rounded-full"
          style={{
            left: `${particle.left}%`,
            top: 0,
          }}
        />
      ))}
    </div>
  );
}