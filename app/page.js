'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Clapperboard, Film, Users } from 'lucide-react'
import { BackgroundAnimation } from '@/components/BackgroundAnimation' 

export default function PortalChoicePage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-8 text-white overflow-hidden bg-[#0d1117]">
      
      {/* Existing background animation */}
      <BackgroundAnimation />

      {/* Film grain overlay */}
      <div
        className="absolute inset-0 z-10 opacity-10 mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage: `url("https://www.transparenttextures.com/patterns/noise.png")`,
        }}
      />

      {/* Spotlight beams */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[150%] h-[150%] bg-gradient-to-b from-cyan-400/10 via-transparent to-transparent blur-3xl opacity-50 rotate-12 z-0" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[150%] h-[150%] bg-gradient-to-b from-teal-400/10 via-transparent to-transparent blur-3xl opacity-50 -rotate-12 z-0" />

      {/* Floating film reels */}
      {[...Array(4)].map((_, i) => (
        <motion.div
          key={`reel-${i}`}
          className="absolute opacity-20 text-cyan-300 z-0"
          style={{
            top: `${15 * i + 5}%`,
            left: i % 2 === 0 ? '5%' : '85%',
          }}
          animate={{
            y: ['0%', '15%', '0%'],
            rotate: [0, 360],
          }}
          transition={{
            duration: 40 + i * 5,
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          <Film size={80} />
        </motion.div>
      ))}

      <motion.div
        className="text-center w-full max-w-4xl z-20 relative"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.div variants={itemVariants} className="mb-12 relative">
          {/* Glow behind title */}
          <div className="absolute inset-0 blur-3xl rounded-full opacity-30 bg-gradient-to-r from-cyan-400/30 via-teal-400/30 to-transparent scale-150 -z-10" />

          <Clapperboard className="h-14 w-14 mx-auto text-cyan-300 drop-shadow-[0_0_15px_rgba(0,255,255,0.6)]" />
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter uppercase mt-6 bg-gradient-to-r from-white via-cyan-200 to-gray-400 bg-clip-text text-transparent drop-shadow-[0_0_25px_rgba(0,255,255,0.5)]">
            CINEVAULT
          </h1>
          <p className="text-lg text-gray-400 max-w-xl mx-auto mt-4 italic tracking-wide">
            🎬 The future of film is here — choose your portal and step into the reel world.
          </p>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 md:grid-cols-2 gap-8"
        >
          <Link href="/profile" passHref className="group">
            <div className="bg-[#161b22]/80 backdrop-blur-sm border border-[#30363d] rounded-2xl p-8 h-full transition-all duration-300 group-hover:border-teal-400 group-hover:bg-[#1f2630] shadow-lg shadow-cyan-900/20 relative overflow-hidden">
              {/* Top glowing line */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-teal-400 to-transparent opacity-40 animate-pulse" />
              <Film className="h-16 w-16 text-teal-400 mb-6 transition-transform duration-300 group-hover:scale-110 drop-shadow-[0_0_10px_rgba(0,255,255,0.4)]" />
              <h2 className="text-3xl font-bold mb-2">Creator Portal</h2>
              <p className="text-gray-400 text-base">
                Upload movies, track rentals, and manage your profile.
              </p>
            </div>
          </Link>

          <Link href="/explore" passHref className="group">
            <div className="bg-[#161b22]/80 backdrop-blur-sm border border-[#30363d] rounded-2xl p-8 h-full transition-all duration-300 group-hover:border-cyan-400 group-hover:bg-[#1f2630] shadow-lg shadow-cyan-900/20 relative overflow-hidden">
              {/* Top glowing line */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-40 animate-pulse" />
              <Users className="h-16 w-16 text-cyan-400 mb-6 transition-transform duration-300 group-hover:scale-110 drop-shadow-[0_0_10px_rgba(0,255,255,0.4)]" />
              <h2 className="text-3xl font-bold mb-2">Viewer Portal</h2>
              <p className="text-gray-400 text-base">
                Explore films, rent your favorites, and view your history.
              </p>
            </div>
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
