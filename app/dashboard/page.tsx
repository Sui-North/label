"use client";

import { Suspense, useMemo } from "react";
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
  Line,
  LineChart,
  Pie,
  PieChart,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
} from "recharts";

function DashboardContent() {
  const account = useCurrentAccount();
  const { data: profile, isLoading: profileLoading } = useUserProfile();

  const { data: tasks, isLoading: tasksLoading } = useAllTasks();
  const { data: submissions, isLoading: submissionsLoading } =
    useAllSubmissions();

  const isLoading = tasksLoading || submissionsLoading || profileLoading;

  // Determine user role from profile (1=requester, 2=labeler, 3=both)
  const userRole = profile?.userType || 3; // Default to "both"
  const showRequesterStats = userRole === 1 || userRole === 3;
  const showLabelerStats = userRole === 2 || userRole === 3;

  // Calculate requester stats from blockchain
  const requesterStats = useMemo(() => {
    if (!tasks || !account?.address) return null;

    const myTasks = tasks.filter((t) => t.requester === account.address);
    const activeTasks = myTasks.filter((t) => t.status === "0" || t.status === "1"); // Open or In Progress
    const completedTasks = myTasks.filter((t) => t.status === "2");
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
    const active = requesterStats.myTasks.filter(
      (t) => t.status === "0"
    ).length;
    const completed = requesterStats.myTasks.filter(
      (t) => t.status === "1"
    ).length;
    const cancelled = requesterStats.myTasks.filter(
      (t) => t.status === "2"
    ).length;

    return [
      { name: "Active", value: active, fill: "hsl(var(--chart-1))" },
      { name: "Completed", value: completed, fill: "hsl(var(--chart-2))" },
      { name: "Cancelled", value: cancelled, fill: "hsl(var(--chart-3))" },
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
    <div className="container mx-auto p-6 max-w-7xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back{profile?.displayName ? `, ${profile.displayName}` : ""}!
          {userRole === 1 &&
            " Manage your labeling tasks and track your project progress."}
          {userRole === 2 && " Browse available tasks and track your earnings."}
          {userRole === 3 &&
            " Manage your tasks and submissions on the blockchain."}
        </p>
      </div>

      {/* Activity Timeline Chart */}
      {(showRequesterStats || showLabelerStats) && activityData.length > 0 && (
        <Card>
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
              <AreaChart data={activityData}>
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
                      stopOpacity={0.1}
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
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                  tickLine={{ stroke: "hsl(var(--muted-foreground))" }}
                />
                <YAxis
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                  tickLine={{ stroke: "hsl(var(--muted-foreground))" }}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                {showRequesterStats && (
                  <Area
                    type="monotone"
                    dataKey="tasks"
                    stroke="hsl(var(--chart-1))"
                    fillOpacity={1}
                    fill="url(#fillTasks)"
                    strokeWidth={2}
                  />
                )}
                {showLabelerStats && (
                  <Area
                    type="monotone"
                    dataKey="submissions"
                    stroke="hsl(var(--chart-2))"
                    fillOpacity={1}
                    fill="url(#fillSubmissions)"
                    strokeWidth={2}
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
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold">Task Management</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Manage and track your labeling tasks
              </p>
            </div>
            <Button asChild>
              <Link href="/dashboard/create-task">
                <Plus className="h-4 w-4 mr-2" />
                Create New Task
              </Link>
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Tasks
                </CardTitle>
                <Clock className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {requesterStats.activeTasks}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Currently in progress
                </p>
                <div className="mt-2 flex items-center text-xs">
                  <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                  <span className="text-green-600">Live on blockchain</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Completed Tasks
                </CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {requesterStats.completedTasks}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Successfully finished
                </p>
                <div className="mt-2 flex items-center text-xs">
                  <span className="text-muted-foreground">
                    {requesterStats.myTasks.length} total tasks
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Spent
                </CardTitle>
                <DollarSign className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">
                  {requesterStats.totalSpent}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  SUI on all tasks
                </p>
                <div className="mt-2 flex items-center text-xs">
                  <span className="text-muted-foreground">
                    ≈ $
                    {(parseFloat(requesterStats.totalSpent) * 2.5).toFixed(2)}{" "}
                    USD
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Avg Quality
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {requesterStats.avgQuality}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Submission acceptance rate
                </p>
                <div className="mt-2 flex items-center text-xs">
                  {requesterStats.avgQuality >= 80 ? (
                    <>
                      <ArrowUpRight className="h-3 w-3 text-green-600 mr-1" />
                      <span className="text-green-600">Excellent</span>
                    </>
                  ) : (
                    <>
                      <ArrowDownRight className="h-3 w-3 text-orange-600 mr-1" />
                      <span className="text-orange-600">Needs improvement</span>
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
              <Card>
                <CardHeader>
                  <CardTitle>Task Status Distribution</CardTitle>
                  <CardDescription>
                    Breakdown of your task statuses
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      active: { label: "Active", color: "hsl(var(--chart-1))" },
                      completed: {
                        label: "Completed",
                        color: "hsl(var(--chart-2))",
                      },
                      cancelled: {
                        label: "Cancelled",
                        color: "hsl(var(--chart-3))",
                      },
                    }}
                    className="h-[250px] w-full"
                  >
                    <PieChart>
                      <Pie
                        data={taskStatusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name} ${(percent * 100).toFixed(0)}%`
                        }
                        outerRadius={80}
                        dataKey="value"
                      >
                        {taskStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            )}

            {/* Recent Tasks */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Tasks</CardTitle>
                <CardDescription>Your latest created tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {requesterStats.recentTasks.length > 0 ? (
                    requesterStats.recentTasks.map((task) => (
                      <div
                        key={task.objectId}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{task.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge
                              variant={
                                task.status === "0"
                                  ? "default"
                                  : task.status === "1"
                                  ? "secondary"
                                  : "destructive"
                              }
                              className="text-xs"
                            >
                              {task.status === "0"
                                ? "Active"
                                : task.status === "1"
                                ? "Completed"
                                : "Cancelled"}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {(Number(task.bounty) / 1_000_000_000).toFixed(2)}{" "}
                              SUI
                            </span>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/tasks/${task.objectId}`}>
                            <ArrowUpRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No tasks created yet</p>
                      <Button asChild className="mt-3" size="sm">
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
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold">Labeling Activity</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Track your submissions and earnings
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href="/dashboard/available">
                <Briefcase className="h-4 w-4 mr-2" />
                Browse Available Tasks
              </Link>
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Tasks Completed
                </CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {labelerStats.tasksCompleted}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Accepted submissions
                </p>
                <div className="mt-2 flex items-center text-xs">
                  <span className="text-muted-foreground">
                    {labelerStats.mySubmissions.length} total submissions
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-yellow-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Pending Review
                </CardTitle>
                <Clock className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {labelerStats.pendingSubmissions}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Awaiting approval
                </p>
                <div className="mt-2 flex items-center text-xs">
                  <span className="text-yellow-600">Under review</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Earned
                </CardTitle>
                <DollarSign className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {labelerStats.totalEarned}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  SUI from tasks
                </p>
                <div className="mt-2 flex items-center text-xs">
                  <span className="text-muted-foreground">
                    ≈ ${(parseFloat(labelerStats.totalEarned) * 2.5).toFixed(2)}{" "}
                    USD
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Reputation
                </CardTitle>
                <Award className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">
                  {labelerStats.reputationScore}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Score • {labelerStats.accuracy}% accuracy
                </p>
                <div className="mt-2 flex items-center text-xs">
                  {labelerStats.accuracy >= 80 ? (
                    <>
                      <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                      <span className="text-green-600">High quality</span>
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
              <Card>
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
                    <BarChart data={submissionStatusData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="stroke-muted"
                      />
                      <XAxis
                        dataKey="name"
                        tick={{ fill: "hsl(var(--muted-foreground))" }}
                        tickLine={{ stroke: "hsl(var(--muted-foreground))" }}
                      />
                      <YAxis
                        tick={{ fill: "hsl(var(--muted-foreground))" }}
                        tickLine={{ stroke: "hsl(var(--muted-foreground))" }}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
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
            <Card>
              <CardHeader>
                <CardTitle>Recent Submissions</CardTitle>
                <CardDescription>
                  Your latest submission activity
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {labelerStats.recentSubmissions.length > 0 ? (
                    labelerStats.recentSubmissions.map((submission) => {
                      const task = tasks?.find(
                        (t) => t.objectId === submission.objectId
                      );
                      return (
                        <div
                          key={submission.submissionId}
                          className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {task?.title || "Unknown Task"}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge
                                variant={
                                  submission.status === "0"
                                    ? "secondary"
                                    : submission.status === "1"
                                    ? "default"
                                    : "destructive"
                                }
                                className="text-xs"
                              >
                                {submission.status === "0"
                                  ? "Pending"
                                  : submission.status === "1"
                                  ? "Accepted"
                                  : "Rejected"}
                              </Badge>
                              {task && (
                                <span className="text-xs text-muted-foreground">
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
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/tasks/${submission.objectId}`}>
                              <ArrowUpRight className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Briefcase className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No submissions yet</p>
                      <Button asChild className="mt-3" size="sm">
                        <Link href="/dashboard/available">
                          Browse Available Tasks
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

      {/* Empty State */}
      {!requesterStats && !labelerStats && (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Data Available</h3>
            <p className="text-muted-foreground mb-4">
              Connect your wallet to view your dashboard statistics
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
