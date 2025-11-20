"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useProfileByAddress } from "@/hooks/use-user-profile";
import {
  User,
  Award,
  Briefcase,
  CheckCircle,
  Calendar,
  DollarSign,
  FileText,
  Loader2,
} from "lucide-react";

interface UserDisplayProps {
  address: string;
  showAddress?: boolean;
  showBadge?: boolean;
  size?: "sm" | "md" | "lg";
  clickable?: boolean;
  className?: string;
}

/**
 * Component to display user with profile info (avatar + display name)
 * Falls back to address if no profile exists
 * Clicking avatar opens profile dialog
 */
export function UserDisplay({
  address,
  showAddress = false,
  showBadge = false,
  size = "md",
  clickable = true,
  className = "",
}: UserDisplayProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data: profile, isLoading } = useProfileByAddress(address);

  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-10 w-10",
  };

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const displayName = profile?.displayName || truncateAddress(address);
  const initials = profile?.displayName
    ? getInitials(profile.displayName)
    : address.slice(2, 4).toUpperCase();

  return (
    <>
      <div className={`flex items-center gap-2 ${className}`}>
        <Avatar
          className={`${sizeClasses[size]} ${
            clickable ? "cursor-pointer hover:ring-2 hover:ring-primary" : ""
          }`}
          onClick={() => clickable && setDialogOpen(true)}
        >
          <AvatarImage
            src={profile?.avatarUrl || undefined}
            alt={displayName}
          />
          <AvatarFallback className="bg-primary/10 text-primary">
            {isLoading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              initials
            )}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <span className={`font-medium ${textSizeClasses[size]}`}>
            {displayName}
          </span>
          {showAddress && profile?.displayName && (
            <span className="text-xs text-muted-foreground font-mono">
              {truncateAddress(address)}
            </span>
          )}
        </div>
        {showBadge && profile && (
          <Badge variant="outline" className="ml-2">
            {profile.userType === 1
              ? "Requester"
              : profile.userType === 2
              ? "Labeler"
              : "Both"}
          </Badge>
        )}
      </div>

      {clickable && (
        <UserProfileDialog
          address={address}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
        />
      )}
    </>
  );
}

/**
 * Dialog component to show full user profile details
 */
interface UserProfileDialogProps {
  address: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function UserProfileDialog({
  address,
  open,
  onOpenChange,
}: UserProfileDialogProps) {
  const { data: profile, isLoading } = useProfileByAddress(address);

  const getUserTypeBadge = (userType: number) => {
    switch (userType) {
      case 1:
        return (
          <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <Briefcase className="h-3 w-3 mr-1" />
            Task Requester
          </Badge>
        );
      case 2:
        return (
          <Badge className="bg-green-500/10 text-green-600 dark:text-green-400">
            <CheckCircle className="h-3 w-3 mr-1" />
            Labeler
          </Badge>
        );
      case 3:
        return (
          <Badge className="bg-purple-500/10 text-purple-600 dark:text-purple-400">
            <Award className="h-3 w-3 mr-1" />
            Requester & Labeler
          </Badge>
        );
      default:
        return null;
    }
  };

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 10)}...${addr.slice(-8)}`;
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>User Profile</DialogTitle>
          <DialogDescription>
            View user information and activity
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : !profile ? (
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-4 py-6">
              <Avatar className="h-20 w-20">
                <AvatarFallback className="bg-primary/10 text-primary text-xl">
                  {address.slice(2, 4).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  No Profile Created
                </p>
                <p className="text-xs font-mono text-muted-foreground">
                  {truncateAddress(address)}
                </p>
              </div>
            </div>
            <Alert>
              <User className="h-4 w-4" />
              <AlertDescription>
                This user hasn&apos;t created a profile yet.
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Profile Header */}
            <div className="flex flex-col items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage
                  src={profile.avatarUrl || undefined}
                  alt={profile.displayName}
                />
                <AvatarFallback className="bg-primary/10 text-primary text-xl">
                  {getInitials(profile.displayName)}
                </AvatarFallback>
              </Avatar>
              <div className="text-center">
                <h3 className="text-xl font-semibold">{profile.displayName}</h3>
                <p className="text-xs font-mono text-muted-foreground mt-1">
                  {truncateAddress(address)}
                </p>
                <div className="mt-3">{getUserTypeBadge(profile.userType)}</div>
              </div>
            </div>

            <Separator />

            {/* Bio */}
            {profile.bio && (
              <>
                <div>
                  <h4 className="text-sm font-semibold mb-2">Bio</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {profile.bio}
                  </p>
                </div>
                <Separator />
              </>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Tasks Created</p>
                  <p className="font-semibold">{profile.tasksCreated}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <CheckCircle className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Submissions</p>
                  <p className="font-semibold">{profile.submissionsCount}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <Award className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Reputation</p>
                  <p className="font-semibold">{profile.reputationScore}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Joined</p>
                  <p className="font-semibold text-xs">
                    {new Date(parseInt(profile.createdAt)).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
