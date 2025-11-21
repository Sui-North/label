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
  ArrowUpRight,
  BarChart3,
  PieChart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
    <div className="container mx-auto p-6 max-w-7xl space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Track your performance and insights
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="shadow-sm">
            <Calendar className="h-4 w-4 mr-2" />
            Last 30 Days
          </Button>
          <Button variant="outline" size="sm" className="shadow-sm">
            <ArrowUpRight className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      <Tabs defaultValue={showRequesterAnalytics ? "requester" : "labeler"} className="space-y-6">
        <TabsList className="bg-muted/50 p-1 rounded-xl w-full md:w-auto grid grid-cols-2 md:inline-flex">
          {showRequesterAnalytics && (
            <TabsTrigger value="requester" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
              Requester Analytics
            </TabsTrigger>
          )}
          {showLabelerAnalytics && (
            <TabsTrigger value="labeler" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
              Labeler Analytics
            </TabsTrigger>
          )}
        </TabsList>

        {showRequesterAnalytics && (
          <TabsContent value="requester" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Requester Overview */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card className="glass-card hover:shadow-lg transition-all duration-300 border-primary/20 bg-primary/5">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-primary">
                    Total Spent
                  </CardTitle>
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <DollarSign className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">
                    {analyticsData.requester.totalSpent} SUI
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Across all tasks
                  </p>
                </CardContent>
              </Card>

              <Card className="glass-card hover:shadow-lg transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Active Tasks
                  </CardTitle>
                  <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                    <Activity className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analyticsData.requester.activeTasks}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Currently running
                  </p>
                </CardContent>
              </Card>

              <Card className="glass-card hover:shadow-lg transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Completed Tasks
                  </CardTitle>
                  <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                    <CheckCircle className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analyticsData.requester.completedTasks}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Successfully finished
                  </p>
                </CardContent>
              </Card>

              <Card className="glass-card hover:shadow-lg transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Acceptance Rate
                  </CardTitle>
                  <div className="h-8 w-8 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500">
                    <Target className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analyticsData.requester.acceptanceRate}%
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Submission quality
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-7">
              {/* Monthly Trends */}
              <Card className="glass-card md:col-span-4">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Monthly Trends</CardTitle>
                      <CardDescription>
                        Your spending and task creation over time
                      </CardDescription>
                    </div>
                    <BarChart3 className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analyticsData.requester.monthlyStats.map((stat, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/30 transition-colors border border-transparent hover:border-border/50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                            {stat.month}
                          </div>
                          <div className="h-2 w-24 bg-secondary rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary rounded-full" 
                              style={{ width: `${(stat.spent / 50) * 100}%` }}
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <div className="text-sm font-bold text-primary">
                              {stat.spent} SUI
                            </div>
                            <div className="text-xs text-muted-foreground">
                              spent
                            </div>
                          </div>
                          <div className="text-right w-12">
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
              <Card className="glass-card md:col-span-3">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Top Labelers</CardTitle>
                      <CardDescription>
                        Most active contributors
                      </CardDescription>
                    </div>
                    <Users className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analyticsData.requester.topLabelers.map((labeler, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/50"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`flex h-8 w-8 items-center justify-center rounded-full font-bold text-xs ${
                            idx === 0 ? "bg-yellow-500/20 text-yellow-600" : 
                            idx === 1 ? "bg-gray-400/20 text-gray-500" : 
                            "bg-orange-400/20 text-orange-600"
                          }`}>
                            {idx + 1}
                          </div>
                          <div>
                            <div className="font-mono text-sm font-medium">
                              {labeler.address}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {labeler.tasks} tasks completed
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 bg-background/50 px-2 py-1 rounded-md border shadow-sm">
                          <Award className="h-3 w-3 text-yellow-500" />
                          <span className="font-bold text-sm">{labeler.rating}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}

        {showLabelerAnalytics && (
          <TabsContent value="labeler" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Labeler Overview */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card className="glass-card hover:shadow-lg transition-all duration-300 border-primary/20 bg-primary/5">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-primary">
                    Total Earned
                  </CardTitle>
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <DollarSign className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">
                    {analyticsData.labeler.totalEarned} SUI
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    From completed tasks
                  </p>
                </CardContent>
              </Card>

              <Card className="glass-card hover:shadow-lg transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Tasks Completed
                  </CardTitle>
                  <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                    <CheckCircle className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analyticsData.labeler.tasksCompleted}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Successfully submitted
                  </p>
                </CardContent>
              </Card>

              <Card className="glass-card hover:shadow-lg transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Reputation Score
                  </CardTitle>
                  <div className="h-8 w-8 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-500">
                    <Award className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analyticsData.labeler.reputationScore}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Out of 1000</p>
                </CardContent>
              </Card>

              <Card className="glass-card hover:shadow-lg transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Acceptance Rate
                  </CardTitle>
                  <div className="h-8 w-8 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500">
                    <Target className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analyticsData.labeler.acceptanceRate}%
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Quality score</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-7">
              {/* Monthly Earnings */}
              <Card className="glass-card md:col-span-4">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Monthly Earnings</CardTitle>
                      <CardDescription>
                        Your earnings and task completion over time
                      </CardDescription>
                    </div>
                    <TrendingUp className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analyticsData.labeler.monthlyStats.map((stat, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/30 transition-colors border border-transparent hover:border-border/50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                            {stat.month}
                          </div>
                          <div className="h-2 w-24 bg-secondary rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-green-500 rounded-full" 
                              style={{ width: `${(stat.earned / 80) * 100}%` }}
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <div className="text-sm font-bold text-green-600">
                              {stat.earned} SUI
                            </div>
                            <div className="text-xs text-muted-foreground">
                              earned
                            </div>
                          </div>
                          <div className="text-right w-12">
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
              <Card className="glass-card md:col-span-3">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Top Requesters</CardTitle>
                      <CardDescription>
                        Clients you work with most
                      </CardDescription>
                    </div>
                    <PieChart className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analyticsData.labeler.topRequesters.map((requester, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/50"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`flex h-8 w-8 items-center justify-center rounded-full font-bold text-xs ${
                            idx === 0 ? "bg-primary/20 text-primary" : 
                            "bg-muted text-muted-foreground"
                          }`}>
                            {idx + 1}
                          </div>
                          <div>
                            <div className="font-mono text-sm font-medium">
                              {requester.address}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {requester.tasks} tasks completed
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 bg-background/50 px-2 py-1 rounded-md border shadow-sm">
                          <DollarSign className="h-3 w-3 text-green-500" />
                          <span className="font-bold text-sm">
                            {requester.avgPay}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
