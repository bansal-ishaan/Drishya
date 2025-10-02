"use client"

import { useState, useEffect, useMemo } from "react"
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi"
import { useRouter } from 'next/navigation'
import { motion } from "framer-motion"
import { BackgroundAnimation } from "@/components/BackgroundAnimation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Image as ImageIcon, DollarSign, AlertCircle, Loader2, PartyPopper, Wallet, Link } from "lucide-react"
import { CONTRACT_ADDRESS, CONTRACT_ABI, handleContractError } from "@/lib/contract"
import { uploadToPinata, validateFile } from "@/lib/pinata"
import { useToast } from "@/hooks/use-toast"
import { ProfileGate } from '@/components/ProfileGate'


const SuccessScreen = ({ uploadedCid, memeTitle, onViewGallery, onMintAnother }) => (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <BackgroundAnimation />
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
            <Card className="bg-gray-800 border-gray-700 max-w-lg text-center shadow-2xl shadow-violet-500/10">
                <CardHeader>
                    <PartyPopper className="h-20 w-20 text-violet-400 mx-auto" />
                    <CardTitle className="text-3xl font-bold text-white mt-4">Meme Minted!</CardTitle>
                    <CardDescription className="text-gray-400">Your meme is now on-chain and eligible for the daily spotlight.</CardDescription>
                </CardHeader>
                <CardContent>
                    {uploadedCid && (<img src={`https://gateway.pinata.cloud/ipfs/${uploadedCid}`} alt={memeTitle} className="w-full max-w-xs mx-auto rounded-lg object-cover" />)}
                </CardContent>
                <CardFooter className="flex-col gap-2">
                  <Link href="/meme" >
                    <Button onClick={onViewGallery} variant="outline" className="w-full border-violet-400 text-violet-400 hover:bg-violet-400 hover:text-white font-bold">View Meme Gallery</Button></Link>
                    <Button onClick={onMintAnother} className="w-full bg-teal-500 hover:bg-teal-600 font-bold">Mint Another Meme</Button>
                </CardFooter>
            </Card>
        </motion.div>
    </div>
);


export default function MintMemePage() {
    const { address, isConnected } = useAccount()
    const { toast } = useToast()
    const router = useRouter()

    const [status, setStatus] = useState("idle")
    const [formData, setFormData] = useState({ title: "" })
    const [file, setFile] = useState(null)
    const [uploadedCid, setUploadedCid] = useState("")
    const [successfulMemeTitle, setSuccessfulMemeTitle] = useState("");

    const resetForm = () => {
        setStatus("idle");
        setFormData({ title: "" });
        setFile(null);
        setUploadedCid("");
        setSuccessfulMemeTitle("");
    };
    
    const { data: memeFee } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'memeFee'
    });
    
    const { data: userProfile, isLoading: isProfileLoading } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "userProfiles",
        args: [address],
        enabled: !!address,
    });
    
    // VITAL FIX #1: Create a reliable boolean to check profile status
    const userHasProfile = useMemo(() => userProfile && userProfile[1], [userProfile]);

    const { writeContract, data: hash, isPending, error: writeError } = useWriteContract();
    const { isSuccess, error: txError } = useWaitForTransactionReceipt({ hash });

    const isProcessing = status === "uploading" || status === "submitting" || isPending;

    useEffect(() => {
        if (writeError || txError) {
            const error = writeError || txError;
            toast({ title: "Transaction Failed", description: handleContractError(error), variant: "destructive" });
            setStatus("error"); // Allows the user to try again
        }
    }, [writeError, txError, toast]);
    
    useEffect(() => {
        if (isSuccess) {
            toast({ title: "Minting Confirmed!", description: "Your meme is permanently on the blockchain." });
            setStatus("success");
        }
    }, [isSuccess, toast]);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;
        try {
            validateFile(selectedFile, 10, ["image/jpeg", "image/png", "image/gif", "image/webp"]);
            setFile(selectedFile);
        } catch (error) {
            toast({ title: "File Error", description: error.message, variant: "destructive" });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // VITAL FIX #2: Rewritten, more robust validation with specific error messages
        if (!isConnected) {
            toast({ title: "Validation Error", description: "Please connect your wallet first.", variant: "destructive" });
            return;
        }
        // Wait until the profile has loaded before checking
        if (isProfileLoading) {
            toast({ title: "Please Wait", description: "Verifying your profile status...", variant: "default" });
            return;
        }
        if (!userHasProfile) {
            toast({ title: "Validation Error", description: "You must create a profile before you can mint.", variant: "destructive" });
            return;
        }
        if (!file) {
            toast({ title: "Validation Error", description: "Please select an image file to mint.", variant: "destructive" });
            return;
        }
        if (!formData.title.trim()) {
            toast({ title: "Validation Error", description: "Please enter a title for your meme.", variant: "destructive" });
            return;
        }

        try {
            setStatus("uploading");
            setSuccessfulMemeTitle(formData.title); // Save title for success screen

            toast({ title: "Uploading to IPFS...", description: "Pinning your meme, please wait." });
            const cid = await uploadToPinata(file);
            setUploadedCid(cid);

            setStatus("submitting");
            writeContract({
                address: CONTRACT_ADDRESS,
                abi: CONTRACT_ABI,
                functionName: "mintMeme",
                args: [formData.title, cid],
                value: memeFee,
            });
        } catch (error) {
            toast({ title: "Upload Failed", description: handleContractError(error), variant: "destructive" });
            setStatus("error");
            setSuccessfulMemeTitle("");
        }
    };
    
    // The success screen is now controlled by our explicit `status` state
    if (status === 'success') {
        return (
            <SuccessScreen
                uploadedCid={uploadedCid}
                memeTitle={successfulMemeTitle} 
                onViewGallery={() => router.push('/memes')}
                onMintAnother={resetForm}
            />
        );
    }
    
    return (
        <ProfileGate>
            <div className="min-h-screen bg-gray-900 text-white py-12 pt-24 md:py-16 md:pt-28">
                <BackgroundAnimation />
                <motion.div 
                    className="max-w-2xl mx-auto px-4"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
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
                    ) : !userHasProfile && !isProfileLoading && (
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
                                    <Input id="title" value={formData.title} onChange={(e) => setFormData({ title: e.target.value })} required disabled={isProcessing} placeholder="e.g., Diamond Hands To The Moon" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="file">Image File <span className="text-red-500">*</span></Label>
                                    <Input id="file" type="file" accept="image/*" onChange={handleFileChange} required disabled={isProcessing}/>
                                    {file && (<p className="text-sm text-gray-400 pt-1">Selected: <span className="font-semibold text-cyan-400">{file.name}</span></p>)}
                                </div>
                                <Alert className="bg-gray-900/70 border-gray-700">
                                    <DollarSign className="h-4 w-4 text-violet-400" />
                                    <AlertTitle className="text-white">Minting Fee</AlertTitle>
                                    <AlertDescription className="text-gray-400 mt-1">
                                        A one-time fee of <strong className="text-violet-300">{memeFee ? (Number(memeFee) / 1e18).toFixed(4) : '...'} STT</strong> is required.
                                    </AlertDescription>
                                </Alert>
                            </CardContent>
                            <CardFooter className="bg-gray-800 p-6">
                                {/* VITAL FIX #3: The disabled check now includes `isProfileLoading` */}
                                <Button type="submit" disabled={!isConnected || isProcessing || !userHasProfile || !file || isProfileLoading} className="w-full bg-violet-500 hover:bg-violet-600 font-bold text-lg py-6 disabled:bg-gray-600 disabled:cursor-not-allowed">
                                    { isProcessing ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> <span>{status === 'submitting' ? "Confirming..." : "Uploading..."}</span></>
                                    : isProfileLoading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> <span>Verifying Profile...</span></>
                                    : "Mint Meme NFT"
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