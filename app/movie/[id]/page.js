'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { BackgroundAnimation } from '@/components/BackgroundAnimation'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs' // Re-added Tabs
import { Play, Star, User, DollarSign, Loader2, CheckCircle, Info, Video, Wallet, XCircle, Sparkles, Minus, Plus } from 'lucide-react' // Re-added more icons
import { CONTRACT_ADDRESS, CONTRACT_ABI, handleContractError } from '@/lib/contract'
import { useToast } from '@/hooks/use-toast'
import { Label } from '@/components/ui/label'

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
  const [rentalDays, setRentalDays] = useState(1)
  const [playerState, setPlayerState] = useState('trailer')

  useEffect(() => { setIsMounted(true) }, [])

  // Wagmi hook returns an array for a struct.
  const { data: movieData, isLoading: isLoadingMovie } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'movies',
    args: [BigInt(id)],
    enabled: isMounted && !!id,
  })

  // Parse the raw array into a structured object for easier access.
  const movie = useMemo(() => {
    if (!movieData) return null
    return {
      id: movieData[0],
      owner: movieData[1],
      title: movieData[2],
      genre: movieData[3],
      description: movieData[4],
      filmCID: movieData[5],
      trailerCID: movieData[6],
      thumbnailCID: movieData[7],
      pricePerDay: movieData[8],
      rentalCount: movieData[9],
      listed: movieData[10],
    }
  }, [movieData])

  const { data: hasRental, refetch: refetchHasRental } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'hasActiveRental',
    args: [address, BigInt(id)],
    enabled: isMounted && !!address && !!id,
  })

  const { data: userProfile } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'userProfiles',
    args: [address],
    enabled: isMounted && !!address,
  })

  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const hasActiveDiscount = useMemo(() => {
    if (!userProfile) return false
    const hasDiscount = userProfile[2]
    const expiryTimestamp = Number(userProfile[3]) * 1000
    return hasDiscount && expiryTimestamp > Date.now()
  }, [userProfile])

  // --- VITAL FIX: All calculations now use BigInts ---
  const totalCost = useMemo(() => {
    if (!movie || !movie.pricePerDay) return 0n // Return a BigInt `0`
    
    const pricePerDayBigInt = movie.pricePerDay; // It's already a BigInt
    const rentalDaysBigInt = BigInt(rentalDays); // Convert rentalDays to a BigInt
    
    const baseCost = pricePerDayBigInt * rentalDaysBigInt; // Now this is safe

    if (hasActiveDiscount) {
      // Use BigInts for discount calculation too to avoid mixing types
      return (baseCost * 80n) / 100n; // 80n and 100n are BigInt literals
    }
    return baseCost;
  }, [movie, rentalDays, hasActiveDiscount]);

  useEffect(() => {
    if (hasRental) setPlayerState('rented_overlay')
    else setPlayerState('trailer')
  }, [hasRental])

  useEffect(() => {
    if (isSuccess) {
      toast({ title: "Rental Successful!", description: "You now have access to watch this movie." })
      refetchHasRental()
    }
  }, [isSuccess, toast, refetchHasRental])

  const formatPrice = (priceInWei) => (Number(priceInWei) / 1e18).toFixed(5)

  const handleRent = async () => {
    if (!isConnected || !movie || rentalDays <= 0) return
    try {
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'rentMovie',
        args: [BigInt(id), BigInt(rentalDays)],
        value: totalCost, // totalCost is already a correctly calculated BigInt
      })
    } catch (error) {
      toast({ title: "Rental Failed", description: handleContractError(error), variant: "destructive" })
    }
  }
  
  const handleWatchNow = () => { /* Player logic */ };

  const handleDaysChange = (amount) => {
    setRentalDays(prev => Math.max(1, prev + amount))
  }

  if (!isMounted || isLoadingMovie) {
    return <Loader />
  }

  // A valid movie should have an ID greater than 0
  if (!movie || movie.id === 0n) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <Card className="bg-gray-800 border-gray-700 max-w-md text-center"><CardHeader><XCircle className="h-16 w-16 text-red-400 mx-auto mb-4" /><CardTitle className="text-white text-2xl font-bold">Movie Not Found</CardTitle><CardDescription className="text-gray-400">Could not find a movie with the specified ID.</CardDescription></CardHeader></Card>
      </div>
    )
  }
  
  const ownerIsRenter = isConnected && address?.toLowerCase() === movie.owner?.toLowerCase();


  return (
    <div className="min-h-screen bg-gray-900 text-white py-12 pt-24 md:py-16 md:pt-28">
      <BackgroundAnimation />
      <motion.div className="max-w-7xl mx-auto px-4" initial="hidden" animate="visible" >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <motion.div className="lg:col-span-2 space-y-8">
             {/* Player card should have player logic added back */}
             <Card className="bg-gray-800 border-gray-700 overflow-hidden">
                {/* ... your player video/overlay logic ... */}
             </Card>
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader><div className="flex flex-col md:flex-row justify-between items-start gap-4"><div><CardTitle className="text-4xl font-extrabold mb-3">{movie.title}</CardTitle><div className="flex gap-2"><Badge className="bg-cyan-500 text-white">{movie.genre || 'N/A'}</Badge></div></div><div className="flex items-center gap-2 text-yellow-400 text-lg font-semibold bg-gray-900 px-3 py-1.5 rounded-lg shrink-0"><Star className="h-5 w-5 fill-current" /><span>{Number(movie.rentalCount)} Rentals</span></div></div></CardHeader>
              <CardContent>
                <p className="text-gray-300 text-base leading-relaxed mb-6">{movie.description || 'No description available.'}</p>
                <Tabs defaultValue="details" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 bg-gray-900 border-gray-700"><TabsTrigger value="details">Details</TabsTrigger><TabsTrigger value="owner">Ownership</TabsTrigger></TabsList>
                  <TabsContent value="details" className="mt-4 text-gray-300"><div className="flex items-center gap-2"><Info className="h-4 w-4 text-cyan-400" />Movie ID: #{Number(movie.id)}</div></TabsContent>
                  <TabsContent value="owner" className="mt-4 text-gray-300"><div className="flex items-center gap-2"><User className="h-4 w-4 text-cyan-400" />Owner: <span className="font-mono text-sm break-all">{movie.owner}</span></div></TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </motion.div>

          {/* Right Column */}
          <motion.div className="lg:col-span-1">
            <div className="lg:sticky lg:top-28">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader><CardTitle className="text-2xl font-bold flex items-center gap-2"><Video className="h-6 w-6 text-teal-400" />Rent This Movie</CardTitle></CardHeader>
                <CardContent>
                  {hasRental ? (<div className="text-center py-6"><div className="bg-teal-500/10 border border-teal-500/20 rounded-lg p-4"><p className="text-teal-300 font-semibold">You already have an active rental.</p><p className="text-gray-400 text-sm">You can watch the movie now.</p></div></div>) : (
                    <div className="space-y-4">
                      <div className="text-center border-b border-gray-700 pb-4"><p className="text-gray-400 text-sm">Price Per Day</p><p className="text-2xl font-bold text-teal-400">{formatPrice(movie.pricePerDay)} <span className="text-lg">STT</span></p></div>
                      <div className="space-y-2 text-center"><Label htmlFor="days" className="font-semibold text-lg">Select Rental Duration</Label><div className="flex items-center justify-center gap-4"><Button size="icon" variant="outline" onClick={() => handleDaysChange(-1)} disabled={rentalDays <= 1}><Minus className="h-4 w-4" /></Button><h2 className="text-3xl font-bold w-16 text-center">{rentalDays}</h2><Button size="icon" variant="outline" onClick={() => handleDaysChange(1)}><Plus className="h-4 w-4" /></Button></div><p className="text-gray-500 text-sm">{rentalDays} Day{rentalDays > 1 ? 's' : ''} of access</p></div>
                      {hasActiveDiscount && (<div className="bg-yellow-500/10 text-yellow-300 p-3 rounded-lg text-center text-sm"><p className="font-bold flex items-center justify-center"><Sparkles className="mr-2 h-4 w-4" /> 20% Spotlight Discount Applied!</p></div>)}
                      <div className="text-center pt-3">
                        <p className="text-gray-400 text-sm">Total Price</p>
                        <p className="text-4xl font-bold text-teal-400">{formatPrice(totalCost)} <span className="text-2xl">STT</span></p>
                        {hasActiveDiscount && (<p className="text-xs text-gray-500 line-through">Original: {formatPrice(movie.pricePerDay * BigInt(rentalDays))} STT</p>)}
                      </div>
                      <Button onClick={handleRent} disabled={!isConnected || isPending || isConfirming || ownerIsRenter} size="lg" className="w-full bg-teal-500 hover:bg-teal-600 font-bold text-lg h-14 disabled:bg-gray-600">
                        {!isConnected ? <><Wallet className="mr-2 h-5 w-5" />Connect Wallet</> : ownerIsRenter ? <><XCircle className="mr-2 h-5 w-5" />Cannot Rent Own Movie</> : isPending || isConfirming ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Processing...</> : <><Play className="mr-2 h-5 w-5" />Rent Now</>}
                      </Button>
                      <div className="text-xs text-gray-500 text-center pt-2"><p>90% goes to the owner, 10% to the platform.</p><p>Instant access after blockchain confirmation.</p></div>
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