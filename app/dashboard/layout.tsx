"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useCurrentAccount, useDisconnectWallet } from "@mysten/dapp-kit";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUserProfile } from "@/hooks/use-user-profile";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  Trophy,
  Settings,
  LogOut,
  Plus,
  CheckSquare,
  BarChart3,
  Users,
  UserCircle,
  Shield,
  Star,
  ChevronRight,
  Menu,
  Coins,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

type UserRole = "requester" | "labeler" | "both";

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  roles: UserRole[]; // Which roles can see this nav item
}

const NAV_ITEMS: NavItem[] = [
  {
    title: "Overview",
    href: "/dashboard",
    icon: <LayoutDashboard className="h-5 w-5" />,
    roles: ["requester", "labeler", "both"],
  },
  {
    title: "Profile",
    href: "/dashboard/profile",
    icon: <UserCircle className="h-5 w-5" />,
    roles: ["requester", "labeler", "both"],
  },
  {
    title: "Wallet",
    href: "/dashboard/wallet",
    icon: <Coins className="h-5 w-5" />,
    roles: ["requester", "labeler", "both"],
  },
  {
    title: "Staking",
    href: "/dashboard/staking",
    icon: <Shield className="h-5 w-5" />,
    roles: ["labeler", "both"],
  },
  {
    title: "Quality",
    href: "/dashboard/quality",
    icon: <Star className="h-5 w-5" />,
    roles: ["labeler", "both"],
  },
  {
    title: "My Tasks",
    href: "/dashboard/tasks",
    icon: <Briefcase className="h-5 w-5" />,
    roles: ["requester", "both"],
  },
  {
    title: "Create Task",
    href: "/dashboard/create-task",
    icon: <Plus className="h-5 w-5" />,
    roles: ["requester", "both"],
  },
  {
    title: "Available Tasks",
    href: "/dashboard/available",
    icon: <CheckSquare className="h-5 w-5" />,
    roles: ["labeler", "both"],
  },
  {
    title: "My Submissions",
    href: "/dashboard/submissions",
    icon: <FileText className="h-5 w-5" />,
    roles: ["labeler", "both"],
  },
  {
    title: "Analytics",
    href: "/dashboard/analytics",
    icon: <BarChart3 className="h-5 w-5" />,
    roles: ["requester", "labeler", "both"],
  },
  {
    title: "Leaderboard",
    href: "/leaderboard",
    icon: <Trophy className="h-5 w-5" />,
    roles: ["requester", "labeler", "both"],
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const account = useCurrentAccount();
  const { data: profile, isLoading, isError } = useUserProfile();
  const [userRole, setUserRole] = useState<UserRole>("both");
  const [hasCheckedProfile, setHasCheckedProfile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!account) {
      router.push("/auth");
      return;
    }
  }, [account, router]);

  useEffect(() => {
    // Only redirect after we've actually loaded and confirmed no profile
    if (isLoading) {
      setHasCheckedProfile(false);
      return;
    }

    setHasCheckedProfile(true);

    // Only redirect if we've confirmed there's an error or no profile after loading
    if (!isLoading && (isError || !profile)) {
      // Add a small delay to prevent race condition with auth page
      const timer = setTimeout(() => {
        console.log("No profile found after loading, redirecting to auth");
        router.replace("/auth");
      }, 100);
      return () => clearTimeout(timer);
    }

    // Map user_type to role
    if (profile) {
      const userType = profile.userType;
      if (userType === 1) {
        setUserRole("requester");
      } else if (userType === 2) {
        setUserRole("labeler");
      } else if (userType === 3) {
        setUserRole("both");
      } else {
        setUserRole("both");
      }
    }
  }, [profile, isLoading, isError, router]);

  const { mutate: disconnect } = useDisconnectWallet();

  const handleSignOut = () => {
    // Disconnect wallet and redirect to home
    disconnect();
    router.push("/");
  };

  const filteredNavItems = NAV_ITEMS.filter((item) =>
    item.roles.includes(userRole)
  );

  const getRoleLabel = (role: UserRole): string => {
    switch (role) {
      case "requester":
        return "Task Requester";
      case "labeler":
        return "Labeler";
      case "both":
        return "Requester & Labeler";
    }
  };

  const getRoleBadgeColor = (role: UserRole): string => {
    switch (role) {
      case "requester":
        return "bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-800";
      case "labeler":
        return "bg-green-500/10 text-green-600 border-green-200 dark:border-green-800";
      case "both":
        return "bg-purple-500/10 text-purple-600 border-purple-200 dark:border-purple-800";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-muted/10">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 border-b bg-background/80 backdrop-blur-xl z-30 flex items-center justify-between px-4">
        <div className="flex items-center gap-2 font-bold text-lg bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Songsim Label
        </div>
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72">
            <div className="flex flex-col h-full bg-background/95 backdrop-blur-xl">
              {/* User Profile Section */}
              <div className="p-6 border-b border-border/50 shrink-0">
                <div className="flex items-center gap-4 mb-4">
                  <Avatar className="h-12 w-12 ring-2 ring-primary/20">
                    {profile?.avatarUrl && (
                      <AvatarImage
                        src={profile.avatarUrl}
                        alt={profile.displayName || "User"}
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                        crossOrigin="anonymous"
                      />
                    )}
                    <AvatarFallback className="bg-primary/10 text-primary font-bold">
                      {profile?.displayName
                        ? profile.displayName.slice(0, 2).toUpperCase()
                        : account?.address.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-semibold truncate">
                      {profile?.displayName ||
                        `${account?.address.slice(0, 6)}...${account?.address.slice(
                          -4
                        )}`}
                    </p>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <div className="h-1.5 w-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse" />
                      Connected
                    </div>
                  </div>
                </div>
                <div
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border ${getRoleBadgeColor(
                    userRole
                  )}`}
                >
                  {getRoleLabel(userRole)}
                </div>
              </div>

              {/* Navigation */}
              <div className="flex-1 overflow-y-auto py-4 px-4">
                <nav className="space-y-1.5">
                  {filteredNavItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          "flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group",
                          isActive
                            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <div className="flex items-center">
                          <span className={cn("mr-3 transition-colors", isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary")}>
                            {item.icon}
                          </span>
                          {item.title}
                        </div>
                        {isActive && <ChevronRight className="h-4 w-4 opacity-50" />}
                      </Link>
                    );
                  })}
                </nav>
              </div>

              {/* Bottom Actions */}
              <div className="p-4 border-t border-border/50 bg-muted/5 space-y-2 shrink-0">
                <div className="flex items-center justify-between px-2 mb-2">
                  <span className="text-xs text-muted-foreground font-medium">Theme</span>
                  <ThemeToggle />
                </div>
                
                {userRole === "both" && (
                  <Button variant="ghost" className="w-full justify-start hover:bg-background" asChild>
                    <Link href="/settings">
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </Link>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Sidebar */}
      <aside className="w-72 border-r bg-background/80 backdrop-blur-xl hidden md:flex flex-col z-20 shadow-xl shadow-primary/5">
        {/* User Profile Section */}
        <div className="p-6 border-b border-border/50 shrink-0">
          <div className="flex items-center gap-4 mb-4">
            <Avatar className="h-12 w-12 ring-2 ring-primary/20">
              {profile?.avatarUrl && (
                <AvatarImage
                  src={profile.avatarUrl}
                  alt={profile.displayName || "User"}
                  onError={(e) => {
                    console.error(
                      "Dashboard avatar load error:",
                      profile.avatarUrl
                    );
                    e.currentTarget.style.display = "none";
                  }}
                  crossOrigin="anonymous"
                />
              )}
              <AvatarFallback className="bg-primary/10 text-primary font-bold">
                {profile?.displayName
                  ? profile.displayName.slice(0, 2).toUpperCase()
                  : account?.address.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-base font-semibold truncate">
                {profile?.displayName ||
                  `${account?.address.slice(0, 6)}...${account?.address.slice(
                    -4
                  )}`}
              </p>
              <div className="flex items-center text-xs text-muted-foreground">
                <div className="h-1.5 w-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse" />
                Connected
              </div>
            </div>
          </div>
          <div
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border ${getRoleBadgeColor(
              userRole
            )}`}
          >
            {getRoleLabel(userRole)}
          </div>
        </div>

        {/* Navigation - Scrollable Area */}
        <div className="flex-1 overflow-y-auto py-4 px-4">
          <nav className="space-y-1.5">
            {filteredNavItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <div className="flex items-center">
                    <span className={cn("mr-3 transition-colors", isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary")}>
                      {item.icon}
                    </span>
                    {item.title}
                  </div>
                  {isActive && <ChevronRight className="h-4 w-4 opacity-50" />}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Actions - Fixed at bottom */}
        <div className="p-4 border-t border-border/50 bg-muted/5 space-y-2 shrink-0">
          <div className="flex items-center justify-between px-2 mb-2">
            <span className="text-xs text-muted-foreground font-medium">Theme</span>
            <ThemeToggle />
          </div>
          
          {userRole === "both" && (
            <Button variant="ghost" className="w-full justify-start hover:bg-background" asChild>
              <Link href="/settings">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Link>
            </Button>
          )}
          <Button
            variant="ghost"
            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto relative pt-16 md:pt-0">
        {/* Background decoration */}
        <div className="absolute top-0 left-0 w-full h-64 bg-linear-to-b from-primary/5 to-transparent pointer-events-none -z-10" />
        
        <div className="container mx-auto p-6 md:p-8 max-w-7xl">
          {children}
        </div>
      </main>
    </div>
  );
}
