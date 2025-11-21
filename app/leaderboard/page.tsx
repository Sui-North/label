"use client";

import { useState, useMemo } from "react";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Trophy,
  TrendingUp,
  Award,
  Target,
  Loader2,
  AlertCircle,
  Crown,
  Medal,
  Star,
  Users,
  Zap,
} from "lucide-react";
import { useAllTasks } from "@/hooks/use-tasks";
import { useAllSubmissions } from "@/hooks/use-submissions";
import { UserDisplay } from "@/components/user-display";

interface LeaderboardEntry {
  rank: number;
  address: string;
  username: string;
  score: number;
  tasksCompleted: number;
  accuracy: number;
  totalEarned: string;
}

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState("labelers");
  const {
    data: tasks,
    isLoading: tasksLoading,
    error: tasksError,
  } = useAllTasks();
  const {
    data: submissions,
    isLoading: submissionsLoading,
    error: submissionsError,
  } = useAllSubmissions();

  // Calculate labeler leaderboard from submissions
  const labelerLeaderboard = useMemo(() => {
    if (!submissions || !tasks) return [];

    const labelerStats = new Map<
      string,
      {
        address: string;
        totalSubmissions: number;
        acceptedSubmissions: number;
        totalEarned: bigint;
      }
    >();

    // Aggregate submission stats per labeler
    submissions.forEach((submission) => {
      const existing = labelerStats.get(submission.labeler) || {
        address: submission.labeler,
        totalSubmissions: 0,
        acceptedSubmissions: 0,
        totalEarned: BigInt(0),
      };

      existing.totalSubmissions++;
      if (submission.status === "1") {
        // Accepted
        existing.acceptedSubmissions++;
        // Find corresponding task to get bounty - match by taskId
        const task = tasks.find((t) => t.taskId === submission.taskId);
        if (task) {
          existing.totalEarned +=
            BigInt(task.bounty) / BigInt(task.requiredLabelers);
        }
      }

      labelerStats.set(submission.labeler, existing);
    });

    // Convert to leaderboard entries and sort
    const entries: LeaderboardEntry[] = Array.from(labelerStats.values())
      .map((stats) => {
        const accuracy =
          stats.totalSubmissions > 0
            ? (stats.acceptedSubmissions / stats.totalSubmissions) * 100
            : 0;
        const score = Math.round(stats.acceptedSubmissions * accuracy);

        return {
          address: stats.address,
          username: `${stats.address.slice(0, 6)}...${stats.address.slice(-4)}`,
          tasksCompleted: stats.acceptedSubmissions,
          accuracy: Math.round(accuracy * 10) / 10,
          totalEarned: (Number(stats.totalEarned) / 1_000_000_000).toFixed(2),
          score,
        };
      })
      .sort((a, b) => b.score - a.score)
      .map((entry, index) => ({ ...entry, rank: index + 1 }));

    return entries;
  }, [submissions, tasks]);

  // Calculate requester leaderboard from tasks
  const requesterLeaderboard = useMemo(() => {
    if (!tasks || !submissions) return [];

    const requesterStats = new Map<
      string,
      {
        address: string;
        totalTasks: number;
        completedTasks: number;
        totalSpent: bigint;
        totalSubmissions: number;
      }
    >();

    // Aggregate task stats per requester
    tasks.forEach((task) => {
      const existing = requesterStats.get(task.requester) || {
        address: task.requester,
        totalTasks: 0,
        completedTasks: 0,
        totalSpent: BigInt(0),
        totalSubmissions: 0,
      };

      existing.totalTasks++;
      if (task.status === "2") {
        // Completed (status 2, not 1)
        existing.completedTasks++;
      }
      existing.totalSpent += BigInt(task.bounty);

      // Count submissions for this task - match by taskId
      const taskSubmissions = submissions.filter(
        (s) => s.taskId === task.taskId
      );
      existing.totalSubmissions += taskSubmissions.length;

      requesterStats.set(task.requester, existing);
    });

    // Convert to leaderboard entries and sort
    const entries: LeaderboardEntry[] = Array.from(requesterStats.values())
      .map((stats) => {
        const completionRate =
          stats.totalTasks > 0
            ? (stats.completedTasks / stats.totalTasks) * 100
            : 0;
        const avgSubmissions =
          stats.totalTasks > 0 ? stats.totalSubmissions / stats.totalTasks : 0;
        const score = Math.round(
          stats.completedTasks * completionRate + avgSubmissions * 10
        );

        return {
          address: stats.address,
          username: `${stats.address.slice(0, 6)}...${stats.address.slice(-4)}`,
          tasksCompleted: stats.totalTasks,
          accuracy: Math.round(completionRate * 10) / 10,
          totalEarned: (Number(stats.totalSpent) / 1_000_000_000).toFixed(2),
          score,
        };
      })
      .sort((a, b) => b.score - a.score)
      .map((entry, index) => ({ ...entry, rank: index + 1 }));

    return entries;
  }, [tasks, submissions]);

  const isLoading = tasksLoading || submissionsLoading;
  const error = tasksError || submissionsError;

  // Get top performers for stats
  const topLabeler = labelerLeaderboard[0];
  const topRequester = requesterLeaderboard[0];

  const getRankBadge = (rank: number) => {
    if (rank === 1)
      return (
        <div className="relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-yellow-500 animate-bounce">
            <Crown className="h-6 w-6 fill-yellow-500" />
          </div>
          <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-white border-0 shadow-lg shadow-yellow-500/20 px-3 py-1">
            <span className="font-bold">1st Place</span>
          </Badge>
        </div>
      );
    if (rank === 2)
      return (
        <Badge className="bg-gradient-to-r from-gray-300 to-gray-500 hover:from-gray-400 hover:to-gray-600 text-white border-0 shadow-lg shadow-gray-500/20 px-3 py-1">
          <Medal className="h-3 w-3 mr-1" />
          2nd Place
        </Badge>
      );
    if (rank === 3)
      return (
        <Badge className="bg-gradient-to-r from-orange-400 to-orange-600 hover:from-orange-500 hover:to-orange-700 text-white border-0 shadow-lg shadow-orange-500/20 px-3 py-1">
          <Medal className="h-3 w-3 mr-1" />
          3rd Place
        </Badge>
      );
    return <span className="text-muted-foreground font-mono font-medium">#{rank}</span>;
  };

  const renderLeaderboard = (
    entries: LeaderboardEntry[],
    type: "labelers" | "requesters"
  ) => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
      {/* Top 3 Highlight */}
      <div className="grid md:grid-cols-3 gap-6 mb-8 items-end">
        {/* 2nd Place */}
        {entries[1] && (
          <Card className="glass-card border-gray-400/30 bg-gradient-to-b from-gray-500/5 to-transparent transform hover:-translate-y-2 transition-all duration-300 order-2 md:order-1">
            <CardHeader className="text-center pb-3 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gray-400 to-transparent opacity-50" />
              <div className="flex justify-center mb-4 mt-2">
                {getRankBadge(2)}
              </div>
              <div className="flex justify-center mb-2">
                <UserDisplay
                  address={entries[1].address}
                  size="lg"
                  showAddress={false}
                  className="ring-4 ring-gray-400/20"
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-center">
              <div>
                <div className="text-3xl font-bold text-foreground">
                  {entries[1].score}
                </div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  Reputation Score
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm bg-muted/30 p-2 rounded-lg">
                <div>
                  <div className="font-semibold">{entries[1].tasksCompleted}</div>
                  <p className="text-xs text-muted-foreground">Tasks</p>
                </div>
                <div>
                  <div className="font-semibold">{entries[1].accuracy}%</div>
                  <p className="text-xs text-muted-foreground">Accuracy</p>
                </div>
              </div>
              <div className="pt-2 border-t border-border/50">
                <div className="text-lg font-bold text-primary">
                  {entries[1].totalEarned} SUI
                </div>
                <p className="text-xs text-muted-foreground">
                  {type === "labelers" ? "Total Earned" : "Total Spent"}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 1st Place */}
        {entries[0] && (
          <Card className="glass-card border-yellow-500/50 bg-gradient-to-b from-yellow-500/10 to-transparent transform hover:-translate-y-3 transition-all duration-300 shadow-xl shadow-yellow-500/10 order-1 md:order-2 z-10">
            <CardHeader className="text-center pb-3 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent" />
              <div className="flex justify-center mb-6 mt-4">
                {getRankBadge(1)}
              </div>
              <div className="flex justify-center mb-2">
                <UserDisplay
                  address={entries[0].address}
                  size="xl"
                  showAddress={false}
                  className="ring-4 ring-yellow-500/30 shadow-lg shadow-yellow-500/20"
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <div>
                <div className="text-4xl font-bold text-yellow-500 drop-shadow-sm">
                  {entries[0].score}
                </div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  Reputation Score
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm bg-yellow-500/5 p-3 rounded-xl border border-yellow-500/10">
                <div>
                  <div className="font-bold text-lg">{entries[0].tasksCompleted}</div>
                  <p className="text-xs text-muted-foreground">Tasks Completed</p>
                </div>
                <div>
                  <div className="font-bold text-lg">{entries[0].accuracy}%</div>
                  <p className="text-xs text-muted-foreground">Accuracy Rate</p>
                </div>
              </div>
              <div className="pt-3 border-t border-yellow-500/10">
                <div className="text-xl font-bold text-primary">
                  {entries[0].totalEarned} SUI
                </div>
                <p className="text-xs text-muted-foreground">
                  {type === "labelers" ? "Total Earned" : "Total Spent"}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 3rd Place */}
        {entries[2] && (
          <Card className="glass-card border-orange-600/30 bg-gradient-to-b from-orange-500/5 to-transparent transform hover:-translate-y-2 transition-all duration-300 order-3">
            <CardHeader className="text-center pb-3 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent opacity-50" />
              <div className="flex justify-center mb-4 mt-2">
                {getRankBadge(3)}
              </div>
              <div className="flex justify-center mb-2">
                <UserDisplay
                  address={entries[2].address}
                  size="lg"
                  showAddress={false}
                  className="ring-4 ring-orange-500/20"
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-center">
              <div>
                <div className="text-3xl font-bold text-foreground">
                  {entries[2].score}
                </div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  Reputation Score
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm bg-muted/30 p-2 rounded-lg">
                <div>
                  <div className="font-semibold">{entries[2].tasksCompleted}</div>
                  <p className="text-xs text-muted-foreground">Tasks</p>
                </div>
                <div>
                  <div className="font-semibold">{entries[2].accuracy}%</div>
                  <p className="text-xs text-muted-foreground">Accuracy</p>
                </div>
              </div>
              <div className="pt-2 border-t border-border/50">
                <div className="text-lg font-bold text-primary">
                  {entries[2].totalEarned} SUI
                </div>
                <p className="text-xs text-muted-foreground">
                  {type === "labelers" ? "Total Earned" : "Total Spent"}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Rest of the leaderboard */}
      <Card className="glass-card overflow-hidden">
        <CardHeader className="bg-muted/30 border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Full Rankings</CardTitle>
              <CardDescription>Complete list of top performers</CardDescription>
            </div>
            <Badge variant="outline" className="px-3 py-1">
              {entries.length} Users
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="space-y-0">
            <div className="grid grid-cols-12 gap-4 p-4 font-medium text-xs uppercase tracking-wider text-muted-foreground bg-muted/20 border-b">
              <div className="col-span-1 text-center">Rank</div>
              <div className="col-span-5 md:col-span-4">User</div>
              <div className="col-span-2 text-right hidden md:block">Score</div>
              <div className="col-span-2 text-right">Tasks</div>
              <div className="col-span-2 text-right hidden md:block">Accuracy</div>
              <div className="col-span-2 md:col-span-1 text-right">Earned</div>
            </div>
            {entries.slice(3).map((entry) => (
              <div
                key={entry.rank}
                className="grid grid-cols-12 gap-4 p-4 hover:bg-muted/40 transition-colors border-b last:border-0 items-center group"
              >
                <div className="col-span-1 flex justify-center">
                  <span className="font-mono text-muted-foreground font-medium group-hover:text-foreground transition-colors">#{entry.rank}</span>
                </div>
                <div className="col-span-5 md:col-span-4 flex items-center">
                  <UserDisplay
                    address={entry.address}
                    size="sm"
                    showAddress={false}
                  />
                </div>
                <div className="col-span-2 text-right hidden md:block font-semibold text-foreground">
                  {entry.score}
                </div>
                <div className="col-span-2 text-right text-muted-foreground group-hover:text-foreground transition-colors">
                  {entry.tasksCompleted}
                </div>
                <div className="col-span-2 text-right hidden md:block text-muted-foreground">
                  {entry.accuracy}%
                </div>
                 <div className="col-span-2 md:col-span-1 text-right font-medium text-primary">
                  {entry.totalEarned}
                </div>
              </div>
            ))}
            {entries.length <= 3 && (
              <div className="p-8 text-center text-muted-foreground">
                No more rankings to display.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-7xl py-12 space-y-12 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center space-y-4 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-primary/20 blur-[100px] rounded-full -z-10 pointer-events-none" />
          <Badge variant="outline" className="py-1 px-4 rounded-full border-primary/30 bg-primary/5 text-primary mb-4">
            <Zap className="h-3 w-3 mr-2 fill-primary" />
            Live Rankings
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent pb-2">
            Leaderboard
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Celebrating the top performers in the Songsim Label community. 
            Compete for reputation, rewards, and glory.
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col justify-center items-center py-24 space-y-4">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
              <Loader2 className="h-12 w-12 animate-spin text-primary relative z-10" />
            </div>
            <span className="text-lg text-muted-foreground font-medium">
              Crunching the numbers...
            </span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="border-destructive/50 bg-destructive/5 max-w-lg mx-auto">
            <CardContent className="pt-6 text-center">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <p className="text-destructive font-semibold mb-2 text-lg">
                Failed to load leaderboard
              </p>
              <p className="text-sm text-muted-foreground">{error.message}</p>
            </CardContent>
          </Card>
        )}

        {/* Stats Overview */}
        {!isLoading && !error && (
          <>
            <div className="grid md:grid-cols-4 gap-6">
              <Card className="glass-card hover:border-primary/30 transition-colors group">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                      <Target className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-foreground group-hover:text-primary transition-colors">
                        {topLabeler?.tasksCompleted || 0}
                      </p>
                      <p className="text-sm text-muted-foreground font-medium">
                        Top Labeler Tasks
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card hover:border-primary/30 transition-colors group">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-green-500/10 group-hover:bg-green-500/20 transition-colors">
                      <TrendingUp className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-foreground group-hover:text-primary transition-colors">
                        {topLabeler?.accuracy || 0}%
                      </p>
                      <p className="text-sm text-muted-foreground font-medium">
                        Highest Accuracy
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card hover:border-primary/30 transition-colors group">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors">
                      <Award className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-foreground group-hover:text-primary transition-colors">
                        {topRequester?.tasksCompleted || 0}
                      </p>
                      <p className="text-sm text-muted-foreground font-medium">
                        Top Requester Tasks
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card hover:border-primary/30 transition-colors group">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-yellow-500/10 group-hover:bg-yellow-500/20 transition-colors">
                      <Trophy className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-foreground group-hover:text-primary transition-colors">
                        {topRequester?.accuracy || 0}%
                      </p>
                      <p className="text-sm text-muted-foreground font-medium">
                        Best Completion Rate
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Leaderboard Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
              <div className="flex justify-center">
                <TabsList className="grid w-full max-w-md grid-cols-2 p-1 bg-muted/50 rounded-xl">
                  <TabsTrigger value="labelers" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-md transition-all">
                    <Users className="h-4 w-4 mr-2" />
                    Top Labelers
                  </TabsTrigger>
                  <TabsTrigger value="requesters" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-md transition-all">
                    <Star className="h-4 w-4 mr-2" />
                    Top Requesters
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="labelers">
                {renderLeaderboard(labelerLeaderboard, "labelers")}
              </TabsContent>

              <TabsContent value="requesters">
                {renderLeaderboard(requesterLeaderboard, "requesters")}
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  );
}
