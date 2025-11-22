"use client";

import { JSX, useState } from "react";
import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
} from "@mysten/dapp-kit";
import { useQueryClient } from "@tanstack/react-query";
import { useUserProfile } from "@/hooks/use-user-profile";
import { useReputation } from "@/hooks/use-reputation";
import { ReputationCard, BadgeCard, NextBadgeProgress } from "@/components/reputation-badges";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  UserCircle,
  Briefcase,
  Users,
  Loader2,
  Edit,
  Save,
  X,
  CheckCircle,
  TrendingUp,
  Star,
  Award,
  Wallet,
  ShieldCheck,
  Camera,
} from "lucide-react";
import { uploadToWalrus } from "@/lib/walrus";
import {
  updateProfileTransaction,
  TASK_REGISTRY_ID,
  USER_TYPES,
  PACKAGE_ID,
  CLOCK_ID,
} from "@/lib/contracts/songsim";

type UserType = 1 | 2 | 3;

interface RoleOption {
  value: UserType;
  label: string;
  description: string;
  icon: JSX.Element;
}

const ROLE_OPTIONS: RoleOption[] = [
  {
    value: USER_TYPES.REQUESTER,
    label: "Task Requester",
    description: "Create tasks and manage labeling projects",
    icon: <Briefcase className="h-5 w-5" />,
  },
  {
    value: USER_TYPES.LABELER,
    label: "Labeler",
    description: "Complete labeling tasks and earn rewards",
    icon: <UserCircle className="h-5 w-5" />,
  },
  {
    value: USER_TYPES.BOTH,
    label: "Both",
    description: "Create tasks and complete labeling work",
    icon: <Users className="h-5 w-5" />,
  },
];

interface EditFormData {
  displayName: string;
  bio: string;
  avatarFile: File | null;
  userType: UserType;
}

export default function ProfilePage() {
  const account = useCurrentAccount();
  const { data: profile, isLoading } = useUserProfile();
  const { reputation, isLoading: isLoadingReputation, badgeDetails, nextBadge, acceptanceRate, BADGE_REQUIREMENTS } = useReputation(account?.address);
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  const [formData, setFormData] = useState<EditFormData>({
    displayName: "",
    bio: "",
    avatarFile: null,
    userType: USER_TYPES.BOTH,
  });

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Initialize form data when profile loads or editing starts
  const handleStartEditing = () => {
    if (profile) {
      setFormData({
        displayName: profile.displayName,
        bio: profile.bio,
        avatarFile: null,
        userType: profile.userType as UserType,
      });
      setPreviewUrl(null);
    }
    setIsEditing(true);
    setError("");
    setSuccess("");
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setFormData({
      displayName: "",
      bio: "",
      avatarFile: null,
      userType: USER_TYPES.BOTH,
    });
    setPreviewUrl(null);
    setError("");
    setSuccess("");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("Avatar image must be less than 5MB");
        return;
      }

      // Validate file type
      if (!file.type.startsWith("image/")) {
        setError("Please upload an image file");
        return;
      }

      setFormData((prev) => ({ ...prev, avatarFile: file }));

      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    if (!account || !profile) return;

    setIsSaving(true);
    setError("");
    setSuccess("");
    setUploadProgress(0);

    try {
      // Validate inputs
      if (!formData.displayName.trim()) {
        setError("Display name is required");
        setIsSaving(false);
        return;
      }

      setUploadProgress(10);

      // Upload avatar if changed
      let avatarUrl = profile.avatarUrl; // Keep existing if not changed
      if (formData.avatarFile) {
        setUploadProgress(20);
        console.log("Uploading new avatar to Walrus...");

        const uploadResult = await uploadToWalrus(formData.avatarFile);
        avatarUrl = uploadResult.url;
        console.log("Avatar uploaded successfully:", avatarUrl);
      }

      setUploadProgress(60);

      // Check contract configuration and profile
      if (!TASK_REGISTRY_ID || !profile.objectId) {
        setError("Contract not properly configured. Please contact support.");
        setIsSaving(false);
        return;
      }

      // Create update transaction
      const tx = updateProfileTransaction(
        profile.objectId,
        formData.displayName,
        formData.bio,
        avatarUrl as string
      );

      // If user type changed, add update_user_type call
      if (formData.userType !== profile.userType) {
        tx.moveCall({
          target: `${PACKAGE_ID}::songsim::update_user_type`,
          arguments: [
            tx.object(profile.objectId),
            tx.pure.u8(formData.userType),
            tx.object(CLOCK_ID),
          ],
        });
      }

      setUploadProgress(70);

      // Execute transaction
      signAndExecute(
        {
          transaction: tx,
        },
        {
          onSuccess: (result) => {
            console.log("Profile updated successfully:", result);
            setUploadProgress(100);

            // Invalidate the profile cache to force a fresh fetch
            if (account) {
              queryClient.invalidateQueries({
                queryKey: ["userProfile", account.address],
              });
            }

            setSuccess("Profile updated successfully!");
            setIsEditing(false);
            setIsSaving(false);
            setUploadProgress(0);

            // Clear success message after 3 seconds
            setTimeout(() => setSuccess(""), 3000);
          },
          onError: (error) => {
            console.error("Transaction failed:", error);
            setError(`Failed to update profile: ${error.message}`);
            setIsSaving(false);
            setUploadProgress(0);
          },
        }
      );
    } catch (error) {
      console.error("Error updating profile:", error);
      setError(
        error instanceof Error ? error.message : "Failed to update profile"
      );
      setIsSaving(false);
      setUploadProgress(0);
    }
  };

  const getRoleLabel = (userType: UserType): string => {
    const role = ROLE_OPTIONS.find((r) => r.value === userType);
    return role?.label || "Unknown";
  };

  const getRoleBadgeColor = (userType: UserType): string => {
    if (userType === USER_TYPES.REQUESTER) {
      return "bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-800";
    } else if (userType === USER_TYPES.LABELER) {
      return "bg-green-500/10 text-green-600 border-green-200 dark:border-green-800";
    } else {
      return "bg-purple-500/10 text-purple-600 border-purple-200 dark:border-purple-800";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
            <Loader2 className="h-12 w-12 animate-spin text-primary relative z-10" />
          </div>
          <p className="text-muted-foreground font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Alert className="max-w-md glass-card border-destructive/20 bg-destructive/5">
          <AlertDescription className="text-center py-4">
            <p className="font-semibold text-lg mb-2">No Profile Found</p>
            <p className="text-muted-foreground mb-4">Please create a profile to continue.</p>
            <Button onClick={() => window.location.href = '/auth'}>Create Profile</Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative">
         <div className="absolute -left-20 -top-20 w-64 h-64 bg-primary/10 blur-3xl rounded-full pointer-events-none" />
        <div className="relative z-10">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Profile Management
          </h1>
          <p className="text-muted-foreground mt-1 text-lg">
            Manage your identity and view your performance stats
          </p>
        </div>
        {!isEditing && (
          <Button 
            onClick={handleStartEditing} 
            className="shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        )}
      </div>

      {error && (
        <Alert variant="destructive" className="glass-card border-destructive/20 bg-destructive/5">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="glass-card border-green-500/20 bg-green-500/5 text-green-600">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription className="ml-2 font-medium">
            {success}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Profile Summary (Sticky) */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="glass-card border-primary/10 overflow-hidden sticky top-24">
            <div className="h-32 bg-gradient-to-br from-primary/20 via-purple-500/10 to-background" />
            <CardContent className="relative pt-0 pb-8 px-6 flex flex-col items-center text-center -mt-16">
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-br from-primary to-purple-600 rounded-full opacity-75 blur group-hover:opacity-100 transition duration-500" />
                <Avatar className="h-32 w-32 border-4 border-background relative">
                  {(previewUrl || profile.avatarUrl) && (
                    <AvatarImage
                      src={previewUrl || profile.avatarUrl || ""}
                      alt={profile.displayName}
                      className="object-cover"
                    />
                  )}
                  <AvatarFallback className="text-4xl bg-muted">
                    {profile.displayName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {isEditing && (
                  <label 
                    htmlFor="avatar-upload" 
                    className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full cursor-pointer hover:bg-primary/90 shadow-lg transition-transform hover:scale-105"
                  >
                    <Camera className="h-4 w-4" />
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      disabled={isSaving}
                    />
                  </label>
                )}
              </div>

              <div className="mt-4 space-y-1 w-full">
                {isEditing ? (
                   <div className="space-y-4 mt-2">
                     <div className="space-y-2 text-left">
                       <Label htmlFor="displayName">Display Name</Label>
                       <Input
                          id="displayName"
                          value={formData.displayName}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              displayName: e.target.value,
                            }))
                          }
                          placeholder="Display Name"
                          className="text-center font-bold"
                       />
                     </div>
                   </div>
                ) : (
                  <>
                    <h2 className="text-2xl font-bold truncate" title={profile.displayName}>
                      {profile.displayName}
                    </h2>
                    <div className="flex justify-center pt-2">
                      <Badge className={`${getRoleBadgeColor(profile.userType as UserType)} px-3 py-1`}>
                        {getRoleLabel(profile.userType as UserType)}
                      </Badge>
                    </div>
                  </>
                )}
              </div>

              <div className="mt-6 w-full space-y-4">
                 <div className="flex items-center justify-between text-sm p-3 bg-muted/30 rounded-xl border border-border/50">
                   <span className="text-muted-foreground flex items-center gap-2">
                     <Star className="h-4 w-4 text-yellow-500" /> Reputation
                   </span>
                   <span className="font-bold">{profile.reputationScore}</span>
                 </div>
                 <div className="flex items-center justify-between text-sm p-3 bg-muted/30 rounded-xl border border-border/50">
                   <span className="text-muted-foreground flex items-center gap-2">
                     <Wallet className="h-4 w-4 text-green-500" /> Earned
                   </span>
                   <span className="font-bold">{(profile.totalEarned / 1_000_000_000).toFixed(2)} SUI</span>
                 </div>
              </div>

              <div className="mt-6 w-full pt-6 border-t border-border/50">
                 <p className="text-xs text-muted-foreground font-mono break-all bg-muted/50 p-2 rounded text-center">
                   {account?.address}
                 </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Tabs & Content */}
        <div className="lg:col-span-8">
          <Tabs defaultValue="details" className="space-y-6">
            <TabsList className="w-full justify-start h-auto p-1 bg-muted/30 backdrop-blur-sm rounded-xl border border-white/10">
              <TabsTrigger value="details" className="flex-1 h-10 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                Details
              </TabsTrigger>
              <TabsTrigger value="stats" className="flex-1 h-10 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                Statistics
              </TabsTrigger>
              <TabsTrigger value="reputation" className="flex-1 h-10 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                Reputation
              </TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserCircle className="h-5 w-5 text-primary" />
                    Personal Information
                  </CardTitle>
                  <CardDescription>
                    Manage your bio and platform role
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Bio */}
                  <div className="space-y-2">
                    <Label htmlFor="bio" className="text-base">Bio</Label>
                    {isEditing ? (
                      <Textarea
                        id="bio"
                        value={formData.bio}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, bio: e.target.value }))
                        }
                        placeholder="Tell us about yourself..."
                        disabled={isSaving}
                        rows={5}
                        maxLength={500}
                        className="bg-background/50 resize-none"
                      />
                    ) : (
                      <div className="p-4 rounded-xl bg-muted/30 border border-border/50 min-h-[100px]">
                        <p className="text-muted-foreground whitespace-pre-wrap">
                          {profile.bio || "No bio provided yet."}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Role Selection (Only in Edit Mode) */}
                  {isEditing && (
                    <div className="space-y-3 pt-4 border-t border-border/50">
                      <Label className="text-base">Platform Role</Label>
                      <RadioGroup
                        value={formData.userType.toString()}
                        onValueChange={(value) =>
                          setFormData((prev) => ({
                            ...prev,
                            userType: parseInt(value) as UserType,
                          }))
                        }
                        disabled={isSaving}
                      >
                        <div className="grid gap-3 md:grid-cols-3">
                          {ROLE_OPTIONS.map((role) => (
                            <div
                              key={role.value}
                              className={`relative flex flex-col items-center text-center space-y-2 rounded-xl border p-4 cursor-pointer transition-all ${
                                formData.userType === role.value 
                                  ? "bg-primary/5 border-primary ring-1 ring-primary/20" 
                                  : "hover:bg-muted/50 border-border"
                              }`}
                              onClick={() => !isSaving && setFormData(prev => ({ ...prev, userType: role.value }))}
                            >
                              <RadioGroupItem
                                value={role.value.toString()}
                                id={`role-${role.value}`}
                                className="absolute right-3 top-3"
                              />
                              <div className={`p-2 rounded-full ${formData.userType === role.value ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                                {role.icon}
                              </div>
                              <Label
                                htmlFor={`role-${role.value}`}
                                className="cursor-pointer font-semibold"
                              >
                                {role.label}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </RadioGroup>
                    </div>
                  )}

                  {/* Action Buttons */}
                  {isEditing && (
                    <div className="flex gap-3 pt-6 border-t border-border/50">
                      <Button
                        onClick={handleSaveProfile}
                        disabled={isSaving}
                        className="flex-1 shadow-lg shadow-primary/20"
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Saving Changes...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Save Profile
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={handleCancelEdit}
                        disabled={isSaving}
                        variant="outline"
                        className="flex-1"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  )}

                  {/* Upload Progress */}
                  {isSaving && uploadProgress > 0 && (
                    <div className="space-y-2 bg-muted/30 p-3 rounded-lg border">
                      <div className="flex justify-between text-sm font-medium">
                        <span className="text-primary">
                          {uploadProgress < 50 ? "Uploading avatar..." : "Updating blockchain profile..."}
                        </span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <Progress value={uploadProgress} className="h-2" />
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="stats" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid gap-6 md:grid-cols-2">
                <Card className="glass-card hover:border-primary/30 transition-colors">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Briefcase className="h-4 w-4" /> Tasks Created
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold">{profile.tasksCreated}</span>
                      <span className="text-sm text-muted-foreground">tasks</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-card hover:border-primary/30 transition-colors">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" /> Tasks Completed
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold">{profile.submissionsCount}</span>
                      <span className="text-sm text-muted-foreground">submissions</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-card hover:border-primary/30 transition-colors">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Star className="h-4 w-4" /> Reputation Score
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-yellow-500">{profile.reputationScore}</span>
                      <span className="text-sm text-muted-foreground">points</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-card hover:border-primary/30 transition-colors">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Award className="h-4 w-4" /> Total Earnings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-green-500">
                        {(profile.totalEarned / 1_000_000_000).toFixed(2)}
                      </span>
                      <span className="text-sm text-muted-foreground">SUI</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="reputation" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {isLoadingReputation ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : reputation ? (
                <>
                  <div className="grid gap-6 md:grid-cols-2">
                    <ReputationCard
                      reputationScore={reputation.reputation_score}
                      totalCompleted={reputation.total_completed}
                      totalAccepted={reputation.total_accepted}
                      totalRejected={reputation.total_rejected}
                      acceptanceRate={acceptanceRate}
                    />
                    
                    {nextBadge && (
                      <NextBadgeProgress
                        name={nextBadge.name}
                        progress={nextBadge.progress}
                        target={nextBadge.target}
                        requirement={nextBadge.requirement}
                      />
                    )}
                  </div>

                  <Card className="glass-card">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-primary" />
                        Badges & Achievements
                      </CardTitle>
                      <CardDescription>
                        Unlock badges by completing tasks and maintaining quality
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                        <BadgeCard 
                          badgeId={1} 
                          name="Novice" 
                          requirement={BADGE_REQUIREMENTS[1]}
                          earned={badgeDetails.some(b => b.id === 1)}
                        />
                        <BadgeCard 
                          badgeId={2} 
                          name="Intermediate" 
                          requirement={BADGE_REQUIREMENTS[2]}
                          earned={badgeDetails.some(b => b.id === 2)}
                        />
                        <BadgeCard 
                          badgeId={3} 
                          name="Expert" 
                          requirement={BADGE_REQUIREMENTS[3]}
                          earned={badgeDetails.some(b => b.id === 3)}
                        />
                        <BadgeCard 
                          badgeId={4} 
                          name="Master" 
                          requirement={BADGE_REQUIREMENTS[4]}
                          earned={badgeDetails.some(b => b.id === 4)}
                        />
                        <BadgeCard 
                          badgeId={5} 
                          name="Consistent" 
                          requirement={BADGE_REQUIREMENTS[5]}
                          earned={badgeDetails.some(b => b.id === 5)}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card className="glass-card">
                  <CardContent className="py-12 text-center">
                    <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                      <Award className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No Reputation Data</h3>
                    <p className="text-muted-foreground max-w-sm mx-auto">
                      Complete tasks to start building your reputation and earning badges.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
