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
      <head>
        <meta name="base:app_id" content="69cca69d97b57b2203048707" />
      </head>
      <body>
        <WalletContextProvider>
          {children}
          <Toaster />
        </WalletContextProvider>
      </body>
    </html>
  )
}
