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
} from "lucide-react";
import { uploadToWalrus } from "@/lib/walrus";
import {
  updateProfileTransaction,
  TASK_REGISTRY_ID,
  USER_TYPES,
  PACKAGE_ID,
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
      return "bg-blue-500/10 text-blue-600 dark:text-blue-400";
    } else if (userType === USER_TYPES.LABELER) {
      return "bg-green-500/10 text-green-600 dark:text-green-400";
    } else {
      return "bg-purple-500/10 text-purple-600 dark:text-purple-400";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Alert>
          <AlertDescription>
            No profile found. Please create a profile first.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Profile Management</h1>
          <p className="text-muted-foreground mt-1">
            View and manage your profile information
          </p>
        </div>
        {!isEditing && (
          <Button onClick={handleStartEditing}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        )}
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-6 border-green-500 bg-green-500/10">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-600">
            {success}
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
          <TabsTrigger value="reputation">Reputation</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                {isEditing
                  ? "Update your profile details below"
                  : "Your current profile information"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Section */}
              <div className="flex items-start gap-6">
                <Avatar className="h-24 w-24">
                  {(previewUrl || profile.avatarUrl) && (
                    <AvatarImage
                      src={previewUrl || profile.avatarUrl || ""}
                      alt={profile.displayName}
                    />
                  )}
                  <AvatarFallback className="text-2xl">
                    {profile.displayName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  {isEditing ? (
                    <div className="space-y-2">
                      <Label htmlFor="avatar">Avatar Image</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="avatar"
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          disabled={isSaving}
                        />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        PNG, JPG or WebP. Max 5MB.
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Current avatar
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Display Name */}
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                {isEditing ? (
                  <Input
                    id="displayName"
                    value={formData.displayName}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        displayName: e.target.value,
                      }))
                    }
                    placeholder="Enter your display name"
                    disabled={isSaving}
                    maxLength={50}
                  />
                ) : (
                  <p className="text-lg font-medium">{profile.displayName}</p>
                )}
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                {isEditing ? (
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, bio: e.target.value }))
                    }
                    placeholder="Tell us about yourself..."
                    disabled={isSaving}
                    rows={4}
                    maxLength={500}
                  />
                ) : (
                  <p className="text-muted-foreground">
                    {profile.bio || "No bio provided"}
                  </p>
                )}
              </div>

              {/* Role */}
              <div className="space-y-2">
                <Label>Role</Label>
                {isEditing ? (
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
                    <div className="grid gap-4">
                      {ROLE_OPTIONS.map((role) => (
                        <div
                          key={role.value}
                          className="flex items-start space-x-3"
                        >
                          <RadioGroupItem
                            value={role.value.toString()}
                            id={`role-${role.value}`}
                          />
                          <Label
                            htmlFor={`role-${role.value}`}
                            className="flex-1 cursor-pointer"
                          >
                            <div className="flex items-center gap-2 mb-1">
                              {role.icon}
                              <span className="font-medium">{role.label}</span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {role.description}
                            </p>
                          </Label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                ) : (
                  <div>
                    <Badge
                      className={getRoleBadgeColor(
                        profile.userType as UserType
                      )}
                    >
                      {getRoleLabel(profile.userType as UserType)}
                    </Badge>
                  </div>
                )}
              </div>

              {/* Wallet Address */}
              <div className="space-y-2">
                <Label>Wallet Address</Label>
                <p className="text-sm font-mono bg-muted p-3 rounded-md break-all">
                  {account?.address}
                </p>
              </div>

              {/* Action Buttons */}
              {isEditing && (
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    className="flex-1"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleCancelEdit}
                    disabled={isSaving}
                    variant="outline"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              )}

              {/* Upload Progress */}
              {isSaving && uploadProgress > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Updating profile...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Tasks Created
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold">{profile.tasksCreated}</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Total tasks you&apos;ve created
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Tasks Completed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold">{profile.submissionsCount}</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Total tasks you&apos;ve completed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Reputation Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold">{profile.reputationScore}</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Your current reputation
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Total Earnings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold">
                  {(profile.totalEarned / 1_000_000_000).toFixed(2)} SUI
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Total amount earned
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reputation" className="space-y-6">
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

              <Card>
                <CardHeader>
                  <CardTitle>Badges & Achievements</CardTitle>
                  <CardDescription>
                    Unlock badges by completing tasks and maintaining quality
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 md:grid-cols-2">
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
            <Card>
              <CardContent className="py-12 text-center">
                <Award className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Reputation Data</h3>
                <p className="text-muted-foreground">
                  Complete tasks to start building your reputation
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Your recent actions on the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <p>No recent activity to display</p>
                <p className="text-sm mt-2">
                  Start creating or completing tasks to see activity here
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
