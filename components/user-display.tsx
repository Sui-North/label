"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useProfileByAddress } from "@/hooks/use-user-profile";
import {
  User,
  Award,
  Briefcase,
  CheckCircle,
  Calendar,
  FileText,
  Loader2,
  Star,
  Copy,
} from "lucide-react";
import { Button } from "./ui/button";
import { toast } from "sonner";

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
          className={`${sizeClasses[size]} border border-border/50 transition-all ${
            clickable ? "cursor-pointer hover:ring-2 hover:ring-primary/50 hover:scale-105" : ""
          }`}
          onClick={() => clickable && setDialogOpen(true)}
        >
          <AvatarImage
            src={profile?.avatarUrl || undefined}
            alt={displayName}
            className="object-cover"
          />
          <AvatarFallback className="bg-gradient-to-br from-primary/20 to-purple-500/20 text-primary font-medium">
            {isLoading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              initials
            )}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <span 
            className={`font-medium ${textSizeClasses[size]} ${clickable ? "cursor-pointer hover:text-primary transition-colors" : ""}`}
            onClick={() => clickable && setDialogOpen(true)}
          >
            {displayName}
          </span>
          {showAddress && profile?.displayName && (
            <span className="text-xs text-muted-foreground font-mono">
              {truncateAddress(address)}
            </span>
          )}
        </div>
        {showBadge && profile && (
          <Badge 
            variant="outline" 
            className={`ml-2 text-[10px] px-1.5 py-0 h-5 ${
              profile.userType === 1 
                ? "bg-blue-500/10 text-blue-600 border-blue-200" 
                : profile.userType === 2 
                ? "bg-green-500/10 text-green-600 border-green-200" 
                : "bg-purple-500/10 text-purple-600 border-purple-200"
            }`}
          >
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
          <Badge className="bg-blue-500/10 text-blue-600 border-blue-200 hover:bg-blue-500/20">
            <Briefcase className="h-3 w-3 mr-1" />
            Task Requester
          </Badge>
        );
      case 2:
        return (
          <Badge className="bg-green-500/10 text-green-600 border-green-200 hover:bg-green-500/20">
            <CheckCircle className="h-3 w-3 mr-1" />
            Labeler
          </Badge>
        );
      case 3:
        return (
          <Badge className="bg-purple-500/10 text-purple-600 border-purple-200 hover:bg-purple-500/20">
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

  const copyAddress = () => {
    navigator.clipboard.writeText(address);
    toast.success("Address copied to clipboard");
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
      <DialogContent className="max-w-md p-0 overflow-hidden glass-card border-primary/20 shadow-2xl">
        {/* Decorative Header Background */}
        <div className="h-24 bg-gradient-to-r from-primary/20 via-purple-500/20 to-blue-500/20 relative">
          <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]" />
          <DialogHeader className="sr-only">
            <DialogTitle>User Profile</DialogTitle>
          </DialogHeader>
        </div>

        <div className="px-6 pb-6 -mt-12 relative">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !profile ? (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <Avatar className="h-24 w-24 border-4 border-background shadow-xl">
                <AvatarFallback className="bg-muted text-muted-foreground text-xl">
                  {address.slice(2, 4).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Unknown User</h3>
                <div className="flex items-center gap-2 justify-center bg-muted/50 py-1 px-3 rounded-full">
                  <span className="text-xs font-mono text-muted-foreground">
                    {truncateAddress(address)}
                  </span>
                  <Button variant="ghost" size="icon" className="h-4 w-4" onClick={copyAddress}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div className="p-4 bg-muted/30 rounded-xl border border-border/50 w-full">
                <p className="text-sm text-muted-foreground">
                  This user hasn&apos;t created a profile yet.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-6">
              {/* Avatar & Name */}
              <div className="flex flex-col items-center text-center w-full">
                <Avatar className="h-24 w-24 border-4 border-background shadow-xl mb-3">
                  <AvatarImage
                    src={profile.avatarUrl || undefined}
                    alt={profile.displayName}
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-purple-600 text-white text-2xl">
                    {getInitials(profile.displayName)}
                  </AvatarFallback>
                </Avatar>
                
                <h3 className="text-2xl font-bold">{profile.displayName}</h3>
                <div className="mt-2">{getUserTypeBadge(profile.userType)}</div>
                
                <div className="flex items-center gap-2 mt-3 bg-muted/50 py-1 px-3 rounded-full hover:bg-muted transition-colors">
                  <span className="text-xs font-mono text-muted-foreground">
                    {truncateAddress(address)}
                  </span>
                  <Button variant="ghost" size="icon" className="h-4 w-4 text-muted-foreground hover:text-foreground" onClick={copyAddress}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* Bio */}
              {profile.bio && (
                <div className="w-full text-center px-4">
                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                    {profile.bio}
                  </p>
                </div>
              )}

              <Separator className="bg-border/50" />

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3 w-full">
                <div className="flex flex-col items-center p-3 bg-muted/30 rounded-xl border border-border/50 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <FileText className="h-3 w-3" />
                    <span className="text-xs font-medium">Tasks</span>
                  </div>
                  <span className="text-lg font-bold">{profile.tasksCreated}</span>
                </div>

                <div className="flex flex-col items-center p-3 bg-muted/30 rounded-xl border border-border/50 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <CheckCircle className="h-3 w-3" />
                    <span className="text-xs font-medium">Submissions</span>
                  </div>
                  <span className="text-lg font-bold">{profile.submissionsCount}</span>
                </div>

                <div className="flex flex-col items-center p-3 bg-muted/30 rounded-xl border border-border/50 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Star className="h-3 w-3 text-yellow-500" />
                    <span className="text-xs font-medium">Reputation</span>
                  </div>
                  <span className="text-lg font-bold text-yellow-500">{profile.reputationScore}</span>
                </div>

                <div className="flex flex-col items-center p-3 bg-muted/30 rounded-xl border border-border/50 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Calendar className="h-3 w-3" />
                    <span className="text-xs font-medium">Joined</span>
                  </div>
                  <span className="text-sm font-semibold">
                    {new Date(parseInt(profile.createdAt)).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
