"use client"

import { useState, useEffect } from "react"
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi"
import { motion } from "framer-motion"
import { BackgroundAnimation } from "@/components/BackgroundAnimation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Image as ImageIcon, DollarSign, CheckCircle, AlertCircle, Loader2, PartyPopper, Wallet } from "lucide-react"
import { CONTRACT_ADDRESS, CONTRACT_ABI, handleContractError } from "@/lib/contract"
import { uploadToPinata, validateFile } from "@/lib/pinata" // MODIFIED: Imported upload and validate from your existing lib
import { useToast } from "@/hooks/use-toast"
import Link from 'next/link'
import { ProfileGate } from '@/components/ProfileGate'
export default function MintMemePage() {
  const { address, isConnected } = useAccount()
  const { toast } = useToast()
  
  const [status, setStatus] = useState("idle") // idle, uploading, submitting, success
  const [formData, setFormData] = useState({ title: "" })
  const [file, setFile] = useState(null)
  const [uploadedCid, setUploadedCid] = useState("")

  // Fetch the required fee for minting a meme from the contract
  const { data: memeFee } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "memeFee",
  })

  // Check if the user has a profile
  const { data: userProfile } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "userProfiles",
    args: [address],
    enabled: !!address,
  })

  const { writeContract, data: hash, isPending, error: contractError } = useWriteContract()
  const { isLoading: isConfirming, isSuccess, error: txError } = useWaitForTransactionReceipt({ hash })

  const isProcessing = status === "uploading" || status === "submitting" || isPending || isConfirming

  useEffect(() => {
    if (contractError || txError) {
      const errorMessage = handleContractError(contractError || txError)
      toast({ title: "Transaction Failed", description: errorMessage, variant: "destructive" })
      setStatus("error")
    }
  }, [contractError, txError, toast])

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return;
    try {
      validateFile(selectedFile, 10, ["image/jpeg", "image/png", "image/gif", "image/webp"]) // 10MB limit for memes
      setFile(selectedFile)
    } catch (error) {
      toast({ title: "File Error", description: error.message, variant: "destructive" })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isConnected || (userProfile && !userProfile[1]) || !file || !formData.title.trim()) {
      toast({ title: "Validation Error", description: "Please connect wallet, create a profile, add a file, and enter a title.", variant: "destructive" })
      return
    }

    try {
      // 1. Upload to IPFS
      setStatus("uploading")
      toast({ title: "Uploading to IPFS...", description: "Your meme is being pinned. Please wait." })
      const cid = await uploadToPinata(file)
      setUploadedCid(cid)
      toast({ title: "Upload Complete!", description: `Image successfully pinned with CID: ${cid.substring(0, 10)}...` })

      // 2. Submit to Blockchain
      setStatus("submitting")
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "mintMeme",
        args: [formData.title, cid],
        value: memeFee,
      })
    } catch (error) {
      const errorMessage = handleContractError(error)
      toast({ title: "Minting Failed", description: errorMessage, variant: "destructive" })
      setStatus("error")
    }
  }
  
  const formattedMemeFee = memeFee ? (Number(memeFee) / 1e18).toFixed(5) : "..."

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <BackgroundAnimation />
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
          <Card className="bg-gray-800 border-gray-700 max-w-lg text-center shadow-2xl shadow-violet-500/10">
            <CardHeader>
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring' }}>
                <PartyPopper className="h-20 w-20 text-violet-400 mx-auto" />
              </motion.div>
              <CardTitle className="text-3xl font-bold text-white mt-4">Meme Minted!</CardTitle>
              <CardDescription className="text-gray-400">Your meme is now on-chain and eligible for the daily spotlight.</CardDescription>
            </CardHeader>
            <CardContent>
              {uploadedCid && (
                  <img src={`https://gateway.pinata.cloud/ipfs/${uploadedCid}`} alt={formData.title} className="w-full max-w-xs mx-auto rounded-lg object-cover" />
              )}
            </CardContent>
            <CardFooter className="flex-col gap-2">
              <Link href="/memes" className="w-full">
                <Button variant="outline" className="w-full border-violet-400 text-violet-400 hover:bg-violet-400 hover:text-white font-bold">
                  View Meme Gallery
                </Button>
              </Link>
               <Button onClick={() => window.location.reload()} className="w-full bg-teal-500 hover:bg-teal-600 font-bold">Mint Another Meme</Button>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    )
  }

  return (
    <ProfileGate>
         <div className="min-h-screen bg-gray-900 text-white py-12 pt-24 md:py-16 md:pt-28">
      <BackgroundAnimation />
      <motion.div 
        className="max-w-2xl mx-auto px-4"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-violet-400 to-pink-500 bg-clip-text text-transparent">Mint a Meme</h1>
          <p className="text-gray-400 text-lg">Immortalize your meme on-chain and enter the daily spotlight lottery!</p>
        </div>

        {!isConnected ? (
          <Alert variant="destructive" className="mb-6 bg-yellow-900/50 border-yellow-700 text-yellow-300">
             <Wallet className="h-4 w-4" />
             <AlertTitle>Wallet Not Connected</AlertTitle>
             <AlertDescription>Please connect your wallet to mint a meme.</AlertDescription>
           </Alert>
        ) : userProfile && !userProfile[1] && (
          <Alert variant="destructive" className="mb-6 bg-yellow-900/50 border-yellow-700 text-yellow-300">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Profile Required</AlertTitle>
            <AlertDescription>You need to create a profile before minting. <Link href="/profile" className="font-bold underline hover:text-yellow-200">Create Profile Now</Link></AlertDescription>
          </Alert>
        )}

        <Card className="bg-gray-800/80 backdrop-blur-sm border-gray-700 shadow-lg">
          <form onSubmit={handleSubmit}>
            <CardContent className="p-6 md:p-8 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Meme Title <span className="text-red-500">*</span></Label>
                  <Input 
                    id="title" 
                    value={formData.title} 
                    onChange={(e) => setFormData({ title: e.target.value })} 
                    required 
                    disabled={isProcessing} 
                    placeholder="e.g., Diamond Hands To The Moon" 
                  />
                </div>
              
                <div className="space-y-2">
                   <Label htmlFor="file">Image File <span className="text-red-500">*</span></Label>
                   <Input 
                    id="file"
                    type="file" 
                    accept="image/*" 
                    onChange={handleFileChange}
                    required
                    disabled={isProcessing}
                  />
                  {file && (
                     <p className="text-sm text-gray-400 pt-1">Selected: <span className="font-semibold text-cyan-400">{file.name}</span></p>
                  )}
                </div>

                <Alert className="bg-gray-900/70 border-gray-700">
                  <DollarSign className="h-4 w-4 text-violet-400" />
                  <AlertTitle className="text-white">Minting Fee</AlertTitle>
                  <AlertDescription className="text-gray-400 mt-1">
                    A one-time fee of <strong className="text-violet-300">{formattedMemeFee} STT</strong> is required to mint your meme NFT.
                  </AlertDescription>
                </Alert>
            </CardContent>
            <CardFooter className="bg-gray-800 p-6">
              <Button type="submit" disabled={!isConnected || isProcessing || (userProfile && !userProfile[1]) || !file} className="w-full bg-violet-500 hover:bg-violet-600 font-bold text-lg py-6 disabled:bg-gray-600 disabled:cursor-not-allowed">
                {
                  !isConnected ? "Connect Wallet to Mint" :
                  userProfile && !userProfile[1] ? "Please Create a Profile First" :
                  isProcessing ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> <span>{status === 'submitting' ? "Confirming..." : "Uploading..."}</span></> :
                  "Mint Meme NFT"
                }
              </Button>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
    </ProfileGate>

  )
}