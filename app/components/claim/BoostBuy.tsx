import { motion } from 'motion/react';
import { Gift } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection } from '@solana/web3.js';
import { useState, useEffect } from 'react';
import { handleBonusPurchase } from '../../solana/buyBonus';
import { toast } from 'sonner';

interface BoostBuyProps {
  onPurchaseSuccess?: () => void;
}

export function BoostBuy({ onPurchaseSuccess }: BoostBuyProps) {
  const { publicKey, signTransaction } = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [hasPurchased, setHasPurchased] = useState(false);

  // Check if user has already purchased on component mount
  useEffect(() => {
    const purchased = localStorage.getItem('desocial_bonus_purchased') === 'true';
    setHasPurchased(purchased);
  }, []);

  const handleBuyBoost = async () => {
    if (!publicKey || !signTransaction) {
      toast.error('Please connect your wallet first');
      return;
    }

    setIsLoading(true);

    try {
      // Create connection to Solana devnet
      const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
      
      // Handle bonus purchase using the new TypeScript file
      const result = await handleBonusPurchase(connection, publicKey, signTransaction);
      
      if (result.success) {
        toast.success(`🎉 Bonus points purchased! +10,000 points added to blockchain. Paid ${result.solAmount?.toFixed(4)} SOL ($1)`);
        
        // Update local state to reflect purchase
        setHasPurchased(true);
        
        if (onPurchaseSuccess) {
          onPurchaseSuccess();
        }
      } else {
        toast.error(result.error || 'Failed to purchase bonus points');
      }
      
    } catch (error) {
      console.error('Bonus points purchase failed:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to purchase bonus points');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mb-6">
      {/* Buy Points Button - Original Design */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleBuyBoost}
        disabled={isLoading || !publicKey || hasPurchased}
        className={`w-full py-4 rounded-2xl backdrop-blur-xl border text-white font-semibold transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed ${
          hasPurchased 
            ? 'bg-gray-500/20 border-gray-500/30' 
            : 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/30 hover:from-yellow-500/30 hover:to-orange-500/30 hover:border-yellow-500/50'
        }`}
      >
        <Gift className="w-5 h-5 group-hover:scale-110 transition-transform" />
        <span>
          {hasPurchased ? 'ALREADY PURCHASED' : isLoading ? 'PURCHASING...' : 'Limited BUY'}
        </span>
        {!hasPurchased && (
          <span className="px-2 py-0.5 bg-yellow-500/30 rounded-full text-xs font-bold">
            +10k pts
          </span>
        )}
      </motion.button>
      
      {/* Description */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.3 }}
        className="text-center text-xs text-gray-400 mt-2"
      >
        {hasPurchased 
          ? 'You have already purchased bonus points - only one purchase allowed per account'
          : 'Get 10,000 bonus points for $1 - limited offer!'
        }
      </motion.p>
    </div>
  );
}