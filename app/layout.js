'use client'

import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { Navbar } from '@/components/navbar'
import { Toaster } from '@/components/ui/toaster'
import { usePathname } from 'next/navigation'
import Head from 'next/head' // Import Head

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({ children }) {
  const pathname = usePathname()
  const showNavbar = pathname !== '/'

  return (
    <html lang="en" className="dark">
      <Head>
        <title>CineVault - Decentralized Movie Platform</title>
        <meta name="CineVault" content="Upload, rent, and watch movies on a decentralized platform." />
      </Head>
      <body className={`${inter.className} bg-gray-900`}>
        <Providers>
          {showNavbar && <Navbar />}
          <main>{children}</main>
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
