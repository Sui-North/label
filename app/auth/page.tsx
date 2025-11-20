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
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm -z-10" />

        <div className="container max-w-md py-10 z-10">
          <Card className="border-2 shadow-2xl">
            <CardHeader className="text-center space-y-2">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Wallet className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-3xl font-bold">Welcome Back</CardTitle>
              <CardDescription className="text-base">
                Connect your wallet to access your dashboard
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {!account ? (
                <>
                  <Alert>
                    <AlertDescription className="text-sm">
                      Connect your Sui wallet to sign in or create a new
                      account. New users will be prompted to create a profile.
                    </AlertDescription>
                  </Alert>

                  <div className="flex flex-col gap-4">
                    <ConnectButton
                      connectText="Connect Wallet to Sign In"
                      className="w-full"
                    />

                    <div className="text-center text-sm text-muted-foreground">
                      <p>Don&apos;t have a Sui wallet?</p>
                      <a
                        href="https://suiwallet.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Get Sui Wallet
                      </a>
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <Alert>
                    <AlertDescription className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                      Wallet connected
                    </AlertDescription>
                  </Alert>

                  {isCheckingProfile && (
                    <div className="flex flex-col items-center gap-3 py-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                      <p className="text-sm text-muted-foreground">
                        Checking your profile...
                      </p>
                    </div>
                  )}

                  {!isCheckingProfile && error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {!isCheckingProfile && !error && !hasProfile && (
                    <Button
                      onClick={() => setShowProfileDialog(true)}
                      className="w-full"
                    >
                      Create Profile
                    </Button>
                  )}

                  {hasProfile && (
                    <div className="text-center text-sm text-muted-foreground">
                      <p>Profile found! Redirecting to dashboard...</p>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-4 border-t">
                <Button
                  variant="ghost"
                  onClick={() => router.push("/")}
                  className="w-full"
                >
                  Back to Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Profile Creation Dialog */}
        <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">
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
                <Label htmlFor="displayName">
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
                />
                <p className="text-xs text-muted-foreground">
                  {formData.displayName.length}/50 characters
                </p>
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <Label htmlFor="bio">Bio (Optional)</Label>
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
                />
                <p className="text-xs text-muted-foreground">
                  {formData.bio.length}/500 characters
                </p>
              </div>

              {/* Avatar Upload */}
              <div className="space-y-2">
                <Label htmlFor="avatar">Profile Picture (Optional)</Label>
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    id="avatar"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={isCreatingProfile}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById("avatar")?.click()}
                    disabled={isCreatingProfile}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Choose Image
                  </Button>
                  {formData.avatarFile && (
                    <div className="text-sm">
                      <p className="font-medium truncate max-w-[200px]">
                        {formData.avatarFile.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(formData.avatarFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Max 5MB. Supported formats: JPG, PNG, GIF, WebP
                </p>
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
                  <div className="space-y-3">
                    {ROLE_OPTIONS.map((option) => (
                      <div
                        key={option.value}
                        className="relative flex items-start space-x-3 rounded-lg border p-4 hover:bg-accent/50 transition-colors cursor-pointer"
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
                            <div className="text-primary">{option.icon}</div>
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
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>
                      {uploadProgress < 50
                        ? "Uploading avatar..."
                        : uploadProgress < 70
                        ? "Creating transaction..."
                        : "Processing..."}
                    </span>
                    <span>{Math.round(uploadProgress)}%</span>
                  </div>
                  <Progress value={uploadProgress} />
                </div>
              )}

              {/* Error Message */}
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Info Alert */}
              <Alert>
                <AlertDescription className="text-xs">
                  Your profile will be created on the Sui blockchain. This
                  requires a one-time transaction. Avatar images are stored on
                  Walrus decentralized storage.
                </AlertDescription>
              </Alert>

              {/* Action Buttons */}
              <div className="flex gap-3">
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
                  className="flex-1"
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
