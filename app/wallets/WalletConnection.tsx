"use client";
import React, { useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
} from "@/components/ui/dialog";
import Image from "next/image";
import { ChevronRight, Wallet } from "lucide-react";

export function toFixed(num: number, fixed: number): string {
  const re = new RegExp(`^-?\\d+(?:\\.\\d{0,${fixed || -1}})?`);
  return num.toString().match(re)![0];
}

const WalletConnection = () => {
  const { connection } = useConnection();
  const { select, wallets, publicKey, disconnect, connecting } = useWallet();

  const [open, setOpen] = useState<boolean>(false);
  const [balance, setBalance] = useState<number | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!connection || !publicKey) {
      return;
    }

    connection.onAccountChange(
      publicKey,
      (updatedAccountInfo) => {
        setBalance(updatedAccountInfo.lamports / LAMPORTS_PER_SOL);
      },
      "confirmed"
    );

    connection.getAccountInfo(publicKey).then((info) => {
      if (info) {
        setBalance(info?.lamports / LAMPORTS_PER_SOL);
      }
    });
  }, [publicKey, connection]);

  const handleWalletSelect = async (walletName: any) => {
    if (walletName) {
      try {
        setError('');
        select(walletName);
        setOpen(false);
      } catch (error: any) {
        console.error('Wallet selection error:', error);
        
        // Handle specific error types
        let errorMessage = 'Failed to connect wallet. Please try again.';
        
        if (error?.message?.includes('User rejected')) {
          errorMessage = 'Connection rejected. Please approve the connection in your wallet.';
        } else if (error?.message?.includes('not installed')) {
          errorMessage = 'Wallet not found. Please install the wallet extension.';
        } else if (error?.message?.includes('Unexpected error')) {
          errorMessage = 'Please unlock your wallet and try again.';
        }
        
        setError(errorMessage);
        setTimeout(() => setError(''), 5000);
      }
    }
  };

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  if (!publicKey) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button 
              className="w-full h-14 bg-gradient-to-r from-purple-500/20 to-blue-500/20 backdrop-blur-xl border border-purple-500/30 hover:border-purple-400/50 text-white font-semibold text-base rounded-2xl transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/25"
              disabled={connecting}
            >
              <Wallet className="w-5 h-5 mr-2" />
              {connecting ? "CONNECTING..." : "CONNECT WALLET"}
            </Button>
          </motion.div>
        </DialogTrigger>
        <DialogContent className="bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl w-[400px] p-0 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 p-6 border-b border-white/10">
            <DialogTitle className="text-white font-bold text-center text-xl">
              Connect Your Wallet
            </DialogTitle>
            <p className="text-gray-400 text-center text-sm mt-2">
              Choose a wallet to connect to DeSocial
            </p>
          </div>
          <div className="p-4 space-y-2">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm text-center"
              >
                {error}
              </motion.div>
            )}
            {wallets.length === 0 ? (
              <div className="text-white text-center p-4">
                <p className="mb-2">No wallets detected</p>
                <p className="text-sm text-gray-400">Please install a Solana wallet like Phantom or Solflare</p>
              </div>
            ) : (
              wallets.map((wallet, index) => (
                <motion.button
                  key={wallet.adapter.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => handleWalletSelect(wallet.adapter.name)}
                  className="w-full p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl text-white font-medium text-sm flex items-center justify-between transition-all duration-200 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                      <Image
                        src={wallet.adapter.icon}
                        alt={wallet.adapter.name}
                        height={20}
                        width={20}
                        className="rounded-sm"
                      />
                    </div>
                    <span>{wallet.adapter.name}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
                </motion.button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div className="relative">
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full p-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-xl border border-green-500/30 rounded-2xl text-white transition-all duration-300"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-400 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <div className="text-sm font-semibold">
                {shortenAddress(publicKey.toString())}
              </div>
              <div className="text-xs text-gray-300">
                {balance ? `${toFixed(balance, 4)} SOL` : "Loading..."}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default WalletConnection;