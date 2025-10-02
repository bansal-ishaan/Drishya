"use client"

import { useState, useEffect, useMemo } from "react"
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi"
import { motion } from "framer-motion"
import { parseEther } from "viem"
import { BackgroundAnimation } from "@/components/BackgroundAnimation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { UploadCloud, Video, ImageIcon, AlertCircle, Loader2, PartyPopper } from "lucide-react"
import { CONTRACT_ADDRESS, CONTRACT_ABI, handleContractError } from "@/lib/contract"
import { uploadToPinata, validateFile } from "@/lib/pinata"
import { useToast } from "@/hooks/use-toast"
import Link from 'next/link'
import { ProfileGate } from "@/components/ProfileGate"

export default function UploadPage() {
  const { address, isConnected } = useAccount()
  const { toast } = useToast()
  
  const [status, setStatus] = useState("idle") // "idle", "uploading", "submitting", "success", "error"
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    genre: "",
    pricePerDay: "", // MODIFIED: price48h -> pricePerDay
  })
  const [files, setFiles] = useState({
    film: null,
    trailer: null,
    thumbnail: null,
  })
  const [uploadedCids, setUploadedCids] = useState({ film: "", trailer: "", thumbnail: ""})

  // MODIFIED: Fetches uploadFee directly from the public variable, not a function
  const { data: uploadFee } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "uploadFee",
  })
  
  // MODIFIED: Fetches from the new userProfiles mapping
  const { data: userProfile } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "userProfiles",
    args: [address],
    enabled: !!address,
  })

  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess, error: txError } = useWaitForTransactionReceipt({ hash })

  const isProcessing = status === 'uploading' || status === 'submitting' || isPending || isConfirming

  const genres = ["Action", "Comedy", "Drama", "Horror", "Romance", "Sci-Fi", "Thriller", "Documentary", "Animation", "Adventure", "Fantasy", "Mystery"]

  useEffect(() => {
    if (isSuccess) setStatus('success');
    if (txError) {
      toast({ title: "Transaction Failed", description: handleContractError(txError), variant: "destructive" })
      setStatus("error") // Allow user to try submitting again
    }
  }, [isSuccess, txError, toast])

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (type, file) => {
    if (!file) return
    try {
      const config = {
        film: { maxSize: 1024, types: ["video/mp4", "video/mov", "video/quicktime"] },
        trailer: { maxSize: 500, types: ["video/mp4", "video/mov", "video/quicktime"] },
        thumbnail: { maxSize: 10, types: ["image/jpeg", "image/png", "image/webp"] },
      }
      validateFile(file, config[type].maxSize, config[type].types)
      setFiles((prev) => ({ ...prev, [type]: file }))
    } catch (error) {
      toast({ title: "File Error", description: error.message, variant: "destructive" })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    // MODIFIED: Updated validation checks
    if (!userProfile?.[1] || !files.film || !formData.title.trim() || !formData.pricePerDay || parseFloat(formData.pricePerDay) <= 0) {
      toast({ title: "Validation Error", description: "Please create a profile and fill all required fields: Title, Movie File, and Price.", variant: "destructive" })
      return;
    }
    
    setStatus("uploading");
    try {
      toast({ title: "Uploading files...", description: "Pinning files to IPFS. This might take a while for large movies." });
      
      const filmCID = files.film ? await uploadToPinata(files.film) : "";
      const trailerCID = files.trailer ? await uploadToPinata(files.trailer) : "";
      const thumbnailCID = files.thumbnail ? await uploadToPinata(files.thumbnail) : "";
      
      setUploadedCids({ film: filmCID, trailer: trailerCID, thumbnail: thumbnailCID });

      setStatus("submitting");
      toast({ title: "Submitting to Blockchain", description: "Please confirm the transaction in your wallet." });
      
      // MODIFIED: Arguments list and order now perfectly match the new smart contract
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "uploadMovie",
        args: [
          formData.title,
          formData.genre || "",
          formData.description || "",
          filmCID,
          trailerCID,
          thumbnailCID,
          parseEther(formData.pricePerDay),
        ],
        value: uploadFee,
      });
    } catch (error) {
        toast({ title: "Operation Failed", description: handleContractError(error), variant: "destructive" })
        setStatus("error") 
    }
  };
  
  // MODIFIED: Use new currency and fetch the correct fee (0.0001 STT)
  const uploadFeeSTT = useMemo(() => (uploadFee ? (Number(uploadFee) / 1e18).toFixed(4) : "0.0001"), [uploadFee]);
  const userHasProfile = userProfile && userProfile[1];

  if (status === 'success') {
    return (
      <ProfileGate>
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <BackgroundAnimation />
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <Card className="bg-gray-800 border-gray-700 max-w-lg text-center shadow-2xl shadow-teal-500/10">
            <CardHeader>
              <PartyPopper className="h-20 w-20 text-teal-400 mx-auto" />
              <CardTitle className="text-3xl font-bold text-white mt-4">Upload Successful!</CardTitle>
              <CardDescription className="text-gray-400">Your movie is now live on the CineVault platform.</CardDescription>
            </CardHeader>
             <CardContent>
              {/* MODIFIED: Updated to Somnia testnet explorer URL */}
               <p className="text-sm text-gray-500">Transaction Hash: <a href={`https://shannon-explorer.somnia.network/tx/${hash}`} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline break-all">{hash}</a></p>
             </CardContent>
            <CardFooter className="flex-col gap-2">
              <Button onClick={() => window.location.reload()} className="w-full bg-teal-500 hover:bg-teal-600 font-bold">Upload Another Movie</Button>
              <Link href="/profile" className="w-full"><Button variant="outline" className="w-full border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-white font-bold">View My Profile</Button></Link>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
      </ProfileGate>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white py-12 pt-24 md:py-16 md:pt-28">
      <BackgroundAnimation />
      <motion.div className="max-w-4xl mx-auto px-4" initial="hidden" animate="visible" variants={{hidden: {opacity:0, y:20}, visible: {opacity:1,y:0}}}>
        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-teal-400 to-cyan-500 bg-clip-text text-transparent">Upload Your Movie</h1>
          <p className="text-gray-400 text-lg">Share your creation with the CineVault community.</p>
        </div>

        {isConnected && !userHasProfile && (
          <Alert variant="destructive" className="mb-6 bg-yellow-900/50 border-yellow-700 text-yellow-300">
            <AlertCircle className="h-4 w-4" /><AlertTitle>Profile Required</AlertTitle><AlertDescription>You need to create a profile before uploading. <Link href="/profile" className="font-bold underline hover:text-yellow-200">Create Profile</Link></AlertDescription>
          </Alert>
        )}

        <Card className="bg-gray-800/80 backdrop-blur-sm border-gray-700 shadow-lg">
          <form onSubmit={handleSubmit}>
            <CardContent className="p-6 md:p-8 space-y-8">
              <div className="space-y-6">
                <h3 className="text-2xl font-semibold text-white border-l-4 border-teal-500 pl-4">Movie Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2"><Label htmlFor="title">Movie Title <span className="text-red-500">*</span></Label><Input id="title" name="title" value={formData.title} onChange={handleInputChange} required disabled={isProcessing} placeholder="e.g., The Decentralized Dream" /></div>
                  <div className="space-y-2"><Label htmlFor="pricePerDay">Price Per Day (STT) <span className="text-red-500">*</span></Label><Input id="pricePerDay" name="pricePerDay" type="number" step="0.0001" min="0.0001" value={formData.pricePerDay} onChange={handleInputChange} required disabled={isProcessing} placeholder="e.g., 0.005" /></div>
                </div>
                <div className="space-y-2"><Label htmlFor="description">Description</Label><Textarea id="description" name="description" value={formData.description} onChange={handleInputChange} rows={4} disabled={isProcessing} placeholder="A short synopsis of your movie..." /></div>
                <div className="space-y-2"><Label>Genre</Label><Select name="genre" value={formData.genre} onValueChange={(v) => setFormData(p => ({ ...p, genre: v }))} disabled={isProcessing}><SelectTrigger><SelectValue placeholder="Select genre" /></SelectTrigger><SelectContent>{genres.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent></Select></div>
              </div>

              <div className="space-y-6">
                <h3 className="text-2xl font-semibold text-white border-l-4 border-cyan-500 pl-4">File Uploads</h3>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="space-y-2"><Label className="flex items-center gap-2"><Video className="h-4 w-4" />Movie File <span className="text-red-500">*</span></Label><Input type="file" accept="video/*" onChange={(e) => handleFileChange("film", e.target.files[0])} required disabled={isProcessing} /></div>
                  <div className="space-y-2"><Label className="flex items-center gap-2"><Video className="h-4 w-4" />Trailer</Label><Input type="file" accept="video/*" onChange={(e) => handleFileChange("trailer", e.target.files[0])} disabled={isProcessing} /></div>
                  <div className="space-y-2"><Label className="flex items-center gap-2"><ImageIcon className="h-4 w-4" />Thumbnail</Label><Input type="file" accept="image/*" onChange={(e) => handleFileChange("thumbnail", e.target.files[0])} disabled={isProcessing} /></div>
                </div>
              </div>

              <Alert className="bg-gray-900/70 border-gray-700">
                  <UploadCloud className="h-4 w-4 text-cyan-400" /><AlertTitle className="text-white">Platform Fee</AlertTitle>
                  <AlertDescription className="text-gray-400 mt-2">A one-time fee of <strong className="text-cyan-300">{uploadFeeSTT} STT</strong> is required to upload your movie.</AlertDescription>
              </Alert>
            </CardContent>
            <CardFooter className="bg-gray-800 p-6">
              <Button type="submit" disabled={!isConnected || isProcessing || !userHasProfile} className="w-full bg-teal-500 hover:bg-teal-600 font-bold text-lg py-6 disabled:bg-gray-600 disabled:cursor-not-allowed">
                { !isConnected ? "Connect Wallet to Upload" :
                  !userHasProfile ? "Please Create a Profile First" :
                  isPending || isConfirming ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /><span>{isConfirming ? "Confirming Transaction..." : "Check Wallet..."}</span></> :
                  status === 'uploading' ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /><span>Uploading Files to IPFS...</span></> :
                  <><UploadCloud className="mr-2 h-5 w-5" /> Upload & Submit</>
                }
              </Button>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  )
}