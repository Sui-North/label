"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCurrentAccount, useDisconnectWallet } from "@mysten/dapp-kit";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { useUserProfile } from "@/hooks/use-user-profile";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Tag,
  Briefcase,
  Trophy,
  LogIn,
  User,
  Settings,
  LogOut,
  Menu,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";

export function Navbar() {
  const router = useRouter();
  const account = useCurrentAccount();
  const { data: profile, isLoading } = useUserProfile();
  const { mutate: disconnect } = useDisconnectWallet();

  const displayName = profile?.displayName || "";
  const avatarUrl = profile?.avatarUrl || "";

  const handleSignOut = () => {
    disconnect();
    router.push("/");
  };

  // Debug logging
  React.useEffect(() => {
    if (profile) {
      console.log("Navbar - Profile loaded:", {
        displayName: profile.displayName,
        avatarUrl: profile.avatarUrl,
      });
    }
  }, [profile]);

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto max-w-7xl flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="flex items-center gap-2"
          >
            {/* Vertical logo for small screens */}
            <Image
              src="/sl-logo-vertical.png"
              alt="Songsim Label"
              width={120}
              height={40}
              className="md:hidden"
              priority
              unoptimized
            />
            {/* Horizontal logo for larger screens */}
            <Image
              src="/sl-logo-horizontal.png"
              alt="Songsim Label"
              width={160}
              height={40}
              className="hidden md:block"
              priority
              unoptimized
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            <Button variant="ghost" asChild>
              <Link href="/tasks">
                <Briefcase className="h-4 w-4 mr-2" />
                Browse Tasks
              </Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/leaderboard">
                <Trophy className="h-4 w-4 mr-2" />
                Leaderboard
              </Link>
            </Button>
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden flex items-center">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <div className="flex flex-col gap-4 mt-8">
                  <Link
                    href="/"
                    className="flex items-center gap-2 mb-4"
                  >
                    <Image
                      src="/sl-logo-vertical.png"
                      alt="Songsim Label"
                      width={160}
                      height={40}
                      priority
                      unoptimized
                    />
                  </Link>
                  <Button variant="ghost" asChild className="justify-start">
                    <Link href="/tasks">
                      <Briefcase className="h-4 w-4 mr-2" />
                      Browse Tasks
                    </Link>
                  </Button>
                  <Button variant="ghost" asChild className="justify-start">
                    <Link href="/leaderboard">
                      <Trophy className="h-4 w-4 mr-2" />
                      Leaderboard
                    </Link>
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />

          {account ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-10 w-10 rounded-full"
                >
                  <Avatar className="h-10 w-10">
                    {avatarUrl && (
                      <AvatarImage
                        src={avatarUrl}
                        alt={displayName || "User"}
                        onError={(e) => {
                          console.error("Avatar load error:", avatarUrl);
                          e.currentTarget.style.display = "none";
                        }}
                        crossOrigin="anonymous"
                      />
                    )}
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {displayName
                        ? displayName.slice(0, 2).toUpperCase()
                        : account.address.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">
                      {displayName || "My Account"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {account.address.slice(0, 8)}...
                      {account.address.slice(-6)}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard">
                    <User className="mr-2 h-4 w-4" />
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/profile">
                    <User className="mr-2 h-4 w-4" />
                    My Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive cursor-pointer"
                  onClick={handleSignOut}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild>
              <Link href="/auth">
                <LogIn className="mr-2 h-4 w-4" />
                Sign In
              </Link>
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
