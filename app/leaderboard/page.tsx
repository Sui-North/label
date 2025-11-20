"use client";

import { useState, useMemo } from "react";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
        <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white">
          <Trophy className="h-3 w-3 mr-1" />
          1st
        </Badge>
      );
    if (rank === 2)
      return (
        <Badge className="bg-gray-400 hover:bg-gray-500 text-white">
          <Award className="h-3 w-3 mr-1" />
          2nd
        </Badge>
      );
    if (rank === 3)
      return (
        <Badge className="bg-orange-600 hover:bg-orange-700 text-white">
          <Award className="h-3 w-3 mr-1" />
          3rd
        </Badge>
      );
    return <span className="text-muted-foreground font-medium">#{rank}</span>;
  };

  const renderLeaderboard = (
    entries: LeaderboardEntry[],
    type: "labelers" | "requesters"
  ) => (
    <div className="space-y-4">
      {/* Top 3 Highlight */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        {entries.slice(0, 3).map((entry) => (
          <Card
            key={entry.rank}
            className={`${
              entry.rank === 1
                ? "border-yellow-500 shadow-lg"
                : entry.rank === 2
                ? "border-gray-400"
                : "border-orange-600"
            }`}
          >
            <CardHeader className="text-center pb-3">
              <div className="flex justify-center mb-2">
                {getRankBadge(entry.rank)}
              </div>
              <div className="flex justify-center mb-2">
                <UserDisplay
                  address={entry.address}
                  size="lg"
                  showAddress={false}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">
                  {entry.score}
                </div>
                <p className="text-xs text-muted-foreground">
                  Reputation Score
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <div className="font-semibold">{entry.tasksCompleted}</div>
                  <p className="text-xs text-muted-foreground">Tasks</p>
                </div>
                <div>
                  <div className="font-semibold">{entry.accuracy}%</div>
                  <p className="text-xs text-muted-foreground">Accuracy</p>
                </div>
              </div>
              <div className="pt-2 border-t">
                <div className="text-lg font-bold text-green-600">
                  {entry.totalEarned} SUI
                </div>
                <p className="text-xs text-muted-foreground">
                  {type === "labelers" ? "Total Earned" : "Total Spent"}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Rest of the leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle>Full Rankings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <div className="grid grid-cols-6 gap-4 p-3 font-medium text-sm text-muted-foreground border-b">
              <div>Rank</div>
              <div className="col-span-2">User</div>
              <div className="text-right">Score</div>
              <div className="text-right">Tasks</div>
              <div className="text-right">Accuracy</div>
            </div>
            {entries.map((entry) => (
              <div
                key={entry.rank}
                className="grid grid-cols-6 gap-4 p-3 hover:bg-muted/50 rounded-lg transition-colors"
              >
                <div className="flex items-center">
                  {getRankBadge(entry.rank)}
                </div>
                <div className="col-span-2 flex items-center">
                  <UserDisplay
                    address={entry.address}
                    size="sm"
                    showAddress={false}
                  />
                </div>
                <div className="flex items-center justify-end font-semibold">
                  {entry.score}
                </div>
                <div className="flex items-center justify-end text-muted-foreground">
                  {entry.tasksCompleted}
                </div>
                <div className="flex items-center justify-end text-muted-foreground">
                  {entry.accuracy}%
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <>
      <Navbar />
      <div className="container max-w-7xl py-8 space-y-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold flex items-center justify-center gap-3">
            <Trophy className="h-10 w-10 text-yellow-500" />
            Leaderboard
          </h1>
          <p className="text-muted-foreground text-lg">
            Top performers in the Songsim Label community
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">
              Loading leaderboard data...
            </span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="border-destructive">
            <CardContent className="pt-6 text-center">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <p className="text-destructive font-semibold mb-2">
                Failed to load leaderboard
              </p>
              <p className="text-sm text-muted-foreground">{error.message}</p>
            </CardContent>
          </Card>
        )}

        {/* Stats Overview */}
        {!isLoading && !error && (
          <>
            <div className="grid md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-blue-500/10">
                      <Target className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">
                        {topLabeler?.tasksCompleted || 0}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Top Labeler Tasks
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-green-500/10">
                      <TrendingUp className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">
                        {topLabeler?.accuracy || 0}%
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Highest Accuracy
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-purple-500/10">
                      <Award className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">
                        {topRequester?.tasksCompleted || 0}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Top Requester Tasks
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-yellow-500/10">
                      <Trophy className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">
                        {topRequester?.accuracy || 0}%
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Best Completion Rate
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Leaderboard Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
                <TabsTrigger value="labelers">Top Labelers</TabsTrigger>
                <TabsTrigger value="requesters">Top Requesters</TabsTrigger>
              </TabsList>

              <TabsContent value="labelers" className="mt-6">
                {renderLeaderboard(labelerLeaderboard, "labelers")}
              </TabsContent>

              <TabsContent value="requesters" className="mt-6">
                {renderLeaderboard(requesterLeaderboard, "requesters")}
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </>
  );
}
