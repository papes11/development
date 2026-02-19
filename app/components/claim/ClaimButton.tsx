import { motion } from 'motion/react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection } from '@solana/web3.js';
import { useState } from 'react';
import { claimPointsOnBlockchain } from '../../lib/points';
import { verifyAccount } from '../../solana/verifyAccount';
import { generateAddresses } from '../../solana/addressUtils';
import { getLatestMemo, generateReferralCode, UserState } from '../../solana/memo';
import { decryptSigFromBackend, requestSig } from '../../solana/transactionUtils';
import { createTransferWithMemo, sendTransaction } from '../../solana/transactionUtils';
import { toast } from 'sonner';

interface ClaimButtonProps {
  pointsToClaim: number;
  onClaimSuccess?: () => void;
}

export function ClaimButton({ pointsToClaim, onClaimSuccess }: ClaimButtonProps) {
  const { publicKey, signTransaction } = useWallet();
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    if (!publicKey || !signTransaction) {
      toast.error('Please connect your wallet first');
      return;
    }

    setIsLoading(true);

    try {
      if (pointsToClaim <= 0) {
        toast.error('No points to claim yet');
        setIsLoading(false);
        return;
      }

      // Check if user is verified
      const isVerified = localStorage.getItem('desocial_verified') === 'true';
      if (!isVerified) {
        toast.error('Please verify your account first');
        setIsLoading(false);
        return;
      }

      console.log(`🎯 Starting blockchain claim for ${pointsToClaim} points...`);

      const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
      const addresses = await generateAddresses(publicKey.toString());
      const referralCode = generateReferralCode(publicKey.toString());

      console.log('🔍 Fetching current state from blockchain...');
      
      // Get current memo from blockchain
      const currentMemo = await getLatestMemo(connection, addresses.referralAddress, publicKey.toString());
      
      if (!currentMemo) {
        toast.error('No account found on blockchain. Please verify your account first.');
        setIsLoading(false);
        return;
      }

      console.log('✅ Found current state on blockchain');

      // Handle memo format - might include timestamp
      let cleanMemo = currentMemo;
      if (currentMemo.includes(':')) {
        cleanMemo = currentMemo.split(':')[0];
        console.log('🔧 Removed timestamp from memo, new length:', cleanMemo.length, 'chars');
      }

      // Decrypt current state
      console.log('🔓 Decrypting current state...');
      const currentState = await decryptSigFromBackend(cleanMemo);
      
      console.log('✅ Current state decrypted:', currentState);

      // Update points
      const updatedState: UserState = {
        ...currentState,
        p: (currentState.p || 0) + pointsToClaim
      };

      console.log('📝 Updated state with new points:', updatedState);

      // Get new encrypted sig
      console.log('🔐 Requesting new encrypted sig...');
      const newSig = await requestSig(updatedState);
      
      // Add timestamp to make transaction unique
      const timestamp = Date.now();
      const memoData = `${newSig}:${timestamp}`;

      console.log('✅ New sig generated, creating transaction...');

      // Create transaction
      const instructions = createTransferWithMemo(
        publicKey,
        addresses.referralAddress,
        memoData,
        0 // 0 lamports transfer
      );

      const { Transaction } = await import('@solana/web3.js');
      const transaction = new Transaction();
      instructions.forEach(instruction => transaction.add(instruction));
      transaction.feePayer = publicKey;

      // Send transaction
      console.log('📡 Sending claim transaction...');
      const signature = await sendTransaction(connection, transaction, signTransaction);
      
      console.log('🎉 Claim successful! Transaction:', signature);

      // Update localStorage with new total
      const newTotalPoints = (currentState.p || 0) + pointsToClaim;
      localStorage.setItem('desocial_points', newTotalPoints.toString());

      // Use centralized points system to update state
      claimPointsOnBlockchain(pointsToClaim);

      toast.success(`🎉 Successfully claimed ${pointsToClaim} points on blockchain!`);

      if (onClaimSuccess) {
        onClaimSuccess();
      }

    } catch (error) {
      console.error('❌ Claim failed:', error);
      
      let errorMessage = 'Failed to claim points';
      if (error instanceof Error) {
        if (error.message.includes('authenticate data')) {
          errorMessage = 'Cannot decrypt blockchain data. Please try rescanning your account first.';
        } else if (error.message.includes('already been processed')) {
          errorMessage = 'Transaction already processed. Please wait a moment before trying again.';
        } else {
          errorMessage = error.message;
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mb-6">
      <motion.button
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleClick}
        disabled={isLoading || !publicKey || pointsToClaim <= 0}
        className="relative w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold shadow-lg shadow-purple-500/30 overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="relative z-10">
          {isLoading ? 'CLAIMING...' : `CLAIM ${pointsToClaim} POINTS ON-CHAIN`}
        </span>
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600"
          initial={{ x: '100%' }}
          whileHover={{ x: 0 }}
          transition={{ duration: 0.3 }}
        />
      </motion.button>
      
    </div>
  );
}