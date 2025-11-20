"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCurrentAccount, useDisconnectWallet } from "@mysten/dapp-kit";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUserProfile } from "@/hooks/use-user-profile";
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
} from "lucide-react";

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
  const account = useCurrentAccount();
  const { data: profile, isLoading, isError } = useUserProfile();
  const [userRole, setUserRole] = useState<UserRole>("both");
  const [hasCheckedProfile, setHasCheckedProfile] = useState(false);

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
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400";
      case "labeler":
        return "bg-green-500/10 text-green-600 dark:text-green-400";
      case "both":
        return "bg-purple-500/10 text-purple-600 dark:text-purple-400";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-muted/40 hidden md:block">
        <div className="flex h-full flex-col">
          {/* User Profile Section */}
          <div className="p-6 border-b">
            <div className="flex items-center gap-3 mb-3">
              <Avatar className="h-10 w-10">
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
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {profile?.displayName
                    ? profile.displayName.slice(0, 2).toUpperCase()
                    : account?.address.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {profile?.displayName ||
                    `${account?.address.slice(0, 6)}...${account?.address.slice(
                      -4
                    )}`}
                </p>
                <p className="text-xs text-muted-foreground">Connected</p>
              </div>
            </div>
            <div
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getRoleBadgeColor(
                userRole
              )}`}
            >
              {getRoleLabel(userRole)}
            </div>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 py-4">
            <nav className="space-y-1 px-3">
              {filteredNavItems.map((item) => (
                <Button
                  key={item.href}
                  variant="ghost"
                  asChild
                  className="w-full justify-start"
                >
                  <Link href={item.href}>
                    {item.icon}
                    <span className="ml-2">{item.title}</span>
                  </Link>
                </Button>
              ))}
            </nav>
          </ScrollArea>

          {/* Bottom Actions */}
          <div className="p-3 border-t space-y-1">
            {userRole === "both" && (
              <Button variant="ghost" className="w-full justify-start" asChild>
                <Link href="/settings">
                  <Settings className="h-5 w-5" />
                  <span className="ml-2">Settings</span>
                </Link>
              </Button>
            )}
            <Button
              variant="ghost"
              className="w-full justify-start text-destructive hover:text-destructive"
              onClick={handleSignOut}
            >
              <LogOut className="h-5 w-5" />
              <span className="ml-2">Sign Out</span>
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
