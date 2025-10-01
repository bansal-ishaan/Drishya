'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAccount } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Menu, Clapperboard, Compass, User, History, Upload, Image as ImageIcon } from 'lucide-react'


export function Navbar() {
  const { isConnected } = useAccount()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  const productionPaths = ['/profile', '/upload']
  const isProductionHousePortal = productionPaths.some(path => pathname.startsWith(path));

  const userNavItems = [
    { href: '/explore', label: 'Explore Movies', icon: Compass },
    { href: '/memes', label: 'Meme Gallery', icon: ImageIcon },
    ...(isConnected ? [
        { href: '/history', label: 'My Rentals', icon: History },
        { href: '/viewerprofile', label: 'My Profile', icon: User }
    ] : [])
  ];

  const productionNavItems = [
    { href: '/profile', label: 'My Profile', icon: User },
    ...(isConnected ? [{ href: '/upload', label: 'Upload Movie', icon: Upload }] : [])
  ];

  const navItemsToDisplay = isProductionHousePortal ? productionNavItems : userNavItems;

  return (
    <nav className="bg-gray-900/80 backdrop-blur-md border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <Link href="/" className="flex items-center space-x-2 group shrink-0">
            <Clapperboard className="h-8 w-8 text-teal-400 transition-transform duration-300 ease-in-out group-hover:rotate-[-12deg]" />
            <span className="text-xl font-extrabold tracking-tight hidden sm:inline bg-gradient-to-r from-teal-300 to-cyan-400 bg-clip-text text-transparent">Drishya</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <div className="flex items-center gap-6">
                {navItemsToDisplay.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                return (
                    <Link key={item.href} href={item.href} className={`flex items-center space-x-1.5 transition-colors hover:text-white ${isActive ? 'text-white font-semibold' : 'text-gray-400'}`}>
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                    </Link>
                )
                })}
            </div>

            <div className="pl-2">
              <ConnectButton />
            </div>
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white"><Menu className="h-6 w-6" /></Button>
              </SheetTrigger>
              <SheetContent side="right" className="bg-black/95 backdrop-blur-md border-l border-gray-800 text-white">
                <div className="flex flex-col space-y-4 mt-8">
                  {navItemsToDisplay.map((item) => {
                     const Icon = item.icon
                     const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                     return (
                      <Link key={item.href} href={item.href} className={`flex items-center space-x-3 p-3 rounded-lg text-lg transition-colors ${isActive ? 'bg-teal-500/20 text-teal-300' : 'text-gray-300 hover:bg-gray-800'}`} onClick={() => setIsOpen(false)}>
                       <Icon className="h-5 w-5" />
                       <span>{item.label}</span>
                      </Link>
                     )
                  })}
                  <div className="pt-4 border-t border-gray-800"><ConnectButton /></div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  )
}