"use client";

import { useState } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { useUserProfile } from "@/hooks/use-user-profile";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TrendingUp,
  DollarSign,
  CheckCircle,
  Award,
  Activity,
  Calendar,
  Target,
  Users,
} from "lucide-react";

export default function AnalyticsPage() {
  const account = useCurrentAccount();
  const { data: profile } = useUserProfile();

  // Mock analytics data - will be fetched from blockchain
  const [analyticsData] = useState({
    requester: {
      totalSpent: "125.5",
      activeTasks: 8,
      completedTasks: 34,
      avgCompletionTime: "3.5 days",
      totalSubmissions: 156,
      acceptanceRate: 87,
      topLabelers: [
        { address: "0x123...456", tasks: 12, rating: 4.8 },
        { address: "0x789...abc", tasks: 10, rating: 4.6 },
        { address: "0xdef...123", tasks: 8, rating: 4.9 },
      ],
      monthlyStats: [
        { month: "Aug", spent: 15.2, tasks: 5 },
        { month: "Sep", spent: 28.5, tasks: 8 },
        { month: "Oct", spent: 42.3, tasks: 12 },
        { month: "Nov", spent: 39.5, tasks: 9 },
      ],
    },
    labeler: {
      totalEarned: "234.8",
      tasksCompleted: 127,
      pendingSubmissions: 8,
      avgResponseTime: "2.1 days",
      reputationScore: 950,
      acceptanceRate: 92,
      topRequesters: [
        { address: "0xaaa...bbb", tasks: 18, avgPay: 2.5 },
        { address: "0xccc...ddd", tasks: 15, avgPay: 2.2 },
        { address: "0xeee...fff", tasks: 12, avgPay: 2.8 },
      ],
      monthlyStats: [
        { month: "Aug", earned: 42.5, tasks: 22 },
        { month: "Sep", earned: 58.3, tasks: 28 },
        { month: "Oct", earned: 68.2, tasks: 35 },
        { month: "Nov", earned: 65.8, tasks: 42 },
      ],
    },
  });

  const showRequesterAnalytics =
    profile?.userType === 1 || profile?.userType === 3;
  const showLabelerAnalytics =
    profile?.userType === 2 || profile?.userType === 3;

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Track your performance and insights
          </p>
        </div>
      </div>

      <Tabs defaultValue={showRequesterAnalytics ? "requester" : "labeler"}>
        <TabsList>
          {showRequesterAnalytics && (
            <TabsTrigger value="requester">Requester Analytics</TabsTrigger>
          )}
          {showLabelerAnalytics && (
            <TabsTrigger value="labeler">Labeler Analytics</TabsTrigger>
          )}
        </TabsList>

        {showRequesterAnalytics && (
          <TabsContent value="requester" className="space-y-6">
            {/* Requester Overview */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Spent
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analyticsData.requester.totalSpent} SUI
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Across all tasks
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Active Tasks
                  </CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analyticsData.requester.activeTasks}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Currently running
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Completed Tasks
                  </CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analyticsData.requester.completedTasks}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Successfully finished
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Acceptance Rate
                  </CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analyticsData.requester.acceptanceRate}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Submission quality
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Monthly Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Trends</CardTitle>
                <CardDescription>
                  Your spending and task creation over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.requester.monthlyStats.map((stat, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{stat.month}</span>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {stat.spent} SUI
                          </div>
                          <div className="text-xs text-muted-foreground">
                            spent
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {stat.tasks}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            tasks
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Labelers */}
            <Card>
              <CardHeader>
                <CardTitle>Top Labelers</CardTitle>
                <CardDescription>
                  Most active contributors to your tasks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.requester.topLabelers.map((labeler, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                          <span className="text-sm font-semibold">
                            {idx + 1}
                          </span>
                        </div>
                        <div>
                          <div className="font-mono text-sm">
                            {labeler.address}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {labeler.tasks} tasks completed
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Award className="h-4 w-4 text-yellow-500" />
                        <span className="font-medium">{labeler.rating}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {showLabelerAnalytics && (
          <TabsContent value="labeler" className="space-y-6">
            {/* Labeler Overview */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Earned
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analyticsData.labeler.totalEarned} SUI
                  </div>
                  <p className="text-xs text-muted-foreground">
                    From completed tasks
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Tasks Completed
                  </CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analyticsData.labeler.tasksCompleted}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Successfully submitted
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Reputation Score
                  </CardTitle>
                  <Award className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analyticsData.labeler.reputationScore}
                  </div>
                  <p className="text-xs text-muted-foreground">Out of 1000</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Acceptance Rate
                  </CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analyticsData.labeler.acceptanceRate}%
                  </div>
                  <p className="text-xs text-muted-foreground">Quality score</p>
                </CardContent>
              </Card>
            </div>

            {/* Monthly Earnings */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Earnings</CardTitle>
                <CardDescription>
                  Your earnings and task completion over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.labeler.monthlyStats.map((stat, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{stat.month}</span>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {stat.earned} SUI
                          </div>
                          <div className="text-xs text-muted-foreground">
                            earned
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {stat.tasks}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            tasks
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Requesters */}
            <Card>
              <CardHeader>
                <CardTitle>Top Requesters</CardTitle>
                <CardDescription>
                  Clients you work with most frequently
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.labeler.topRequesters.map((requester, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                          <span className="text-sm font-semibold">
                            {idx + 1}
                          </span>
                        </div>
                        <div>
                          <div className="font-mono text-sm">
                            {requester.address}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {requester.tasks} tasks completed
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4 text-green-500" />
                        <span className="font-medium">
                          {requester.avgPay} SUI avg
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
