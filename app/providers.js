'use client'

import '@rainbow-me/rainbowkit/styles.css'
import { getDefaultConfig, RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { WagmiProvider } from 'wagmi'
import { QueryClientProvider, QueryClient } from '@tanstack/react-query'
import { ThemeProvider } from '@/components/theme-provider'
import { sepolia } from 'viem/chains'

// Somnia Testnet configuration
// const somniaTestnet = {
//   id: 50312,
//   name: 'Somnia Testnet',
//   nativeCurrency: { name: 'Somnia Test Token', symbol: 'Eth', decimals: 18 },
//   rpcUrls: {
//     default: { http: ['https://dream-rpc.somnia.network'] },
//   },
//   blockExplorers: {
//     default: { name: 'Somnia Explorer', url: 'https://shannon-explorer.somnia.network' },
//   },
//   testnet: true,
// }

const config = getDefaultConfig({
  appName: 'Drishya',
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT, // Your WalletConnect project ID
  chains: [sepolia],
  ssr: true,
})

const queryClient = new QueryClient()

export function Providers({ children }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}