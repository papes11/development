"use client";
import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useState } from 'react';

interface LogoutButtonProps {
  onLogout: () => void;
}

export function LogoutButton({ onLogout }: LogoutButtonProps) {
  const { disconnect } = useWallet();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleLogoutClick = () => {
    setShowConfirm(true);
  };

  const handleConfirmLogout = async () => {
    try {
      // Disconnect wallet first
      await disconnect();
      
      // Clear ALL localStorage data
      localStorage.removeItem('desocial_username');
      localStorage.removeItem('desocial_verified');
      localStorage.removeItem('desocial_refcode');
      localStorage.removeItem('desocial_referralcount');
      localStorage.removeItem('desocial_userdata'); // Clear new blockchain data
      
      // Clear any other potential DeSocial data
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('desocial_')) {
          localStorage.removeItem(key);
        }
      });
      
      // Clear wallet adapter localStorage (if any)
      Object.keys(localStorage).forEach(key => {
        if (key.includes('wallet') || key.includes('solana')) {
          localStorage.removeItem(key);
        }
      });
      
      // Call parent logout handler
      onLogout();
      
      console.log('Logout completed - all data cleared');
    } catch (error) {
      console.error('Logout failed:', error);
      
      // Even if wallet disconnect fails, clear localStorage and logout
      localStorage.clear(); // Nuclear option - clear everything
      onLogout();
    }
  };

  const handleCancelLogout = () => {
    setShowConfirm(false);
  };

  if (showConfirm) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="space-y-3 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl"
      >
        <div className="text-center">
          <h3 className="text-white font-semibold text-sm mb-2">Confirm Logout</h3>
          <p className="text-gray-300 text-xs mb-4">
            Do you want to logout? This will reset the app and clear all your data including wallet connection.
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={handleConfirmLogout}
            className="flex-1 h-10 bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30 text-xs font-semibold rounded-xl"
          >
            Yes, Logout
          </Button>
          <Button
            onClick={handleCancelLogout}
            className="flex-1 h-10 bg-gray-500/20 border border-gray-500/40 text-gray-300 hover:bg-gray-500/30 text-xs font-semibold rounded-xl"
          >
            Cancel
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Button
        onClick={handleLogoutClick}
        className="w-full h-12 bg-gradient-to-r from-red-500/20 to-pink-500/20 backdrop-blur-xl border border-red-500/30 hover:border-red-400/50 text-white font-semibold text-sm rounded-2xl transition-all duration-300 hover:shadow-lg hover:shadow-red-500/25"
      >
        <LogOut className="w-4 h-4 mr-2" />
        Logout & Clear All Data
      </Button>
    </motion.div>
  );
}