"use client";

import { Suspense, useMemo, useEffect, useState } from "react";
import { useTheme } from "next-themes";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  Briefcase,
  CheckCircle2,
  Clock,
  DollarSign,
  Plus,
  TrendingUp,
  Award,
  Target,
  Loader2,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { useAllTasks } from "@/hooks/use-tasks";
import { useAllSubmissions } from "@/hooks/use-submissions";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { useUserProfile } from "@/hooks/use-user-profile";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Pie,
  PieChart,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

function DashboardContent() {
  const account = useCurrentAccount();
  const { data: profile, isLoading: profileLoading } = useUserProfile();

  const { data: tasks, isLoading: tasksLoading } = useAllTasks();
  const { data: submissions, isLoading: submissionsLoading } =
    useAllSubmissions();

  const isLoading = tasksLoading || submissionsLoading || profileLoading;
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Determine user role from profile (1=requester, 2=labeler, 3=both)
  const userRole = profile?.userType || 3; // Default to "both"
  const showRequesterStats = userRole === 1 || userRole === 3;
  const showLabelerStats = userRole === 2 || userRole === 3;

  // Calculate requester stats from blockchain
  const requesterStats = useMemo(() => {
    if (!tasks || !account?.address) return null;

    const myTasks = tasks.filter((t) => t.requester === account.address);
    const activeTasks = myTasks.filter((t) => t.status === "0" || t.status === "1"); // 0=OPEN, 1=IN_PROGRESS
    const completedTasks = myTasks.filter((t) => t.status === "2"); // 2=COMPLETED
    const totalSpent = myTasks.reduce((sum, t) => sum + Number(t.bounty), 0);
    const totalSpentSUI = (totalSpent / 1_000_000_000).toFixed(2);

    // Calculate average quality from submissions
    const myTaskIds = new Set(myTasks.map((t) => t.objectId));
    const mySubmissions =
      submissions?.filter((s) => myTaskIds.has(s.objectId)) || [];
    const acceptedSubmissions = mySubmissions.filter((s) => s.status === "1");
    const avgQuality =
      mySubmissions.length > 0
        ? Math.round((acceptedSubmissions.length / mySubmissions.length) * 100)
        : 0;

    return {
      activeTasks: activeTasks.length,
      completedTasks: completedTasks.length,
      totalSpent: totalSpentSUI,
      avgQuality,
      myTasks,
      recentTasks: myTasks.slice(0, 5),
    };
  }, [tasks, submissions, account]);

  // Calculate labeler stats from blockchain
  const labelerStats = useMemo(() => {
    if (!submissions || !tasks || !account?.address) return null;

    const mySubmissions = submissions.filter(
      (s) => s.labeler === account.address
    );
    const pendingSubmissions = mySubmissions.filter((s) => s.status === "0");
    const acceptedSubmissions = mySubmissions.filter((s) => s.status === "1");

    // Calculate total earned from accepted submissions
    let totalEarned = BigInt(0);
    acceptedSubmissions.forEach((submission) => {
      const task = tasks.find((t) => t.objectId === submission.objectId);
      if (task) {
        totalEarned += BigInt(task.bounty) / BigInt(task.requiredLabelers);
      }
    });
    const totalEarnedSUI = (Number(totalEarned) / 1_000_000_000).toFixed(2);

    // Calculate reputation score (simplified)
    const accuracy =
      mySubmissions.length > 0
        ? (acceptedSubmissions.length / mySubmissions.length) * 100
        : 0;
    const reputationScore = Math.round(acceptedSubmissions.length * accuracy);

    return {
      tasksCompleted: acceptedSubmissions.length,
      pendingSubmissions: pendingSubmissions.length,
      totalEarned: totalEarnedSUI,
      reputationScore,
      accuracy: Math.round(accuracy * 10) / 10,
      mySubmissions,
      recentSubmissions: mySubmissions.slice(0, 5),
    };
  }, [submissions, tasks, account]);

  // Prepare chart data
  const taskStatusData = useMemo(() => {
    if (!requesterStats?.myTasks) return [];
    const open = requesterStats.myTasks.filter(
      (t) => t.status === "0"
    ).length;
    const inProgress = requesterStats.myTasks.filter(
      (t) => t.status === "1"
    ).length;
    const completed = requesterStats.myTasks.filter(
      (t) => t.status === "2"
    ).length;
    const cancelled = requesterStats.myTasks.filter(
      (t) => t.status === "3"
    ).length;

    return [
      { name: "Open", value: open, fill: "hsl(var(--chart-1))" },
      { name: "In Progress", value: inProgress, fill: "hsl(var(--chart-2))" },
      { name: "Completed", value: completed, fill: "hsl(var(--chart-3))" },
      { name: "Cancelled", value: cancelled, fill: "hsl(var(--chart-4))" },
    ].filter((item) => item.value > 0);
  }, [requesterStats]);

  const submissionStatusData = useMemo(() => {
    if (!labelerStats?.mySubmissions) return [];
    const pending = labelerStats.mySubmissions.filter(
      (s) => s.status === "0"
    ).length;
    const accepted = labelerStats.mySubmissions.filter(
      (s) => s.status === "1"
    ).length;
    const rejected = labelerStats.mySubmissions.filter(
      (s) => s.status === "2"
    ).length;

    return [
      { name: "Pending", value: pending, fill: "hsl(var(--chart-4))" },
      { name: "Accepted", value: accepted, fill: "hsl(var(--chart-5))" },
      { name: "Rejected", value: rejected, fill: "hsl(var(--chart-6))" },
    ].filter((item) => item.value > 0);
  }, [labelerStats]);

  // Activity timeline data (last 7 days)
  const activityData = useMemo(() => {
    if (!tasks && !submissions) return [];

    const days = 7;
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;

    return Array.from({ length: days }, (_, i) => {
      const date = new Date(now - (days - 1 - i) * dayMs);
      const dateStr = date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });

      const tasksCreated =
        requesterStats?.myTasks.filter((t) => {
          const taskDate = new Date(Number(t.createdAt));
          return taskDate.toDateString() === date.toDateString();
        }).length || 0;

      const submissionsMade =
        labelerStats?.mySubmissions.filter((s) => {
          const subDate = new Date(Number(s.submittedAt));
          return subDate.toDateString() === date.toDateString();
        }).length || 0;

      return {
        date: dateStr,
        tasks: tasksCreated,
        submissions: submissionsMade,
      };
    });
  }, [tasks, submissions, requesterStats, labelerStats]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">
          Loading dashboard data...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back{profile?.displayName ? `, ${profile.displayName}` : ""}!
            {userRole === 1 &&
              " Manage your labeling tasks and track your project progress."}
            {userRole === 2 && " Browse available tasks and track your earnings."}
            {userRole === 3 &&
              " Manage your tasks and submissions on the blockchain."}
          </p>
        </div>
        <div className="flex gap-2">
           {showRequesterStats && (
             <Button asChild className="shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all">
              <Link href="/dashboard/create-task">
                <Plus className="h-4 w-4 mr-2" />
                Create New Task
              </Link>
            </Button>
           )}
           {showLabelerStats && (
             <Button asChild variant="outline" className="hover:bg-accent">
              <Link href="/dashboard/available">
                <Briefcase className="h-4 w-4 mr-2" />
                Find Work
              </Link>
            </Button>
           )}
        </div>
      </div>

      {/* Activity Timeline Chart */}
      {(showRequesterStats || showLabelerStats) && activityData.length > 0 && (
        <Card className="glass-card border-primary/10 overflow-hidden">
          <CardHeader>
            <CardTitle>Activity Timeline</CardTitle>
            <CardDescription>
              Your activity over the last 7 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                tasks: {
                  label: "Tasks Created",
                  color: "hsl(var(--chart-1))",
                },
                submissions: {
                  label: "Submissions Made",
                  color: "hsl(var(--chart-2))",
                },
              }}
              className="h-[300px] w-full"
            >
              <AreaChart key={theme} data={activityData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="fillTasks" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="hsl(var(--chart-1))"
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor="hsl(var(--chart-1))"
                      stopOpacity={0.3}
                    />
                  </linearGradient>
                  <linearGradient
                    id="fillSubmissions"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="hsl(var(--chart-2))"
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor="hsl(var(--chart-2))"
                      stopOpacity={0.3}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted-foreground/20" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                />
                <YAxis
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={false}
                  dx={-10}
                />
                <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                {showRequesterStats && (
                  <Area
                    type="monotone"
                    dataKey="tasks"
                    stroke="hsl(var(--chart-1))"
                    fillOpacity={1}
                    fill="url(#fillTasks)"
                    strokeWidth={3}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                )}
                {showLabelerStats && (
                  <Area
                    type="monotone"
                    dataKey="submissions"
                    stroke="hsl(var(--chart-2))"
                    fillOpacity={1}
                    fill="url(#fillSubmissions)"
                    strokeWidth={3}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                )}
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {/* Requester Stats */}
      {showRequesterStats && requesterStats && (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
             <div className="h-8 w-1 bg-blue-500 rounded-full" />
             <h2 className="text-xl font-semibold">Requester Overview</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="glass-card hover:border-blue-500/50 transition-all duration-300 group">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-blue-500 transition-colors">
                  Active Tasks
                </CardTitle>
                <div className="p-2 bg-blue-500/10 rounded-full group-hover:bg-blue-500/20 transition-colors">
                  <Clock className="h-4 w-4 text-blue-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {requesterStats.activeTasks}
                </div>
                <div className="mt-2 flex items-center text-xs">
                  <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                  <span className="text-green-500 font-medium">Live on blockchain</span>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card hover:border-green-500/50 transition-all duration-300 group">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-green-500 transition-colors">
                  Completed Tasks
                </CardTitle>
                <div className="p-2 bg-green-500/10 rounded-full group-hover:bg-green-500/20 transition-colors">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {requesterStats.completedTasks}
                </div>
                <div className="mt-2 flex items-center text-xs">
                  <span className="text-muted-foreground">
                    {requesterStats.myTasks.length} total created
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card hover:border-purple-500/50 transition-all duration-300 group">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-purple-500 transition-colors">
                  Total Spent
                </CardTitle>
                <div className="p-2 bg-purple-500/10 rounded-full group-hover:bg-purple-500/20 transition-colors">
                  <DollarSign className="h-4 w-4 text-purple-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                  {requesterStats.totalSpent}
                </div>
                <div className="mt-2 flex items-center text-xs">
                  <span className="text-muted-foreground">
                    ≈ $
                    {(parseFloat(requesterStats.totalSpent) * 2.5).toFixed(2)}{" "}
                    USD
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card hover:border-orange-500/50 transition-all duration-300 group">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-orange-500 transition-colors">
                  Avg Quality
                </CardTitle>
                <div className="p-2 bg-orange-500/10 rounded-full group-hover:bg-orange-500/20 transition-colors">
                  <TrendingUp className="h-4 w-4 text-orange-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {requesterStats.avgQuality}%
                </div>
                <div className="mt-2 flex items-center text-xs">
                  {requesterStats.avgQuality >= 80 ? (
                    <>
                      <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
                      <span className="text-green-500 font-medium">Excellent</span>
                    </>
                  ) : (
                    <>
                      <ArrowDownRight className="h-3 w-3 text-orange-500 mr-1" />
                      <span className="text-orange-500 font-medium">Needs improvement</span>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Task Status Distribution */}
            {taskStatusData.length > 0 && (
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Task Status Distribution</CardTitle>
                  <CardDescription>
                    Breakdown of your task statuses
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      open: { label: "Open", color: "hsl(var(--chart-1))" },
                      inProgress: { label: "In Progress", color: "hsl(var(--chart-2))" },
                      completed: {
                        label: "Completed",
                        color: "hsl(var(--chart-3))",
                      },
                      cancelled: {
                        label: "Cancelled",
                        color: "hsl(var(--chart-4))",
                      },
                    }}
                    className="h-[250px] w-full"
                  >
                    <PieChart key={theme}>
                      <Pie
                        data={taskStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {taskStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} strokeWidth={0} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                      <text
                        x="50%"
                        y="50%"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="fill-foreground text-2xl font-bold"
                      >
                        {requesterStats.myTasks.length}
                      </text>
                      <text
                        x="50%"
                        y="50%"
                        dy={20}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="fill-muted-foreground text-xs"
                      >
                        Tasks
                      </text>
                    </PieChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            )}

            {/* Recent Tasks */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Recent Tasks</CardTitle>
                <CardDescription>Your latest created tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {requesterStats.recentTasks.length > 0 ? (
                    requesterStats.recentTasks.map((task) => (
                      <div
                        key={task.objectId}
                        className="flex items-center justify-between p-4 rounded-xl border bg-background/50 hover:bg-accent/50 transition-all hover:shadow-md group"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate group-hover:text-primary transition-colors">{task.title}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <Badge
                              variant={
                                task.status === "0" || task.status === "1"
                                  ? "default"
                                  : task.status === "2"
                                  ? "secondary"
                                  : "destructive"
                              }
                              className="text-[10px] px-2 py-0.5 h-5"
                            >
                              {task.status === "0"
                                ? "Open"
                                : task.status === "1"
                                ? "In Progress"
                                : task.status === "2"
                                ? "Completed"
                                : "Cancelled"}
                            </Badge>
                            <span className="text-xs text-muted-foreground font-mono">
                              {(Number(task.bounty) / 1_000_000_000).toFixed(2)}{" "}
                              SUI
                            </span>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" asChild>
                          <Link href={`/tasks/${task.objectId}`}>
                            <ArrowUpRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
                      <Target className="h-12 w-12 mx-auto mb-3 opacity-20" />
                      <p>No tasks created yet</p>
                      <Button asChild className="mt-4" size="sm" variant="outline">
                        <Link href="/dashboard/create-task">
                          Create Your First Task
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Labeler Stats */}
      {showLabelerStats && labelerStats && (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
             <div className="h-8 w-1 bg-green-500 rounded-full" />
             <h2 className="text-xl font-semibold">Labeler Overview</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="glass-card hover:border-green-500/50 transition-all duration-300 group">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-green-500 transition-colors">
                  Tasks Completed
                </CardTitle>
                <div className="p-2 bg-green-500/10 rounded-full group-hover:bg-green-500/20 transition-colors">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {labelerStats.tasksCompleted}
                </div>
                <div className="mt-2 flex items-center text-xs">
                  <span className="text-muted-foreground">
                    {labelerStats.mySubmissions.length} total submissions
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card hover:border-yellow-500/50 transition-all duration-300 group">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-yellow-500 transition-colors">
                  Pending Review
                </CardTitle>
                <div className="p-2 bg-yellow-500/10 rounded-full group-hover:bg-yellow-500/20 transition-colors">
                  <Clock className="h-4 w-4 text-yellow-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {labelerStats.pendingSubmissions}
                </div>
                <div className="mt-2 flex items-center text-xs">
                  <span className="text-yellow-600 dark:text-yellow-500 font-medium">Under review</span>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card hover:border-blue-500/50 transition-all duration-300 group">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-blue-500 transition-colors">
                  Total Earned
                </CardTitle>
                <div className="p-2 bg-blue-500/10 rounded-full group-hover:bg-blue-500/20 transition-colors">
                  <DollarSign className="h-4 w-4 text-blue-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {labelerStats.totalEarned}
                </div>
                <div className="mt-2 flex items-center text-xs">
                  <span className="text-muted-foreground">
                    ≈ ${(parseFloat(labelerStats.totalEarned) * 2.5).toFixed(2)}{" "}
                    USD
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card hover:border-purple-500/50 transition-all duration-300 group">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-purple-500 transition-colors">
                  Reputation
                </CardTitle>
                <div className="p-2 bg-purple-500/10 rounded-full group-hover:bg-purple-500/20 transition-colors">
                  <Award className="h-4 w-4 text-purple-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                  {labelerStats.reputationScore}
                </div>
                <div className="mt-2 flex items-center text-xs">
                  {labelerStats.accuracy >= 80 ? (
                    <>
                      <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                      <span className="text-green-500 font-medium">High quality</span>
                    </>
                  ) : (
                    <span className="text-muted-foreground">
                      Keep improving
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Submission Status Distribution */}
            {submissionStatusData.length > 0 && (
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Submission Status</CardTitle>
                  <CardDescription>
                    Distribution of your submissions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      pending: {
                        label: "Pending",
                        color: "hsl(var(--chart-4))",
                      },
                      accepted: {
                        label: "Accepted",
                        color: "hsl(var(--chart-5))",
                      },
                      rejected: {
                        label: "Rejected",
                        color: "hsl(var(--chart-6))",
                      },
                    }}
                    className="h-[250px] w-full"
                  >
                    <BarChart key={theme} data={submissionStatusData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="stroke-muted/20"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="name"
                        tick={{ fill: "hsl(var(--muted-foreground))" }}
                        tickLine={false}
                        axisLine={false}
                        dy={10}
                      />
                      <YAxis
                        tick={{ fill: "hsl(var(--muted-foreground))" }}
                        tickLine={false}
                        axisLine={false}
                        dx={-10}
                      />
                      <ChartTooltip content={<ChartTooltipContent cursor={{fill: 'transparent'}} />} />
                      <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                        {submissionStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            )}

            {/* Recent Submissions */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Recent Submissions</CardTitle>
                <CardDescription>
                  Your latest submission activity
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {labelerStats.recentSubmissions.length > 0 ? (
                    labelerStats.recentSubmissions.map((submission) => {
                      const task = tasks?.find(
                        (t) => t.objectId === submission.objectId
                      );
                      return (
                        <div
                          key={submission.submissionId}
                          className="flex items-center justify-between p-4 rounded-xl border bg-background/50 hover:bg-accent/50 transition-all hover:shadow-md group"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate group-hover:text-primary transition-colors">
                              {task?.title || "Unknown Task"}
                            </p>
                            <div className="flex items-center gap-2 mt-1.5">
                              <Badge
                                variant={
                                  submission.status === "0"
                                    ? "secondary"
                                    : submission.status === "1"
                                    ? "default"
                                    : "destructive"
                                }
                                className="text-[10px] px-2 py-0.5 h-5"
                              >
                                {submission.status === "0"
                                  ? "Pending"
                                  : submission.status === "1"
                                  ? "Accepted"
                                  : "Rejected"}
                              </Badge>
                              {task && (
                                <span className="text-xs text-muted-foreground font-mono">
                                  {(
                                    Number(task.bounty) /
                                    Number(task.requiredLabelers) /
                                    1_000_000_000
                                  ).toFixed(2)}{" "}
                                  SUI
                                </span>
                              )}
                            </div>
                          </div>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" asChild>
                            <Link href={`/tasks/${submission.objectId}`}>
                              <ArrowUpRight className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
                      <Briefcase className="h-12 w-12 mx-auto mb-3 opacity-20" />
                      <p>No submissions yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
