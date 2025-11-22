"use client";

import { useCurrentAccount } from "@mysten/dapp-kit";
import { useQuality } from "@/hooks/use-quality";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Star,
  Award,
  Target,
  BarChart3,
  Info,
  Loader2,
  ShieldCheck,
  TrendingUp,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function QualityPage() {
  const account = useCurrentAccount();
  const {
    qualityData,
    qualityStats,
    isLoadingQuality,
    getQualityBadge,
    getQualityColor,
  } = useQuality();

  if (!account) {
    return (
      <div className="container mx-auto p-6 max-w-7xl animate-in fade-in duration-500">
        <Card className="glass-card border-dashed">
          <CardContent className="pt-12 pb-12 text-center">
            <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Connect Wallet</h3>
            <p className="text-muted-foreground mb-4 max-w-sm mx-auto">
              Connect your wallet to view your personalized quality metrics and
              reputation score.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoadingQuality) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
            <Loader2 className="h-12 w-12 animate-spin text-primary relative z-10" />
          </div>
          <span className="text-lg text-muted-foreground font-medium">
            Analyzing quality metrics...
          </span>
        </div>
      </div>
    );
  }

  const stats = qualityStats;
  const badge = getQualityBadge(stats.reputationScore);

  // Calculate percentage breakdowns based on acceptance rate
  const acceptancePercent =
    stats.totalSubmissions > 0
      ? (stats.acceptedCount / stats.totalSubmissions) * 100
      : 0;
  const rejectionPercent =
    stats.totalSubmissions > 0
      ? (stats.rejectedCount / stats.totalSubmissions) * 100
      : 0;

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
          Quality Dashboard
        </h1>
        <p className="text-muted-foreground text-lg">
          Track your work quality, reputation score, and performance metrics.
        </p>
      </div>

      {/* Info Alert */}
      <Alert className="bg-primary/5 border-primary/20 text-primary">
        <Info className="h-4 w-4" />
        <AlertDescription className="ml-2">
          Quality scores are assigned by task requesters after reviewing your
          submissions. Higher scores boost your reputation and increase future
          earning potential.
        </AlertDescription>
      </Alert>

      {/* Overall Score Card */}
      <Card className="glass-card border-primary/20 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[80px] rounded-full -z-10 pointer-events-none" />
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="text-xl">Reputation Score</span>
            <Badge className="bg-green-500/10 text-green-600 border-green-200 dark:border-green-800 hover:bg-green-500/20 px-3 py-1">
              <ShieldCheck className="h-3 w-3 mr-1.5" />
              Active Status
            </Badge>
          </CardTitle>
          <CardDescription>
            Based on {stats.totalSubmissions} total submissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
            <div className="flex-1 w-full text-center md:text-left">
              <div className="flex items-baseline justify-center md:justify-start gap-2 mb-2">
                <span
                  className="text-7xl font-bold tracking-tighter"
                  style={{ color: getQualityColor(stats.reputationScore) }}
                >
                  {stats.reputationScore.toFixed(1)}
                </span>
                <span className="text-2xl text-muted-foreground font-light">
                  /100
                </span>
              </div>
              <div className="flex items-center justify-center md:justify-start gap-3 mb-6">
                <Badge
                  variant="outline"
                  className={`text-${badge.color}-600 border-${badge.color}-600 px-3 py-1 text-sm font-medium`}
                >
                  {badge.emoji} {badge.label}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {stats.reputationScore >= 90
                    ? "Excellent"
                    : stats.reputationScore >= 70
                    ? "Good"
                    : "Needs Improvement"}
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Progress to next tier</span>
                  <span>
                    {Math.min(100, stats.reputationScore + 15).toFixed(0)}{" "}
                    target
                  </span>
                </div>
                <Progress
                  value={stats.reputationScore}
                  className="h-3 bg-muted/50"
                />
              </div>
            </div>

            <div className="hidden md:block h-32 w-px bg-border/50" />

            <div className="flex-1 w-full space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Accepted Submissions
                  </span>
                  <span className="text-sm font-bold">
                    {stats.acceptedCount}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Progress
                    value={acceptancePercent}
                    className="h-2 bg-muted/50"
                  />
                  <span className="text-xs font-medium w-10 text-right text-muted-foreground">
                    {acceptancePercent.toFixed(0)}%
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-500" />
                    Rejected Submissions
                  </span>
                  <span className="text-sm font-bold">
                    {stats.rejectedCount}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Progress
                    value={rejectionPercent}
                    className="h-2 bg-muted/50"
                  />
                  <span className="text-xs font-medium w-10 text-right text-muted-foreground">
                    {rejectionPercent.toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="glass-card hover:border-primary/30 transition-colors group">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground group-hover:text-primary transition-colors">
              <BarChart3 className="h-4 w-4" />
              Total Submissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.totalSubmissions}</p>
            <p className="text-xs text-muted-foreground mt-1">
              All-time submissions
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card hover:border-primary/30 transition-colors group">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground group-hover:text-primary transition-colors">
              <Star className="h-4 w-4" />
              Acceptance Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">
              {acceptancePercent.toFixed(0)}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">Accepted work</p>
          </CardContent>
        </Card>

        <Card className="glass-card hover:border-primary/30 transition-colors group">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground group-hover:text-primary transition-colors">
              <Target className="h-4 w-4" />
              Accepted Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">
              {stats.acceptedCount}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Successfully completed
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card hover:border-primary/30 transition-colors group">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground group-hover:text-primary transition-colors">
              <Award className="h-4 w-4" />
              Quality Rank
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-purple-600">
              {stats.reputationScore >= 90
                ? "Top 10%"
                : stats.reputationScore >= 75
                ? "Top 30%"
                : "Active"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Among all labelers
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Reputation Summary
            </CardTitle>
            <CardDescription>
              Your on-chain reputation metrics and history
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!qualityData ? (
              <div className="text-center py-12">
                <div className="h-12 w-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground mb-2 font-medium">
                  No reputation data yet
                </p>
                <p className="text-sm text-muted-foreground">
                  Complete tasks to build your reputation
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-muted/30 border text-center hover:bg-muted/50 transition-colors">
                    <p className="text-3xl font-bold text-foreground">
                      {stats.totalSubmissions}
                    </p>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1 font-medium">
                      Total
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/10 text-center hover:bg-green-500/10 transition-colors">
                    <p className="text-3xl font-bold text-green-600">
                      {stats.acceptedCount}
                    </p>
                    <p className="text-xs text-green-600/80 uppercase tracking-wider mt-1 font-medium">
                      Accepted
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10 text-center hover:bg-red-500/10 transition-colors">
                    <p className="text-3xl font-bold text-red-600">
                      {stats.rejectedCount}
                    </p>
                    <p className="text-xs text-red-600/80 uppercase tracking-wider mt-1 font-medium">
                      Rejected
                    </p>
                  </div>
                </div>

                <div className="p-5 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl border border-blue-500/20">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-background rounded-full shadow-sm">
                      <Award className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground">
                        Reputation Score: {stats.reputationScore.toFixed(1)}/100
                      </h4>
                      <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                        Your reputation is calculated from your acceptance rate
                        and task quality. Maintain high-quality work to improve
                        your score and unlock better opportunities.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tips Card */}
        <Card className="glass-card bg-gradient-to-b from-yellow-500/5 to-transparent border-yellow-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-600 dark:text-yellow-500">
              <Star className="h-5 w-5 fill-yellow-500 text-yellow-500" />
              Pro Tips
            </CardTitle>
            <CardDescription>How to improve your score</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <div className="mt-0.5 h-5 w-5 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                </div>
                <span className="text-sm text-muted-foreground">
                  Carefully read all task instructions before starting
                </span>
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-0.5 h-5 w-5 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                </div>
                <span className="text-sm text-muted-foreground">
                  Double-check your work for accuracy and completeness
                </span>
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-0.5 h-5 w-5 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                </div>
                <span className="text-sm text-muted-foreground">
                  Follow formatting guidelines provided by the requester
                </span>
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-0.5 h-5 w-5 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                </div>
                <span className="text-sm text-muted-foreground">
                  Ask questions if instructions are unclear
                </span>
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-0.5 h-5 w-5 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                </div>
                <span className="text-sm text-muted-foreground">
                  Submit work before the deadline to avoid rushed mistakes
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
