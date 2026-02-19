import { motion } from 'motion/react';
import { UserPlus } from 'lucide-react';
import { useState, useEffect } from 'react';
import LoginWallet from '../wallets/loginbutton';
import { UserStateDisplay } from '../solana/memo';

interface WelcomeScreenProps {
  onComplete: (username: string, userData?: UserStateDisplay) => void;
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

export function WelcomeScreen({ onComplete }: WelcomeScreenProps) {
  const [username, setUsername] = useState('');
  const [particles, setParticles] = useState<Array<{id: number, left: number, xOffset: number, duration: number, delay: number}>>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setParticles(generateParticles());
  }, []);

  const handleGetStarted = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      onComplete(username.trim());
    }
  };

  const handleLoginSuccess = (userData: UserStateDisplay) => {
    onComplete(userData.username, userData);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-5 relative overflow-hidden">
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

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative w-full max-w-md"
      >
        {/* Logo */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
          className="w-56 h-56 mx-auto flex items-center justify-center"
        >
          <img
            src="/tlogo.png"
            alt="DeSocial Logo"
            className="w-full h-full object-contain rounded-xl"
          />
        </motion.div>

        {/* Glassy Card */}
        <div className="relative backdrop-blur-2xl bg-white/5 border border-white/10 rounded-3xl p-4 shadow-2xl">
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-blue-500/10 rounded-3xl" />
          
          <div className="relative z-10">
            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-center mb-8"
            >
              <h1 className="text-4xl font-bold text-white bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                DeSocial
              </h1>
              <p className="text-gray-300 text-sm mt-2">
                Proof-of-Attention Rewards Platform
              </p>
            </motion.div>

            {/* Form */}
            <div className="space-y-6">
              {/* Username Form */}
              <motion.form
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                onSubmit={handleGetStarted}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    className="w-full px-4 py-3.5 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500/50 focus:bg-white/10 transition-all"
                    required
                  />
                </div>

                {/* Get Started Button */}
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  whileHover={{ scale: username.trim() ? 1.02 : 1 }}
                  whileTap={{ scale: username.trim() ? 0.98 : 1 }}
                  type="submit"
                  disabled={!username.trim()}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold shadow-lg shadow-purple-500/50 hover:shadow-xl hover:shadow-purple-500/60 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>Get Started</span>
                  <UserPlus className="w-5 h-5" />
                </motion.button>
              </motion.form>

              {/* Login Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <LoginWallet onLoginSuccess={handleLoginSuccess} />
              </motion.div>
            </div>

            {/* Footer */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-center text-xs text-gray-400 mt-6"
            >
              New user? Get Started • Existing user? Login with Wallet
            </motion.p>
          </div>
        </div>

        {/* Glow Effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-blue-600/20 rounded-3xl blur-2xl -z-10 opacity-60" />
      </motion.div>

      {/* Floating Particles */}
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
    </div>
  );
}