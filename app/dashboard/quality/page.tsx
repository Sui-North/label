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
      <div className="container mx-auto p-6 max-w-7xl">
        <Card>
          <CardContent className="pt-6 text-center">
            <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">
              Connect your wallet to view quality metrics
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoadingQuality) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  const stats = qualityStats;

  const badge = getQualityBadge(stats.reputationScore);

  // Calculate percentage breakdowns based on acceptance rate
  const acceptancePercent = stats.totalSubmissions > 0 ? (stats.acceptedCount / stats.totalSubmissions) * 100 : 0;
  const rejectionPercent = stats.totalSubmissions > 0 ? (stats.rejectedCount / stats.totalSubmissions) * 100 : 0;

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Quality Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Track your work quality and reputation
        </p>
      </div>

      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Quality scores are assigned by task requesters after reviewing your submissions. 
          Higher scores boost your reputation and increase future earning potential.
        </AlertDescription>
      </Alert>

      {/* Overall Score Card */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Reputation Score</span>
            <Badge className="bg-primary">
              <Award className="h-3 w-3 mr-1" />
              Active
            </Badge>
          </CardTitle>
          <CardDescription>Based on {stats.totalSubmissions} submissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="flex-1">
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-6xl font-bold" style={{ color: getQualityColor(stats.reputationScore) }}>
                  {stats.reputationScore.toFixed(1)}
                </span>
                <span className="text-2xl text-muted-foreground">/100</span>
              </div>
              <div className="flex items-center gap-2 mb-4">
                <Badge
                  variant="outline"
                  className={`text-${badge.color}-600 border-${badge.color}-600`}
                >
                  {badge.emoji} {badge.label}
                </Badge>
              </div>
              <Progress value={stats.reputationScore} className="h-3" />
            </div>

            <Separator orientation="vertical" className="h-32" />

            <div className="flex-1 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Accepted Submissions</span>
                <div className="flex items-center gap-2">
                  <Progress value={acceptancePercent} className="w-24 h-2" />
                  <span className="text-sm font-medium w-8 text-right">{stats.acceptedCount}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Rejected Submissions</span>
                <div className="flex items-center gap-2">
                  <Progress value={rejectionPercent} className="w-24 h-2" />
                  <span className="text-sm font-medium w-8 text-right">{stats.rejectedCount}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Acceptance Rate</span>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-green-600">{acceptancePercent.toFixed(0)}%</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
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

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Star className="h-4 w-4 text-muted-foreground" />
              Acceptance Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">
              {acceptancePercent.toFixed(0)}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Accepted work
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
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

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Award className="h-4 w-4 text-muted-foreground" />
              Quality Rank
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-purple-600">
              {stats.reputationScore >= 90 ? "Top 10%" : stats.reputationScore >= 75 ? "Top 30%" : "Active"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Among all labelers
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Reputation Summary</CardTitle>
          <CardDescription>
            Your on-chain reputation metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!qualityData ? (
            <div className="text-center py-12">
              <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-2">
                No reputation data yet
              </p>
              <p className="text-sm text-muted-foreground">
                Complete tasks to build your reputation
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="border rounded-lg p-6 bg-muted/50">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-3xl font-bold text-primary">{stats.totalSubmissions}</p>
                    <p className="text-sm text-muted-foreground mt-1">Total Submissions</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-green-600">{stats.acceptedCount}</p>
                    <p className="text-sm text-muted-foreground mt-1">Accepted</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-red-600">{stats.rejectedCount}</p>
                    <p className="text-sm text-muted-foreground mt-1">Rejected</p>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
                <div className="flex items-start gap-3">
                  <Award className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100">Reputation Score: {stats.reputationScore.toFixed(1)}/100</h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                      Your reputation is calculated from your acceptance rate and task quality. 
                      Maintain high-quality work to improve your score and unlock better opportunities.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tips Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Tips for Higher Quality Scores
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <span>Carefully read all task instructions before starting</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <span>Double-check your work for accuracy and completeness</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <span>Follow formatting guidelines provided by the requester</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <span>Ask questions if instructions are unclear</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <span>Submit work before the deadline to avoid rushed mistakes</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
