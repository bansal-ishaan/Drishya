'use client'

import { useState, useEffect, useCallback } from 'react'
// MODIFIED: wagmi/actions is needed for imperative calls like "load more"
import { useConfig } from 'wagmi' 
import { readContract } from 'wagmi/actions' 
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BackgroundAnimation } from "@/components/BackgroundAnimation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
// MODIFIED: Added Loader2 for the "Load More" button
import { Search, X, Play, Star, Film, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/lib/contract'
import { ProfileGate } from '@/components/ProfileGate'

// This component can be used for a more visually appealing loading state
const Loader = () => (
    <div className="flex flex-col items-center justify-center gap-4 text-center">
        <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            style={{
                width: 50,
                height: 50,
                border: '4px solid #9ca3af',
                borderTopColor: '#14b8a6',
                borderRadius: '50%',
            }}
        />
        <p className="text-xl font-semibold text-gray-300">Loading Movies...</p>
    </div>
);

// ADDED: Define how many movies to load per batch
const PAGE_SIZE = 8; 

export default function ExplorePage() {
    // MODIFIED: Renamed to allMovies to distinguish from the filtered list
    const [allMovies, setAllMovies] = useState([]) 
    const [filteredMovies, setFilteredMovies] = useState([])
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedGenre, setSelectedGenre] = useState('all')
    const [sortBy, setSortBy] = useState('newest')

    // ADDED: State for pagination
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [nextCursor, setNextCursor] = useState(0);
    const [hasMore, setHasMore] = useState(true);

    // ADDED: Get the wagmi config for making contract calls
    const wagmiConfig = useConfig();

    // ADDED: New function to fetch movies using pagination
    const fetchMovies = useCallback(async (cursor) => {
        if (!hasMore && cursor > 0) return;
        
        cursor === 0 ? setIsLoading(true) : setIsLoadingMore(true);

        try {
            const data = await readContract(wagmiConfig, {
                address: CONTRACT_ADDRESS,
                abi: CONTRACT_ABI,
                functionName: 'getPaginatedMovies',
                args: [BigInt(cursor), BigInt(PAGE_SIZE)],
            });
            
            const [moviesResult, newNextCursor] = data;

            // Filter out any potential empty or invalid movie objects
            const validMovies = moviesResult.filter(movie => movie.id > 0);

            setAllMovies(prev => cursor === 0 ? validMovies : [...prev, ...validMovies]);
            setNextCursor(Number(newNextCursor));

            if (validMovies.length < PAGE_SIZE) {
                setHasMore(false);
            }

        } catch (error) {
            console.error("Failed to fetch movies:", error);
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
        }
    }, [wagmiConfig, hasMore]);


    // REMOVED: The old useReadContract for getAllMovies()
    /*
    const { data: allMoviesData, isLoading } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'getAllMovies',
    })
    */

    // ADDED: useEffect to trigger the initial movie fetch
    useEffect(() => {
        fetchMovies(0);
        // We only want this to run once on mount
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);


    // MODIFIED: This useEffect now depends on `allMovies` state instead of a hook result
    useEffect(() => {
        let filtered = [...allMovies]

        if (searchTerm) {
            filtered = filtered.filter(movie =>
                movie.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                movie.description.toLowerCase().includes(searchTerm.toLowerCase())
            )
        }

        if (selectedGenre !== 'all') {
            filtered = filtered.filter(movie => movie.genre === selectedGenre)
        }

        switch (sortBy) {
            case 'newest':
                filtered.sort((a, b) => Number(b.id) - Number(a.id))
                break
            case 'popular':
                filtered.sort((a, b) => Number(b.rentalCount) - Number(a.rentalCount))
                break
            // MODIFIED: price48h is now pricePerDay
            case 'price-low':
                filtered.sort((a, b) => Number(a.pricePerDay) - Number(b.pricePerDay))
                break
            case 'price-high':
                filtered.sort((a, b) => Number(b.pricePerDay) - Number(a.pricePerDay))
                break
        }

        setFilteredMovies(filtered)
    }, [allMovies, searchTerm, selectedGenre, sortBy])

    const formatPrice = (price) => {
        return (Number(price) / 1e18).toFixed(4)
    }

    const genres = [...new Set(allMovies.map(movie => movie.genre))].filter(Boolean)

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.08 },
        },
    }

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 },
    }
    
    // ADDED: Handler for the "Load More" button
    const handleLoadMore = () => {
        if (!isLoadingMore) {
            fetchMovies(nextCursor);
        }
    };


    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center relative">
                <BackgroundAnimation />
                <Loader />
            </div>
        )
    }

    return (
        <ProfileGate>
            <div className="relative min-h-screen bg-gray-900 text-white py-12 pt-24 md:py-16 md:pt-28">
            <BackgroundAnimation />

            <motion.div
                className="max-w-7xl mx-auto px-4 relative z-10"
                initial="hidden"
                animate="visible"
                variants={containerVariants}
            >
                 {/* ... No changes to H1, P tag, or the filter section ... */}
                 <motion.h1
                    className="text-5xl font-bold mb-4 bg-gradient-to-r from-teal-400 to-cyan-500 bg-clip-text text-transparent"
                    variants={itemVariants}
                >
                    Explore Movies
                </motion.h1>
                <motion.p className="text-gray-400 text-lg mb-10" variants={itemVariants}>
                    Find your next favorite film. Search, filter, and sort through our entire collection.
                </motion.p>
                <motion.div className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 md:p-6 mb-10 border border-gray-700" variants={itemVariants}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                        <div className="relative">
                            <label className="text-sm font-semibold text-gray-300 mb-2 block">Search</label>
                            <Search className="absolute left-3 bottom-2.5 h-5 w-5 text-gray-500" />
                            <Input
                                placeholder="Movie title or description..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 focus:ring-teal-500 focus:border-teal-500 h-10"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-gray-300 mb-2 block">Genre</label>
                            <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                                <SelectTrigger className="bg-gray-900 border-gray-700 text-white h-10 focus:ring-teal-500">
                                    <SelectValue placeholder="All Genres" />
                                </SelectTrigger>
                                <SelectContent className="bg-gray-800 border-gray-700 text-white">
                                    <SelectItem value="all">All Genres</SelectItem>
                                    {genres.map(genre => (
                                        <SelectItem key={genre} value={genre}>{genre}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-gray-300 mb-2 block">Sort By</label>
                            <Select value={sortBy} onValueChange={setSortBy}>
                                <SelectTrigger className="bg-gray-900 border-gray-700 text-white h-10 focus:ring-teal-500">
                                    <SelectValue placeholder="Sort by" />
                                </SelectTrigger>
                                <SelectContent className="bg-gray-800 border-gray-700 text-white">
                                    <SelectItem value="newest">Newest</SelectItem>
                                    <SelectItem value="popular">Most Popular</SelectItem>
                                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Button
                            onClick={() => {
                                setSearchTerm('')
                                setSelectedGenre('all')
                                setSortBy('newest')
                            }}
                            variant="outline"
                            className="border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-white font-bold h-10"
                        >
                            <X className="mr-2 h-4 w-4" />
                            Clear Filters
                        </Button>
                    </div>
                </motion.div>


                {/* Movies Grid */}
                {filteredMovies.length === 0 ? (
                    <motion.div className="text-center py-16" variants={itemVariants}>
                        <Film className="h-16 w-16 mx-auto text-gray-600 mb-4" />
                        <p className="text-gray-400 text-2xl font-semibold">No movies found.</p>
                        <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
                    </motion.div>
                ) : (
                    <>
                        <motion.div
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                        >
                            {filteredMovies.map((movie) => (
                                <motion.div key={movie.id} variants={itemVariants} whileHover={{ y: -8 }}>
                                    <Card className="bg-gray-800 border-gray-700 hover:border-teal-500 transition-colors duration-300 overflow-hidden group h-full flex flex-col">
                                        <CardHeader className="p-0">
                                            <div className="aspect-video overflow-hidden">
                                                <motion.img
                                                    src={movie.thumbnailCID ? `https://gateway.pinata.cloud/ipfs/${movie.thumbnailCID}` : `/placeholder.svg`}
                                                    alt={movie.title}
                                                    className="w-full h-full object-cover"
                                                    whileHover={{ scale: 1.1 }}
                                                    transition={{ duration: 0.4 }}
                                                />
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-4 flex flex-col flex-grow">
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="font-semibold text-lg truncate pr-2">{movie.title}</h3>
                                                <Badge variant="secondary" className="bg-cyan-500 text-white text-xs shrink-0">
                                                    {movie.genre}
                                                </Badge>
                                            </div>
                                            <p className="text-gray-400 text-sm mb-3 line-clamp-2 flex-grow">{movie.description}</p>
                                            <div className="flex justify-between items-center text-sm mb-4">
                                                <div className="flex items-center gap-1.5 text-yellow-400">
                                                    <Star className="h-4 w-4 fill-current" />
                                                    <span>{Number(movie.rentalCount)} rentals</span>
                                                </div>
                                                <div className="font-semibold text-teal-400">
                                                    {/* MODIFIED: price48h -> pricePerDay and CAMP -> Eth */}
                                                    {formatPrice(movie.pricePerDay)} Eth/day
                                                </div>
                                            </div>
                                            <Link href={`/movie/${movie.id}`} className="mt-auto">
                                                <Button className="w-full bg-teal-500 hover:bg-teal-600 font-bold">
                                                    <Play className="mr-2 h-4 w-4" />
                                                    View Details
                                                </Button>
                                            </Link>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </motion.div>

                        {/* ADDED: Load More Button */}
                        <motion.div className="flex justify-center mt-12" variants={itemVariants}>
                            {hasMore && (
                                <Button onClick={handleLoadMore} disabled={isLoadingMore} className="bg-cyan-500 hover:bg-cyan-600 font-bold px-8 py-6 text-base">
                                    {isLoadingMore ? (
                                        <>
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                            Loading...
                                        </>
                                    ) : (
                                        'Load More'
                                    )}
                                </Button>
                            )}
                            {!hasMore && allMovies.length > 0 && (
                                <p className="text-gray-500">You've reached the end of the list.</p>
                            )}
                        </motion.div>
                    </>
                )}
            </motion.div>
        </div>
        </ProfileGate>
    )
}