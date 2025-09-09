'use client'

import { useAccount, useReadContract } from 'wagmi'
import { Loader2, UserPlus } from 'lucide-react'
import { BackgroundAnimation } from './BackgroundAnimation'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card'
import { Button } from './ui/button'
import Link from 'next/link'
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/lib/contract' // Import from your central lib file

export function ProfileGate({ children }) {
  const { address, isConnected } = useAccount()

  // This hook will check if the connected user has a profile.
  const { data: userProfile, isLoading, isError } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'userProfiles',
    args: [address],
    enabled: isConnected, // Only run the check if the wallet is connected
  })

  // Show a loading screen while the check is in progress
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-teal-400" />
      </div>
    )
  }

  // If connected, but profile data indicates it does not exist (userProfile[1] is the `exists` flag)
  // then we show the "Create Profile" message.
  if (isConnected && userProfile && !userProfile[1]) {
    return (
      <div className="relative min-h-screen bg-gray-900 flex items-center justify-center p-4 overflow-hidden">
        <BackgroundAnimation />
        <Card className="bg-gray-800 border-gray-700 max-w-md text-center z-10 shadow-lg">
          <CardHeader>
            <UserPlus className="h-16 w-16 text-cyan-400 mx-auto mb-4" />
            <CardTitle className="text-white text-2xl font-bold">Create Your Profile</CardTitle>
            <CardDescription className="text-gray-400 mt-2">
              To rent, upload, and mint memes on CineVault, you need to create a user profile first.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/profile">
              <Button size="lg" className="w-full bg-teal-500 hover:bg-teal-600 font-bold">
                Get Started
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  // If the user has a profile, is not connected, or if there's an error,
  // we render the actual page content.
  return <>{children}</>
}