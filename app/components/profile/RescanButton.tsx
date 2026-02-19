"use client";
import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { rescanBlockchain } from '../../solana/rescan';
import { UserStateDisplay } from '../../solana/memo';

interface RescanButtonProps {
  onDataUpdate: (userData: UserStateDisplay) => void;
}

export function RescanButton({ onDataUpdate }: RescanButtonProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [message, setMessage] = useState<string>('');
  const { publicKey } = useWallet();
  const { connection } = useConnection();

  const handleRescan = async () => {
    if (!publicKey || !connection) {
      setMessage('❌ Wallet not connected');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    setIsScanning(true);
    setMessage('🔍 Connecting to blockchain...');

    try {
      console.log('Rescanning blockchain for wallet:', publicKey.toString());
      
      // Show progress messages
      setTimeout(() => setMessage('📡 Scanning transactions...'), 1000);
      setTimeout(() => setMessage('🔍 Looking for valid data...'), 2000);
      
      const result = await rescanBlockchain(publicKey.toString(), connection);
      
      if (result.success && result.userData) {
        setMessage('✅ Blockchain data updated successfully');
        onDataUpdate(result.userData);
        console.log('Rescan successful:', result.userData);
      } else {
        setMessage(`❌ ${result.error || 'No account found'}`);
        console.log('Rescan failed:', result.error);
      }
      
    } catch (error) {
      console.error('Rescan failed:', error);
      setMessage('❌ Blockchain scan failed - please try again');
    } finally {
      setIsScanning(false);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  return (
    <div className="space-y-2">
      <motion.div
        whileHover={{ scale: isScanning ? 1 : 1.02 }}
        whileTap={{ scale: isScanning ? 1 : 0.98 }}
      >
        <Button
          onClick={handleRescan}
          disabled={isScanning || !publicKey}
          className="w-full h-12 bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-xl border border-blue-500/30 hover:border-blue-400/50 text-white font-semibold text-sm rounded-2xl transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/25 disabled:opacity-50"
        >
          {isScanning ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Scanning Blockchain...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Rescan Blockchain
            </>
          )}
        </Button>
      </motion.div>
      
      {/* Status Message */}
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className={`text-center text-xs p-2 rounded-lg ${
            message.includes('✅') 
              ? 'text-green-400 bg-green-500/10 border border-green-500/20' 
              : 'text-red-400 bg-red-500/10 border border-red-500/20'
          }`}
        >
          {message}
        </motion.div>
      )}
    </div>
  );
}
