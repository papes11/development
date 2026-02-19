"use client";
import React, { useEffect, useState, useRef } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
} from "@/components/ui/dialog";
import Image from "next/image";
import { ChevronRight, LogIn, Loader2 } from "lucide-react";
import { loginWithWallet } from '../solana/loginWallet';
import { UserStateDisplay } from '../solana/memo';

interface LoginWalletProps {
  onLoginSuccess: (userData: UserStateDisplay) => void;
}

const LoginWallet = ({ onLoginSuccess }: LoginWalletProps) => {
  const { connection } = useConnection();
  const { select, wallets, publicKey, disconnect, connecting } = useWallet();

  const [open, setOpen] = useState<boolean>(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const isCheckingRef = useRef(false);

  // Auto-check when wallet connects
  useEffect(() => {
    if (!publicKey || !connection || isCheckingRef.current) return;
    
    isCheckingRef.current = true;
    setIsLoggingIn(true);
    setErrorMessage('');

    const checkAccount = async () => {
      try {
        console.log('Checking account for wallet:', publicKey.toString());
        
        const result = await loginWithWallet(publicKey.toString(), connection);
        
        if (result.success && result.userData) {
          console.log('Login successful');
          onLoginSuccess(result.userData);
        } else {
          console.log('Login failed:', result.error);
          setErrorMessage(result.error || 'No account found');
          setTimeout(() => {
            disconnect();
            setErrorMessage('');
            setIsLoggingIn(false);
            isCheckingRef.current = false;
          }, 3000);
        }
        
      } catch (error) {
        console.error('Login check failed:', error);
        setErrorMessage('Login failed');
        setTimeout(() => {
          disconnect();
          setErrorMessage('');
          setIsLoggingIn(false);
          isCheckingRef.current = false;
        }, 3000);
      }
    };

    checkAccount();
  }, [publicKey?.toString()]);

  // Reset when wallet disconnects
  useEffect(() => {
    if (!publicKey) {
      isCheckingRef.current = false;
      setIsLoggingIn(false);
      setErrorMessage('');
    }
  }, [publicKey]);

  const handleWalletSelect = async (walletName: any) => {
    if (walletName) {
      try {
        select(walletName);
        setOpen(false);
      } catch (error) {
        console.error(error);
      }
    }
  };

  // Show error message
  if (errorMessage) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full p-4 bg-red-500/20 backdrop-blur-xl border border-red-500/30 rounded-2xl text-center"
      >
        <div className="text-red-400 font-semibold">{errorMessage}</div>
      </motion.div>
    );
  }

  // Show logging in state
  if (isLoggingIn || publicKey) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full p-4 bg-blue-500/20 backdrop-blur-xl border border-blue-500/30 rounded-2xl text-center"
      >
        <div className="flex items-center justify-center gap-2 text-white">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="font-semibold">Logging in...</span>
        </div>
      </motion.div>
    );
  }

  // Show login button with wallet selection
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
            <LogIn className="w-5 h-5 mr-2" />
            {connecting ? "Connecting..." : "Login with Wallet"}
          </Button>
        </motion.div>
      </DialogTrigger>
      <DialogContent className="bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl w-[400px] p-0 overflow-hidden z-50">
        <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 p-6 border-b border-white/10">
          <DialogTitle className="text-white font-bold text-center text-xl flex items-center justify-center gap-2">
            <span>Login with Wallet</span>
            <LogIn className="w-5 h-5" />
          </DialogTitle>
          <p className="text-gray-400 text-center text-sm mt-2">
            Choose a wallet to login to DeSocial
          </p>
        </div>
        <div className="p-4 space-y-2">
          {wallets.length === 0 ? (
            <div className="text-white text-center p-4">No wallets found</div>
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
};

export default LoginWallet;
