'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { User, Edit, Film, Upload, Star, DollarSign, Wallet, Loader2, Play, Image, Sparkles, Crown, Shield } from 'lucide-react' 
import Link from 'next/link'
import { CONTRACT_ADDRESS, CONTRACT_ABI, handleContractError } from '@/lib/contract'
import { useToast } from '@/hooks/use-toast'
import { BackgroundAnimation } from '@/components/BackgroundAnimation'
import { format, formatDistanceToNow } from 'date-fns'
import { useQueries } from '@tanstack/react-query'

// ADMIN PANEL SUB-COMPONENT
const AdminPanel = () => {
  const { toast } = useToast()
  
  const { data: spotlightMeme, refetch: refetchSpotlight } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getSpotlightMeme',
  })
  
  const { data: lastSpotlightTimestamp, refetch: refetchTimestamp } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'lastSpotlightTimestamp',
  })

  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  useEffect(() => {
      if (isSuccess) {
          toast({ title: "VRF Request Sent!", description: "A new spotlight winner will be selected shortly by the Chainlink oracle." })
          refetchSpotlight()
          refetchTimestamp()
      }
  }, [isSuccess, toast, refetchSpotlight, refetchTimestamp])

  const handleRequestWinner = () => {
    toast({ title: "Sending Transaction...", description: "Please confirm in your wallet to request a winner." })
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'requestSpotlightWinner',
    })
  }

  const nextEligibleTime = lastSpotlightTimestamp ? (Number(lastSpotlightTimestamp) + 86400) * 1000 : 0
  const isCooldownActive = Date.now() < nextEligibleTime

  return (
    <motion.div variants={{ hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } }}>
        <Card className="bg-gray-800/50 border-violet-700 mt-8">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-violet-400"><Crown className="h-6 w-6" /> Admin Controls</CardTitle>
                <CardDescription>This panel is only visible to the platform owner.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <h4 className="font-semibold mb-2">Current Spotlight Winner</h4>
                    {spotlightMeme && spotlightMeme.id > 0 ? (
                        <div className="bg-gray-900 p-3 rounded-lg flex items-center gap-4">
                            <img src={`https://gateway.pinata.cloud/ipfs/${spotlightMeme.imageCID}`} alt={spotlightMeme.title} className="w-16 h-16 rounded-md object-cover"/>
                            <div>
                                <p className="font-bold">{spotlightMeme.title}</p>
                                <p className="text-xs text-gray-400 font-mono">Creator: {spotlightMeme.creator}</p>
                            </div>
                        </div>
                    ) : (
                        <p className="text-gray-400 text-sm">No spotlight winner has been selected yet.</p>
                    )}
                </div>
                <div>
                    <Button onClick={handleRequestWinner} disabled={isCooldownActive || isPending || isConfirming} className="w-full bg-violet-500 hover:bg-violet-600">
                        {isPending || isConfirming ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Processing...</> : "Select Daily Spotlight Winner"}
                    </Button>
                    {isCooldownActive && (
                        <p className="text-center text-xs text-yellow-400 mt-2">
                           Next winner can be selected {formatDistanceToNow(new Date(nextEligibleTime), { addSuffix: true })}.
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    </motion.div>
  )
}


export default function ProfilePage() {
  const [isMounted, setIsMounted] = useState(false)
  const { address, isConnected } = useAccount()
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [profileData, setProfileData] = useState({ username: '' })
  const [userMovies, setUserMovies] = useState([])
  const [userMemes, setUserMemes] = useState([])
  const pathname = usePathname()

  const productionPaths = ['/profile', '/upload']
  const isProductionHousePortal = productionPaths.some(path => pathname.startsWith(path));

  const navItemsToDisplay = isProductionHousePortal ? true: false;


  const { data: platformOwner } = useReadContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'platformOwner'
  })
  
  // VITAL FIX IS HERE
  const isOwner = useMemo(() => {
    if (!isConnected || !address || !platformOwner) return false;
    return address.toLowerCase() === platformOwner.toLowerCase();
  }, [isConnected, address, platformOwner]);

  const { data: userProfile, refetch: refetchProfile } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'userProfiles',
    args: [address],
    enabled: !!address,
  })

  const { data: userMovieIds } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'userUploadedMovieIds',
    args: [address],
    enabled: !!address,
  })

  const { data: userMemeIds } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'userMemeIds',
    args: [address],
    enabled: !!address,
  })

  const movieQueries = useQueries({
    queries: (userMovieIds ?? []).map(id => ({ address: CONTRACT_ADDRESS, abi: CONTRACT_ABI, functionName: 'movies', args: [id] }))
  })

  const memeQueries = useQueries({
    queries: (userMemeIds ?? []).map(id => ({ address: CONTRACT_ADDRESS, abi: CONTRACT_ABI, functionName: 'memes', args: [id] }))
  })
  
  useEffect(() => {
    const movieData = movieQueries.map(q => q.data).filter(Boolean);
    if(movieData.length > 0) setUserMovies(movieData);
  }, [movieQueries])

  useEffect(() => {
    const memeData = memeQueries.map(q => q.data).filter(Boolean);
    if(memeData.length > 0) setUserMemes(memeData);
  }, [memeQueries])

  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  useEffect(() => { setIsMounted(true) }, [])

  useEffect(() => {
    if (userProfile) { setProfileData({ username: userProfile[0] || '' }) }
  }, [userProfile])

  useEffect(() => {
    if (isSuccess) {
      toast({ title: "Profile Updated!", description: "Your profile has been successfully updated." })
      setIsEditing(false)
      refetchProfile()
    }
  }, [isSuccess, toast, refetchProfile])

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'createProfile',
        args: [profileData.username],
    }, {
        onError: (error) => toast({ title: "Error", description: handleContractError(error), variant: "destructive" })
    })
  }

  const formatPrice = (price) => (Number(price) / 1e18).toFixed(4)
  const totalEarnings = userMovies.reduce((sum, movie) => sum + (Number(movie.rentalCount) * Number(movie.pricePerDay) * 0.9), 0)
  const totalRentals = userMovies.reduce((sum, movie) => sum + Number(movie.rentalCount), 0)
  const hasActiveDiscount = userProfile && userProfile[2] && (Number(userProfile[3]) * 1000 > Date.now());
  const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { duration: 0.5 } } }

  if (!isMounted) return <div className="min-h-screen bg-gray-900 flex items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-teal-400" /></div>
  if (!isConnected) return (
      <div className="relative min-h-screen bg-gray-900 flex items-center justify-center p-4 overflow-hidden"><BackgroundAnimation /><Card className="bg-gray-800 border-gray-700 max-w-md text-center z-10"><CardHeader><Wallet className="h-16 w-16 text-cyan-400 mx-auto mb-4" /><CardTitle className="text-white text-2xl font-bold">Connect Your Wallet</CardTitle><CardDescription className="text-gray-400">Please connect your wallet to create or view your profile.</CardDescription></CardHeader></Card></div>
  )

  return (
    <div className="relative min-h-screen bg-gray-900 text-white py-12 pt-24 md:py-16 md:pt-28 overflow-hidden">
      <BackgroundAnimation />
      <motion.div className="max-w-7xl mx-auto px-4 z-10 relative" initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.1 } } }}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <motion.div className="lg:col-span-4" variants={itemVariants}>
            <Card className="bg-gray-800 border-gray-700 h-full flex flex-col">
              <CardHeader className="text-center items-center flex flex-col">
                 {isOwner && (<Badge variant="secondary" className="bg-violet-500/20 text-violet-300 self-center mb-2"><Shield className="mr-1 h-3 w-3" /> Platform Owner</Badge>)}
                <div className="relative w-32 h-32 mb-4"><div className="w-full h-full rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center border-4 border-gray-800"><User className="h-16 w-16 text-white" /></div></div>
                <CardTitle className="text-2xl font-bold">{userProfile ? userProfile[0] : 'Anonymous User'}</CardTitle>
                <CardDescription className="text-sm font-mono break-all mt-1">{address}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                {hasActiveDiscount && (<div className="bg-yellow-500/10 border border-yellow-400 text-yellow-300 p-3 rounded-lg text-center mb-6"><div className="flex items-center justify-center font-bold text-lg"><Sparkles className="mr-2 h-5 w-5 animate-pulse" /> Spotlight Winner!</div><p className="text-sm mt-1">You have a 20% discount on all rentals!</p><p className="text-xs text-yellow-400 mt-1">Expires: {format(new Date(Number(userProfile[3]) * 1000), 'PPpp')}</p></div>)}
                {!isEditing ? (<><Button onClick={() => setIsEditing(true)} className="w-full bg-teal-500 hover:bg-teal-600 font-bold"><Edit className="mr-2 h-4 w-4" />{userProfile && userProfile[1] ? 'Edit Profile' : 'Create Profile'}</Button><div className="mt-6 space-y-4"><h3 className="font-semibold text-lg text-white">Your Stats</h3><div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-gray-400">
                    <Film className="h-4 w-4" /> Movies Uploaded</span>
                    <Badge variant="secondary" className="bg-cyan-500/20 text-cyan-300">{userMovies.length}</Badge></div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2 text-gray-400">
                            <Star className="h-4 w-4" /> Total Movie Rentals</span>
                            <Badge variant="secondary" className="bg-pink-500/20 text-pink-300">{totalRentals}</Badge></div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="flex items-center gap-2 text-gray-400">
                                <DollarSign className="h-4 w-4" /> Total Earnings</span>
                                <Badge variant="secondary" className="bg-teal-500/20 text-teal-300">{formatPrice(totalEarnings)} Eth</Badge></div>
                                </div></>) : (<form onSubmit={handleProfileSubmit} className="space-y-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="username">Username</Label>
                                    <Input id="username" value={profileData.username} onChange={(e) => setProfileData(p => ({ ...p, username: e.target.value }))} placeholder="Enter your username" required /></div>
                                    <div className="flex gap-2 pt-2"><Button type="submit" disabled={isPending || isConfirming} className="flex-1 bg-teal-500 hover:bg-teal-600 font-bold">{isPending || isConfirming ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : 'Save Changes'}</Button><Button type="button" onClick={() => setIsEditing(false)} variant="outline">Cancel</Button></div></form>)}
              </CardContent>
            </Card>
          </motion.div>
          <motion.div className="lg:col-span-8" variants={itemVariants}>
            <Tabs defaultValue="movies" className="w-full">
              <TabsList className="grid w-full grid-cols-1">
                <TabsTrigger value="movies">Your Movies</TabsTrigger>
                </TabsList>
              <TabsContent value="movies" className="mt-6">
                 <Card className="bg-gray-800/50 border-gray-700"><CardHeader className="flex-row items-center justify-between"><CardTitle>Your Uploads</CardTitle><Link href="/upload"><Button variant="outline" className="border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-white font-bold"><Upload className="mr-2 h-4 w-4" /> Upload New Movie</Button></Link></CardHeader><CardContent>{userMovies.length === 0 ? (<div className="text-center py-16"><Film className="h-16 w-16 mx-auto text-gray-600 mb-4" /><h4 className="text-lg font-semibold mb-2">You haven't uploaded any movies yet.</h4></div>) : (<div className="grid grid-cols-1 md:grid-cols-2 gap-6">{userMovies.map((movie) => (<motion.div key={movie.id} whileHover={{ y: -5 }}><Card className="bg-gray-800 border-gray-700 hover:border-teal-500 overflow-hidden group h-full flex flex-col"><CardHeader className="p-0"><div className="aspect-video overflow-hidden"><motion.img src={movie.thumbnailCID ? `https://gateway.pinata.cloud/ipfs/${movie.thumbnailCID}` : `/placeholder.svg`} alt={movie.title} className="w-full h-full object-cover" whileHover={{ scale: 1.1 }} /></div></CardHeader><CardContent className="p-4 flex flex-col flex-grow"><h4 className="font-semibold text-lg truncate">{movie.title}</h4><div className="flex justify-between items-center text-sm my-2"><Badge variant="secondary" className="bg-cyan-500 text-white shrink-0">{movie.genre}</Badge><div className="flex items-center gap-1.5 text-yellow-400"><Star className="h-4 w-4 fill-current" /><span>{Number(movie.rentalCount)} rentals</span></div></div><div className="mt-auto flex justify-between items-center"><div className="font-semibold text-teal-400">{formatPrice(movie.pricePerDay)} Eth/day</div><Link href={`/movie/${movie.id}`}><Button size="sm" className="bg-teal-500 hover:bg-teal-600 font-bold"><Play className="mr-2 h-4 w-4" /> View</Button></Link></div></CardContent></Card></motion.div>))}</div>)}</CardContent></Card>
              </TabsContent>
              {/* <TabsContent value="memes" className="mt-6">
                 <Card className="bg-gray-800/50 border-gray-700"><CardHeader className="flex-row items-center justify-between"><CardTitle>Your Memes</CardTitle><Link href="/mint-meme"><Button variant="outline" className="border-violet-400 text-violet-400 hover:bg-violet-400 hover:text-white font-bold"><Image className="mr-2 h-4 w-4" /> Mint New Meme</Button></Link></CardHeader><CardContent>{userMemes.length === 0 ? (<div className="text-center py-16"><Image className="h-16 w-16 mx-auto text-gray-600 mb-4" /><h4 className="text-lg font-semibold mb-2">You haven't minted any memes yet.</h4></div>) : (<div className="grid grid-cols-2 md:grid-cols-3 gap-4">{userMemes.map((meme) => (<motion.div key={meme.id} whileHover={{ y: -5 }}><Card className="bg-gray-800 border-gray-700 hover:border-violet-500 overflow-hidden group relative">{meme.isSpotlighted && (<Badge className="absolute top-2 right-2 bg-yellow-500 text-black font-bold z-10"><Sparkles className="h-3 w-3 mr-1"/> Spotlight</Badge>)}<div className="aspect-square overflow-hidden"><img src={`https://gateway.pinata.cloud/ipfs/${meme.imageCID}`} alt={meme.title} className="w-full h-full object-cover group-hover:scale-110" /></div><div className="p-2 bg-gray-900/50"><p className="font-semibold text-sm truncate text-white">{meme.title}</p></div></Card></motion.div>))}</div>)}</CardContent></Card>
              </TabsContent> */}
            </Tabs>
          </motion.div>
        </div>
         {isOwner && <AdminPanel />}
      </motion.div>
    </div>
  )
}