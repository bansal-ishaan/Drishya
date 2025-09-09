'use client'

import { useState, useEffect, useCallback } from 'react'
import { useConfig } from 'wagmi' 
import { readContract, readContracts } from 'wagmi/actions' 
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BackgroundAnimation } from "@/components/BackgroundAnimation"
import { Image as ImageIcon, Sparkles, Loader2, PartyPopper } from 'lucide-react'
import Link from 'next/link'
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/lib/contract'
import { ProfileGate } from '@/components/ProfileGate'
// Loader for initial page load
const PageLoader = () => (
    <div className="flex flex-col items-center justify-center gap-4 text-center">
        <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 border-4 border-gray-500 border-t-violet-400 rounded-full"
        />
        <p className="text-xl font-semibold text-gray-300">Loading Memes...</p>
    </div>
);

export default function MemesPage() {
    const [allMemes, setAllMemes] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const wagmiConfig = useConfig();
    const [totalMemeCount, setTotalMemeCount] = useState(0);

    // Fetch the total number of memes first
    useEffect(() => {
        const fetchMemeCount = async () => {
            try {
                const count = await readContract(wagmiConfig, {
                    address: CONTRACT_ADDRESS,
                    abi: CONTRACT_ABI,
                    functionName: 'memeCount',
                });
                setTotalMemeCount(Number(count));
            } catch (error) {
                console.error("Failed to fetch meme count:", error);
            }
        };
        fetchMemeCount();
    }, [wagmiConfig]);


    // Fetch all memes in a single batch call once we have the count
    useEffect(() => {
        if (totalMemeCount === 0) {
            setIsLoading(false);
            return;
        }

        const fetchAllMemes = async () => {
            setIsLoading(true);
            try {
                // Create an array of contract calls, from ID 1 to totalMemeCount
                const memeContracts = Array.from({ length: totalMemeCount }, (_, i) => ({
                    address: CONTRACT_ADDRESS,
                    abi: CONTRACT_ABI,
                    functionName: 'memes',
                    args: [BigInt(i + 1)],
                }));

                const results = await readContracts(wagmiConfig, {
                    contracts: memeContracts,
                });
                
                // The result is an array of objects, get the `result` from each
                const memesData = results.map(res => res.result).filter(Boolean);

                // Sort by newest first (highest ID)
                const sortedMemes = memesData.sort((a, b) => Number(b.id) - Number(a.id));
                setAllMemes(sortedMemes);
                
            } catch (error) {
                console.error("Failed to fetch memes:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAllMemes();
    }, [totalMemeCount, wagmiConfig]);
    

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.05 },
        },
    }

    const itemVariants = {
        hidden: { y: 20, opacity: 0, scale: 0.95 },
        visible: { y: 0, opacity: 1, scale: 1 },
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center relative">
                <BackgroundAnimation />
                <PageLoader />
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
                <motion.div 
                    className="flex flex-col md:flex-row justify-between items-center gap-6 mb-10"
                    variants={itemVariants}
                >
                    <div>
                        <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-violet-400 to-pink-500 bg-clip-text text-transparent">
                            The Meme Gallery
                        </h1>
                        <p className="text-gray-400 text-lg">Browse the community's creations. The winner gets a 20% rental discount!</p>
                    </div>
                     <Link href="/mint-meme">
                      <Button size="lg" className="bg-violet-500 hover:bg-violet-600 font-bold text-lg shrink-0">
                        <PartyPopper className="mr-2 h-5 w-5" /> Mint Your Own Meme
                      </Button>
                    </Link>
                </motion.div>
                

                {allMemes.length === 0 ? (
                    <motion.div className="text-center py-16" variants={itemVariants}>
                        <ImageIcon className="h-16 w-16 mx-auto text-gray-600 mb-4" />
                        <p className="text-gray-400 text-2xl font-semibold">The gallery is empty!</p>
                        <p className="text-gray-500">Be the first to mint a meme and enter the spotlight.</p>
                    </motion.div>
                ) : (
                    <motion.div
                        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        {allMemes.map((meme) => (
                            <motion.div key={meme.id} variants={itemVariants}>
                                <Card className="bg-gray-800 border-gray-700 hover:border-violet-500 transition-colors duration-300 overflow-hidden group relative aspect-square">
                                    {meme.isSpotlighted && (
                                        <Badge className="absolute top-2 right-2 z-10 bg-yellow-400 text-black font-bold shadow-lg">
                                            <Sparkles className="h-4 w-4 mr-1.5 animate-pulse"/>
                                            Spotlight!
                                        </Badge>
                                    )}
                                    <img
                                        src={`https://gateway.pinata.cloud/ipfs/${meme.imageCID}`}
                                        alt={meme.title}
                                        className="w-full h-full object-cover transition-transform duration-400 group-hover:scale-110"
                                        loading="lazy"
                                    />
                                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3">
                                        <p className="text-white font-bold text-base truncate transition-all group-hover:text-violet-300">{meme.title}</p>
                                        <p className="text-gray-400 text-xs font-mono truncate">{meme.creator}</p>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </motion.div>
        </div>
        </ProfileGate>
    )
}