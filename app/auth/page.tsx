"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClient,
} from "@mysten/dapp-kit";
import { ConnectButton } from "@mysten/dapp-kit";
import { useQueryClient } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  Wallet,
  UserCircle,
  Briefcase,
  Users,
  Upload,
  Loader2,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import { uploadToWalrus } from "@/lib/walrus";
import { Navbar } from "@/components/navbar";
import {
  createProfileTransaction,
  hasUserProfile,
  PACKAGE_ID,
  PLATFORM_CONFIG_ID,
  TASK_REGISTRY_ID,
  USER_TYPES,
} from "@/lib/contracts/songsim";

// Dynamic import for 3D background (same as landing page hero)
const Hero3DScene = dynamic(
  () => import("@/components/hero-3d-scene").then((mod) => mod.Hero3DScene),
  { ssr: false }
);

type UserType = (typeof USER_TYPES)[keyof typeof USER_TYPES];

interface RoleOption {
  value: UserType;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const ROLE_OPTIONS: RoleOption[] = [
  {
    value: USER_TYPES.REQUESTER,
    label: "Task Requester",
    description: "Create tasks and manage labeling projects",
    icon: <Briefcase className="h-6 w-6" />,
  },
  {
    value: USER_TYPES.LABELER,
    label: "Labeler",
    description: "Complete labeling tasks and earn rewards",
    icon: <UserCircle className="h-6 w-6" />,
  },
  {
    value: USER_TYPES.BOTH,
    label: "Both",
    description: "Create tasks and complete labeling work",
    icon: <Users className="h-6 w-6" />,
  },
];

interface ProfileFormData {
  displayName: string;
  bio: string;
  avatarFile: File | null;
  userType: UserType;
}

export default function AuthPage() {
  const router = useRouter();
  const account = useCurrentAccount();
  const suiClient = useSuiClient();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const queryClient = useQueryClient();

  const [isCheckingProfile, setIsCheckingProfile] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string>("");
  const [hasRedirected, setHasRedirected] = useState(false);

  const [formData, setFormData] = useState<ProfileFormData>({
    displayName: "",
    bio: "",
    avatarFile: null,
    userType: USER_TYPES.BOTH,
  });

  useEffect(() => {
    if (account) {
      checkUserProfile();
    }
  }, [account]);

  const checkUserProfile = async () => {
    if (!account || hasRedirected) return;

    setIsCheckingProfile(true);
    setError("");

    try {
      // Check if TASK_REGISTRY_ID is configured
      if (!TASK_REGISTRY_ID) {
        console.warn("TASK_REGISTRY_ID not configured");
        setError(
          "Contract not configured. Please set up environment variables."
        );
        setIsCheckingProfile(false);
        return;
      }

      // Check if user has a profile on-chain
      const profileExists = await hasUserProfile(
        suiClient,
        account.address,
        TASK_REGISTRY_ID
      );

      console.log("Profile exists:", profileExists);

      if (profileExists && !hasRedirected) {
        // User has profile, redirect to dashboard
        console.log("Redirecting to dashboard");
        setHasProfile(true);
        setHasRedirected(true);
        router.replace("/dashboard");
      } else if (!profileExists) {
        // No profile, show profile creation dialog
        console.log("No profile found, showing creation dialog");
        setHasProfile(false);
        setShowProfileDialog(true);
      }
    } catch (error) {
      console.error("Error checking profile:", error);
      setError(
        "Failed to check profile. Please ensure contract is deployed and configured."
      );
      // Don't auto-show dialog on error to prevent loop
    } finally {
      setIsCheckingProfile(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("Avatar file size must be less than 5MB");
        return;
      }

      // Validate file type
      if (!file.type.startsWith("image/")) {
        setError("Avatar must be an image file");
        return;
      }

      setFormData({ ...formData, avatarFile: file });
      setError("");
    }
  };

  const handleCreateProfile = async () => {
    if (!account) {
      setError("Please connect your wallet first");
      return;
    }

    // Validate form
    if (!formData.displayName.trim()) {
      setError("Display name is required");
      return;
    }

    if (formData.displayName.length > 50) {
      setError("Display name must be less than 50 characters");
      return;
    }

    if (formData.bio.length > 500) {
      setError("Bio must be less than 500 characters");
      return;
    }

    setIsCreatingProfile(true);
    setError("");

    try {
      let avatarUrl = "";

      // Upload avatar to Walrus if provided
      if (formData.avatarFile) {
        setUploadProgress(10);

        try {
          const uploadResult = await uploadToWalrus(formData.avatarFile, {
            epochs: 5, // Store for 5 epochs
            onProgress: (progress) => {
              setUploadProgress(10 + progress * 0.4); // 10-50%
            },
          });

          // Use the URL directly from upload result
          avatarUrl = uploadResult.url;
          setUploadProgress(50);
        } catch (uploadError) {
          console.error("Avatar upload failed:", uploadError);
          setError("Failed to upload avatar. Continuing without avatar...");
          // Continue without avatar
        }
      }

      // Check if required IDs are configured
      if (!TASK_REGISTRY_ID || !PLATFORM_CONFIG_ID) {
        setError("Contract not properly configured. Please contact support.");
        setIsCreatingProfile(false);
        return;
      }

      setUploadProgress(60);

      // Create profile transaction
      const tx = createProfileTransaction(
        TASK_REGISTRY_ID,
        PLATFORM_CONFIG_ID,
        formData.displayName,
        formData.bio,
        avatarUrl,
        formData.userType
      );

      setUploadProgress(70);

      // Execute transaction
      signAndExecute(
        {
          transaction: tx,
        },
        {
          onSuccess: (result) => {
            console.log("Profile created successfully:", result);
            setUploadProgress(100);

            // Invalidate the profile cache to force a fresh fetch on dashboard
            if (account) {
              queryClient.invalidateQueries({
                queryKey: ["userProfile", account.address],
              });
            }

            // Navigate to dashboard after short delay
            setTimeout(() => {
              router.push("/dashboard");
            }, 500);
          },
          onError: (error) => {
            console.error("Transaction failed:", error);
            setError(`Failed to create profile: ${error.message}`);
            setIsCreatingProfile(false);
            setUploadProgress(0);
          },
        }
      );
    } catch (error) {
      console.error("Error creating profile:", error);
      setError(
        error instanceof Error ? error.message : "Failed to create profile"
      );
      setIsCreatingProfile(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="relative min-h-screen">
      <Navbar />
      <div className="relative flex items-center justify-center overflow-hidden min-h-[calc(100vh-4rem)]">
        {/* 3D Background (same as landing page) */}
        <div className="absolute inset-0 -z-10">
          <Hero3DScene />
        </div>

        {/* Overlay for better readability */}
        <div className="absolute inset-0 bg-background/60 backdrop-blur-sm -z-10" />

        <div className="container max-w-md py-10 z-10 px-4 animate-in fade-in zoom-in-95 duration-500">
          <Card className="glass-card border-primary/20 shadow-2xl overflow-hidden relative">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />
            <CardHeader className="text-center space-y-2 pb-2">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 ring-4 ring-primary/5">
                <Wallet className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">Welcome Back</CardTitle>
              <CardDescription className="text-base">
                Connect your wallet to access the Songsim Label platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
              {!account ? (
                <>
                  <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 text-center space-y-2">
                     <Sparkles className="h-5 w-5 text-primary mx-auto" />
                     <p className="text-sm font-medium">Secure & Decentralized</p>
                     <p className="text-xs text-muted-foreground">
                       Your keys, your data. Connect with Sui Wallet to sign in or create a new account.
                     </p>
                  </div>

                  <div className="flex flex-col gap-4">
                    <div className="w-full [&_button]:w-full [&_button]:bg-primary [&_button]:hover:bg-primary/90 [&_button]:text-primary-foreground [&_button]:shadow-lg [&_button]:shadow-primary/20 [&_button]:h-11 [&_button]:rounded-xl [&_button]:font-medium">
                      <ConnectButton
                        connectText="Connect Wallet"
                      />
                    </div>

                    <div className="text-center text-sm text-muted-foreground">
                      <p>Don&apos;t have a Sui wallet?</p>
                      <a
                        href="https://suiwallet.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary/80 hover:underline font-medium transition-colors"
                      >
                        Get Sui Wallet
                      </a>
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-center gap-2 p-3 bg-green-500/10 text-green-600 rounded-xl border border-green-500/20">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="font-medium text-sm">Wallet Connected</span>
                  </div>

                  {isCheckingProfile && (
                    <div className="flex flex-col items-center gap-4 py-8">
                      <div className="relative">
                        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
                        <Loader2 className="h-10 w-10 animate-spin text-primary relative z-10" />
                      </div>
                      <p className="text-sm text-muted-foreground font-medium animate-pulse">
                        Verifying profile status...
                      </p>
                    </div>
                  )}

                  {!isCheckingProfile && error && (
                    <Alert variant="destructive" className="bg-destructive/5 border-destructive/20">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {!isCheckingProfile && !error && !hasProfile && (
                    <div className="space-y-4">
                       <div className="text-center space-y-2">
                         <p className="font-semibold text-lg">Almost there!</p>
                         <p className="text-sm text-muted-foreground">We couldn&apos;t find a profile for this wallet address. Create one to get started.</p>
                       </div>
                      <Button
                        onClick={() => setShowProfileDialog(true)}
                        className="w-full h-11 text-base shadow-lg shadow-primary/20"
                      >
                        Create Profile <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  {hasProfile && (
                    <div className="text-center py-8 space-y-3">
                      <div className="h-12 w-12 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <p className="font-bold text-lg">Profile Verified</p>
                        <p className="text-sm text-muted-foreground">Redirecting you to the dashboard...</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-4 border-t border-border/50">
                <Button
                  variant="ghost"
                  onClick={() => router.push("/")}
                  className="w-full hover:bg-muted/50"
                >
                  Back to Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Profile Creation Dialog */}
        <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto glass-card border-primary/20">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                Create Your Profile
              </DialogTitle>
              <DialogDescription>
                Complete your profile to start using the platform. All fields
                marked with * are required.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Display Name */}
              <div className="space-y-2">
                <Label htmlFor="displayName" className="text-base">
                  Display Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="displayName"
                  value={formData.displayName}
                  onChange={(e) =>
                    setFormData({ ...formData, displayName: e.target.value })
                  }
                  placeholder="Enter your display name"
                  maxLength={50}
                  disabled={isCreatingProfile}
                  className="bg-background/50 h-11"
                />
                <p className="text-xs text-muted-foreground text-right">
                  {formData.displayName.length}/50 characters
                </p>
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <Label htmlFor="bio" className="text-base">Bio (Optional)</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) =>
                    setFormData({ ...formData, bio: e.target.value })
                  }
                  placeholder="Tell us about yourself..."
                  rows={4}
                  maxLength={500}
                  disabled={isCreatingProfile}
                  className="bg-background/50 resize-none"
                />
                <p className="text-xs text-muted-foreground text-right">
                  {formData.bio.length}/500 characters
                </p>
              </div>

              {/* Avatar Upload */}
              <div className="space-y-2">
                <Label htmlFor="avatar" className="text-base">Profile Picture (Optional)</Label>
                <div className="flex items-center gap-4 p-4 border rounded-xl bg-muted/20">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center overflow-hidden border-2 border-border">
                     {formData.avatarFile ? (
                        <img src={URL.createObjectURL(formData.avatarFile)} alt="Preview" className="h-full w-full object-cover" />
                     ) : (
                        <UserCircle className="h-8 w-8 text-muted-foreground" />
                     )}
                  </div>
                  <div className="flex-1">
                    <input
                      type="file"
                      id="avatar"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      disabled={isCreatingProfile}
                    />
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById("avatar")?.click()}
                        disabled={isCreatingProfile}
                      >
                        <Upload className="mr-2 h-3 w-3" />
                        Choose Image
                      </Button>
                      {formData.avatarFile && (
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setFormData({...formData, avatarFile: null})}
                          className="text-destructive hover:text-destructive"
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                    {formData.avatarFile ? (
                      <p className="text-xs text-muted-foreground mt-1 truncate max-w-[200px]">
                        {formData.avatarFile.name} ({(formData.avatarFile.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground mt-1">
                        Max 5MB. JPG, PNG, GIF, WebP
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* User Type Selection */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">
                  Select Your Role <span className="text-destructive">*</span>
                </Label>
                <RadioGroup
                  value={formData.userType.toString()}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      userType: parseInt(value) as UserType,
                    })
                  }
                  disabled={isCreatingProfile}
                >
                  <div className="grid gap-3">
                    {ROLE_OPTIONS.map((option) => (
                      <div
                        key={option.value}
                        className={`relative flex items-start space-x-3 rounded-xl border p-4 transition-all cursor-pointer ${
                          formData.userType === option.value 
                            ? "bg-primary/5 border-primary ring-1 ring-primary/20" 
                            : "hover:bg-muted/50 border-border"
                        }`}
                        onClick={() =>
                          !isCreatingProfile &&
                          setFormData({ ...formData, userType: option.value })
                        }
                      >
                        <RadioGroupItem
                          value={option.value.toString()}
                          id={`role-${option.value}`}
                          className="mt-1"
                        />
                        <Label
                          htmlFor={`role-${option.value}`}
                          className="flex-1 cursor-pointer space-y-1"
                        >
                          <div className="flex items-center gap-2">
                            <div className={`${formData.userType === option.value ? "text-primary" : "text-muted-foreground"}`}>
                              {option.icon}
                            </div>
                            <span className="font-semibold">
                              {option.label}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {option.description}
                          </p>
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </div>

              {/* Upload Progress */}
              {isCreatingProfile && uploadProgress > 0 && (
                <div className="space-y-2 bg-muted/30 p-3 rounded-lg border">
                  <div className="flex justify-between text-sm font-medium">
                    <span className="text-primary">
                      {uploadProgress < 50
                        ? "Uploading avatar to Walrus..."
                        : uploadProgress < 70
                        ? "Creating blockchain transaction..."
                        : "Finalizing profile..."}
                    </span>
                    <span>{Math.round(uploadProgress)}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              )}

              {/* Error Message */}
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Info Alert */}
              <Alert className="bg-blue-500/5 border-blue-500/20 text-blue-700 dark:text-blue-400">
                <ShieldCheck className="h-4 w-4" />
                <AlertDescription className="text-xs ml-2">
                  Your profile will be created on the Sui blockchain. This
                  requires a one-time transaction. Avatar images are stored securely on
                  Walrus decentralized storage.
                </AlertDescription>
              </Alert>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setShowProfileDialog(false)}
                  className="flex-1"
                  disabled={isCreatingProfile}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateProfile}
                  className="flex-1 shadow-lg shadow-primary/20"
                  disabled={
                    isCreatingProfile ||
                    !formData.displayName.trim() ||
                    formData.displayName.length > 50 ||
                    formData.bio.length > 500
                  }
                >
                  {isCreatingProfile ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Profile"
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
