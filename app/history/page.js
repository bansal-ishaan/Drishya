'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAccount, useReadContract } from 'wagmi' // MODIFIED: useQueries for batch fetching
import { BackgroundAnimation } from '@/components/BackgroundAnimation'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { History, Play, Clock, Calendar, Wallet, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/lib/contract'
import { format, formatDistanceToNowStrict } from 'date-fns' // ADDED: date-fns for better time formatting
import { ProfileGate } from '@/components/ProfileGate'
import { useQueries } from '@tanstack/react-query' 
export default function HistoryPage() {
  const [isMounted, setIsMounted] = useState(false)
  const { address, isConnected } = useAccount()
  const [allRentals, setAllRentals] = useState([])
  const [moviesMap, setMoviesMap] = useState({})
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // MODIFIED: Fetches all user rentals with a single hook
  const { data: userRentals, isLoading: isLoadingRentals } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getUserRentals',
    args: [address],
    enabled: !!address,
  })

  // Get a unique list of all movie IDs from the rentals
  const uniqueMovieIds = useMemo(() => {
    if (!userRentals) return [];
    const ids = userRentals.map(rental => rental.movieId);
    return [...new Set(ids)];
  }, [userRentals]);

  // MODIFIED: Use `useQueries` to fetch data for multiple movies efficiently in a batch
  const movieQueries = useQueries({
    queries: uniqueMovieIds.map(id => ({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'movies',
      args: [id],
    })),
    // This will combine the loading states.
    // It is loading until every query has finished.
    combine: (results) => {
      return {
        data: results.map(result => result.data),
        isLoading: results.some(result => result.isLoading),
      }
    },
  })

  // When rental data comes in, sort it and save it.
  useEffect(() => {
    if (userRentals) {
      // Sort by most recently rented first
      const sortedRentals = [...userRentals].sort((a, b) => Number(b.rentedAt) - Number(a.rentedAt));
      setAllRentals(sortedRentals);
    }
  }, [userRentals]);
  
  // When movie data comes in from the batched query, create a map for easy lookup
  useEffect(() => {
    if (!movieQueries.isLoading && movieQueries.data.length) {
        const movieMap = movieQueries.data.reduce((acc, movie) => {
          if(movie && movie.id > 0){
            acc[Number(movie.id)] = movie;
          }
          return acc;
        }, {});
        setMoviesMap(movieMap);
    }
  }, [movieQueries.data, movieQueries.isLoading]);
  
  // Overall loading state
  useEffect(() => {
    setIsLoading(isLoadingRentals || movieQueries.isLoading)
  },[isLoadingRentals, movieQueries.isLoading])

  // MODIFIED: Split the single rental list into active and past rentals using JS
  const activeRentals = useMemo(() => {
    const nowInSeconds = Math.floor(Date.now() / 1000);
    return allRentals.filter(rental => rental.expiryTimestamp > nowInSeconds);
  }, [allRentals]);

  const pastRentals = useMemo(() => {
    const nowInSeconds = Math.floor(Date.now() / 1000);
    return allRentals.filter(rental => rental.expiryTimestamp <= nowInSeconds);
  }, [allRentals]);

  // REMOVED: Old useEffects for separate rental lists and allMovies

  const getRemainingTime = (expiryTimestamp) => {
    const expiryDate = new Date(Number(expiryTimestamp) * 1000);
    const now = new Date();

    if (now > expiryDate) {
      return { text: 'Expired', active: false };
    }

    return { text: `${formatDistanceToNowStrict(expiryDate)} left`, active: true };
  }

  const containerVariants = { /* ... no changes here ... */ }
  const itemVariants = { /* ... no changes here ... */ }

  if (!isMounted) { /* ... no changes here ... */ }
  if (!isConnected) { /* ... no changes here ... */ }

  return (
    <ProfileGate>
      <div className="relative min-h-screen bg-gray-900 text-white py-12 pt-24 md:py-16 md:pt-28 overflow-hidden">
      <BackgroundAnimation />
      <motion.div
        className="relative max-w-7xl mx-auto px-4 z-[1]"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.div className="text-center mb-10" variants={itemVariants}>
          <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-teal-400 to-cyan-500 bg-clip-text text-transparent">My Rentals</h1>
          <p className="text-gray-400 text-lg">Manage your active rentals and review your watch history.</p>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Tabs defaultValue="active" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-gray-800 border-gray-700">
              <TabsTrigger value="active">Active Rentals</TabsTrigger>
              <TabsTrigger value="history">Full History</TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="mt-6">
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader><CardTitle>Currently Rented</CardTitle></CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="text-center py-16"><Loader2 className="h-8 w-8 animate-spin mx-auto" /></div>
                  ) : activeRentals.length === 0 ? (
                    <div className="text-center py-16">
                      <Play className="h-16 w-16 mx-auto text-gray-600 mb-4" />
                      <h4 className="text-lg font-semibold mb-2">No Active Rentals</h4>
                      <p className="text-gray-400 mb-4">Rent a movie to watch it here.</p>
                      <Link href="/explore"><Button className="bg-teal-500 hover:bg-teal-600 font-bold">Explore Movies</Button></Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {activeRentals.map((rental) => {
                        const movie = moviesMap[Number(rental.movieId)]
                        if (!movie) return null
                        const timeLeft = getRemainingTime(rental.expiryTimestamp)
                        return (
                          <motion.div key={rental.rentalId} variants={itemVariants} whileHover={{ y: -5 }}>
                            <Card className="bg-gray-800 border-gray-700 hover:border-teal-500 transition-colors duration-300 overflow-hidden group h-full flex flex-col">
                              <CardHeader className="p-0">
                                {/* ... image is the same ... */}
                              </CardHeader>
                              <CardContent className="p-4 flex flex-col flex-grow">
                                <h4 className="font-semibold text-lg truncate mb-2">{movie.title}</h4>
                                <div className="flex items-center gap-2 text-sm bg-teal-500/10 text-teal-300 px-3 py-1 rounded-full w-fit">
                                  <Clock className="h-4 w-4" />
                                  <span>{timeLeft.text}</span>
                                </div>
                                <div className="mt-auto pt-4">
                                  <Link href={`/movie/${movie.id}`}>
                                    <Button className="w-full bg-teal-500 hover:bg-teal-600 font-bold"><Play className="mr-2 h-4 w-4" /> Watch Now</Button>
                                  </Link>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="mt-6">
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader><CardTitle>All Rented Movies</CardTitle></CardHeader>
                <CardContent>
                   {isLoading ? (
                     <div className="text-center py-16"><Loader2 className="h-8 w-8 animate-spin mx-auto" /></div>
                  ) : allRentals.length === 0 ? ( // MODIFIED: Check allRentals
                    <div className="text-center py-16">
                      <History className="h-16 w-16 mx-auto text-gray-600 mb-4" />
                      <h4 className="text-lg font-semibold mb-2">No Watch History</h4>
                      <p className="text-gray-400">Your past rentals will appear here.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* MODIFIED: Loop over `allRentals` instead of `watchHistory` */}
                      {allRentals.map((rental) => {
                        const movie = moviesMap[Number(rental.movieId)]
                        if (!movie) return null
                        const timeLeft = getRemainingTime(rental.expiryTimestamp) // MODIFIED: Logic updated
                        return (
                          <motion.div key={rental.rentalId} variants={itemVariants}>
                            <Card className="bg-gray-800 border-gray-700 p-4 transition-colors hover:border-gray-600">
                              <div className="flex flex-col sm:flex-row items-center gap-4">
                                {/* ... image is the same ... */}
                                <div className="flex-1 text-center sm:text-left">
                                  <h4 className="text-white font-semibold text-lg">{movie.title}</h4>
                                  <div className="flex items-center justify-center sm:justify-start gap-2 mt-1">
                                    <Badge variant="secondary" className="bg-cyan-500/20 text-cyan-300">{movie.genre}</Badge>
                                    <Badge variant="secondary" className={timeLeft.active ? "bg-teal-500/20 text-teal-300" : "bg-gray-700 text-gray-400"}>
                                      {timeLeft.active ? "Active" : "Expired"}
                                    </Badge>
                                  </div>
                                </div>
                                <div className="flex-shrink-0 text-center sm:text-left">
                                    {/* MODIFIED: Format date using date-fns and remove old duration */}
                                    <p className="text-sm text-gray-400 flex items-center gap-2"><Calendar className="h-4 w-4" /> Rented: {format(new Date(Number(rental.rentedAt) * 1000), 'PP')}</p>
                                    <p className="text-sm text-gray-400 flex items-center gap-2"><Clock className="h-4 w-4" /> Expired: {format(new Date(Number(rental.expiryTimestamp) * 1000), 'PP')}</p>
                                </div>
                                <div className="flex-shrink-0">
                                  <Link href={`/movie/${movie.id}`}>
                                    <Button className={timeLeft.active ? "bg-teal-500 hover:bg-teal-600 font-bold" : "bg-cyan-500 hover:bg-cyan-600 font-bold"}>
                                      {timeLeft.active ? "Watch Now" : "View Details"}
                                    </Button>
                                  </Link>
                                </div>
                              </div>
                            </Card>
                          </motion.div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </motion.div>
    </div>
    </ProfileGate>
    )
}