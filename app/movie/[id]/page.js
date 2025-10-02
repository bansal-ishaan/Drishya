'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { BackgroundAnimation } from '@/components/BackgroundAnimation'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { motion } from 'framer-motion'
import { parseEther } from 'viem'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
// MODIFIED: Added Sparkles for discount, Minus/Plus for day counter
import { Play, Star, User, DollarSign, Loader2, CheckCircle, Info, Video, Wallet, XCircle, Sparkles, Minus, Plus } from 'lucide-react'
import { Input } from '@/components/ui/input' // ADDED: Input for number of days
import { CONTRACT_ADDRESS, CONTRACT_ABI, handleContractError } from '@/lib/contract'
import { useToast } from '@/hooks/use-toast'

const Loader = () => (
  <div className="min-h-screen bg-gray-900 flex items-center justify-center">
    <Loader2 className="h-12 w-12 animate-spin text-teal-400" />
  </div>
)

export default function MoviePage() {
  const [isMounted, setIsMounted] = useState(false)
  const { id } = useParams()
  const { address, isConnected } = useAccount()
  const { toast } = useToast()
  
  // MODIFIED: State simplified for new rental logic
  const [rentalDays, setRentalDays] = useState(1) 
  const [playerState, setPlayerState] = useState('trailer') 

  useEffect(() => { setIsMounted(true) }, [])

  // MODIFIED: Fetching from the public `movies` mapping now
  const { data: movie, isLoading: isLoadingMovie, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'movies',
    args: [BigInt(id)],
    enabled: isMounted && !!id,
  })

  const { data: hasRental, refetch: refetchHasRental } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'hasActiveRental',
    args: [address, BigInt(id)],
    enabled: isMounted && !!address && !!id,
  })

  // ADDED: Fetch user profile to check for discount
  const { data: userProfile } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'userProfiles',
    args: [address],
    enabled: isMounted && !!address,
  })

  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  // ADDED: Logic to determine if user has an active discount
  const hasActiveDiscount = useMemo(() => {
    if (!userProfile) return false;
    // userProfile[2] is hasDiscount (bool), userProfile[3] is discountExpiryTimestamp (BigInt)
    const hasDiscount = userProfile[2];
    const expiryTimestamp = Number(userProfile[3]) * 1000; // Convert to JS timestamp
    return hasDiscount && expiryTimestamp > Date.now();
  }, [userProfile])

  // ADDED: Logic to calculate total cost including discount
  const totalCost = useMemo(() => {
    if (!movie) return BigInt(0);
    const baseCost = movie.pricePerDay * BigInt(rentalDays);
    if (hasActiveDiscount) {
      // Apply 20% discount: cost * 80 / 100
      return (baseCost * BigInt(80)) / BigInt(100);
    }
    return baseCost;
  }, [movie, rentalDays, hasActiveDiscount]);

  useEffect(() => {
    if (hasRental) {
      setPlayerState('rented_overlay');
    } else {
      setPlayerState('trailer');
    }
  }, [hasRental])

  useEffect(() => {
    if (isSuccess) {
      toast({
        title: "Rental Successful!",
        description: "You now have access to watch this movie.",
      })
      refetchHasRental()
    }
  }, [isSuccess, toast, refetchHasRental])
  
  // REMOVED: Old `movieData` and `pricing` useEffects

  const formatPrice = (priceInWei) => (Number(priceInWei) / 1e18).toFixed(5)
  // REMOVED: getDurationInSeconds is no longer needed

  const handleRent = async () => {
    if (!isConnected || !movie || rentalDays <= 0) return
    try {
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'rentMovie',
        // MODIFIED: Args are now movieId and numDays
        args: [BigInt(id), BigInt(rentalDays)],
        // MODIFIED: Value is the calculated totalCost
        value: totalCost, 
      })
    } catch (error) {
      toast({ title: "Rental Failed", description: handleContractError(error), variant: "destructive" })
    }
  }

  const handleWatchNow = () => { /* ... no changes here ... */ }
  const containerVariants = { /* ... no changes here ... */ }
  const itemVariants = { /* ... no changes here ... */ }
  
  const handleDaysChange = (amount) => {
    setRentalDays(prev => Math.max(1, prev + amount));
  };


  if (!isMounted || isLoadingMovie) {
    return <Loader />
  }

  // MODIFIED: A movie with ID 0 is invalid
  if (!movie || movie.id === BigInt(0)) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <Card className="bg-gray-800 border-gray-700 max-w-md text-center">
          <CardHeader>
            <XCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <CardTitle className="text-white text-2xl font-bold">Movie Not Found</CardTitle>
            <CardDescription className="text-gray-400">Could not find a movie with the specified ID.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white py-12 pt-24 md:py-16 md:pt-28">
      <BackgroundAnimation />
      <motion.div
        className="max-w-7xl mx-auto px-4"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Player and Details (Largely the same) */}
          <motion.div className="lg:col-span-2 space-y-8" variants={itemVariants}>
            {/* Player Card is the same */}
            <Card className="bg-gray-800 border-gray-700 overflow-hidden">
               {/* ... no changes inside the player card ... */}
            </Card>

            <Card className="bg-gray-800 border-gray-700">
                {/* ... CardHeader and CardContent largely the same ... just remove language badge if it's not in the new struct */}
                <CardHeader>
                  <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                    <div>
                      <CardTitle className="text-4xl font-extrabold mb-3">{movie.title}</CardTitle>
                      <div className="flex gap-2">
                        <Badge className="bg-cyan-500 text-white">{movie.genre || 'N/A'}</Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-yellow-400 text-lg font-semibold bg-gray-900 px-3 py-1.5 rounded-lg shrink-0">
                      <Star className="h-5 w-5 fill-current" />
                      <span>{Number(movie.rentalCount)} Rentals</span>
                    </div>
                  </div>
              </CardHeader>
               <CardContent>
                <p className="text-gray-300 text-base leading-relaxed mb-6">{movie.description || 'No description available.'}</p>
                 <Tabs defaultValue="details" className="w-full">
                  {/* ... Tabs are the same ... */}
                 </Tabs>
              </CardContent>
            </Card>
          </motion.div>

          {/* Right Column: Rental Card (Completely Overhauled) */}
          <motion.div className="lg:col-span-1" variants={itemVariants}>
            <div className="lg:sticky lg:top-28">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold flex items-center gap-2">
                    <Video className="h-6 w-6 text-teal-400" />
                    Rent This Movie
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {hasRental ? (
                    <div className="text-center py-6">
                      <div className="bg-teal-500/10 border border-teal-500/20 rounded-lg p-4">
                        <p className="text-teal-300 font-semibold">You already own this rental.</p>
                        <p className="text-gray-400 text-sm">You can watch the movie now.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                       {/* Price Per Day */}
                       <div className="text-center border-b border-gray-700 pb-4">
                        <p className="text-gray-400 text-sm">Price Per Day</p>
                        <p className="text-2xl font-bold text-teal-400">{formatPrice(movie.pricePerDay)} <span className="text-lg">STT</span></p>
                      </div>

                      {/* Day Selector */}
                      <div className="space-y-2 text-center">
                        <Label htmlFor="days" className="font-semibold text-lg">Select Rental Duration</Label>
                        <div className="flex items-center justify-center gap-4">
                           <Button size="icon" variant="outline" onClick={() => handleDaysChange(-1)} disabled={rentalDays <= 1}>
                              <Minus className="h-4 w-4" />
                           </Button>
                           <h2 className="text-3xl font-bold w-16 text-center">{rentalDays}</h2>
                           <Button size="icon" variant="outline" onClick={() => handleDaysChange(1)}>
                              <Plus className="h-4 w-4" />
                           </Button>
                        </div>
                        <p className="text-gray-500 text-sm">{rentalDays} Day{rentalDays > 1 ? 's' : ''} of access</p>
                      </div>

                       {/* Discount Info */}
                       {hasActiveDiscount && (
                         <div className="bg-yellow-500/10 text-yellow-300 p-3 rounded-lg text-center text-sm">
                           <p className="font-bold flex items-center justify-center">
                             <Sparkles className="mr-2 h-4 w-4" /> 20% Spotlight Discount Applied!
                           </p>
                         </div>
                       )}

                      {/* Total Cost Display */}
                      <div className="text-center pt-3">
                        <p className="text-gray-400 text-sm">Total Price</p>
                        <p className="text-4xl font-bold text-teal-400">{formatPrice(totalCost)} <span className="text-2xl">STT</span></p>
                         {hasActiveDiscount && (
                           <p className="text-xs text-gray-500 line-through">
                             Original: {formatPrice(movie.pricePerDay * BigInt(rentalDays))} STT
                           </p>
                         )}
                      </div>

                      <Button onClick={handleRent} disabled={!isConnected || isPending || isConfirming || address === movie.owner} size="lg" className="w-full bg-teal-500 hover:bg-teal-600 font-bold text-lg h-14 disabled:bg-gray-600">
                        {
                          !isConnected ? <><Wallet className="mr-2 h-5 w-5" />Connect Wallet</> :
                          address === movie.owner ? <><XCircle className="mr-2 h-5 w-5" />Cannot Rent Own Movie</> :
                          isPending || isConfirming ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Processing...</> :
                          <><Play className="mr-2 h-5 w-5" />Rent Now</>
                        }
                      </Button>
                      <div className="text-xs text-gray-500 text-center pt-2">
                        <p>90% goes to the owner, 10% to the platform.</p>
                        <p>Instant access after blockchain confirmation.</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}