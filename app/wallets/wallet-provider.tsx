"use client"

import type React from "react"
import { useMemo, useCallback } from "react"
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react"
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base"
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui"
import { clusterApiUrl } from "@solana/web3.js"

// Import wallet adapter CSS
import "@solana/wallet-adapter-react-ui/styles.css"

export function WalletContextProvider({ children }: { children: React.ReactNode }) {
  // Hardcode devnet network and RPC URL
  const network = WalletAdapterNetwork.Devnet
  
  const endpoint = useMemo(() => {
    // Hardcode devnet RPC URL
    return 'https://api.devnet.solana.com'
  }, [])

  // Using an empty array since we're using the wallet standard which auto-discovers wallets
  const wallets = useMemo(() => [], [])

  // Handle wallet errors gracefully
  const onError = useCallback((error: any) => {
    // Log error for debugging but don't show to user
    console.log('Wallet error (expected):', error?.message || error);
    
    // These are normal errors that happen during wallet interaction
    // - User rejected connection
    // - Wallet not installed
    // - Wallet locked
    // We handle these in the UI components, so we can ignore them here
  }, []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect onError={onError}>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}