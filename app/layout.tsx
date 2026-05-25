import type { Metadata } from 'next'
import '../styles/index.css'
import { WalletContextProvider } from './wallets/wallet-provider'
import { Toaster } from './components/ui/sonner'

export const metadata: Metadata = {
  title: 'DeSocial app',
  description: 'A modern social app built with Next.js',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <WalletContextProvider>
          {children}
          <Toaster />
        </WalletContextProvider>
      </body>
    </html>
  )
}
