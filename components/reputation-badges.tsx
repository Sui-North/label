"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Award, Star, Trophy, Target, TrendingUp } from "lucide-react";

interface BadgeCardProps {
  badgeId: number;
  name: string;
  requirement: string;
  earned: boolean;
}

export function BadgeCard({ badgeId, name, requirement, earned }: BadgeCardProps) {
  const renderBadgeIcon = () => {
    const iconClass = "h-5 w-5";
    switch (badgeId) {
      case 1: return <Star className={iconClass} />;
      case 2: return <Target className={iconClass} />;
      case 3: return <Award className={iconClass} />;
      case 4: return <Trophy className={iconClass} />;
      case 5: return <TrendingUp className={iconClass} />;
      default: return <Award className={iconClass} />;
    }
  };

  return (
    <div className={`relative p-4 rounded-lg border-2 transition-all ${
      earned 
        ? "border-yellow-500 bg-yellow-500/10" 
        : "border-muted bg-muted/20 opacity-60"
    }`}>
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-full ${
          earned ? "bg-yellow-500 text-white" : "bg-muted text-muted-foreground"
        }`}>
          {renderBadgeIcon()}
        </div>
        <div className="flex-1">
          <div className="font-semibold">{name}</div>
          <div className="text-xs text-muted-foreground">{requirement}</div>
        </div>
        {earned && (
          <Badge variant="default" className="bg-yellow-500">
            Earned
          </Badge>
        )}
      </div>
    </div>
  );
}

interface ReputationCardProps {
  reputationScore: number;
  totalCompleted: number;
  totalAccepted: number;
  totalRejected: number;
  acceptanceRate: number;
}

export function ReputationCard({
  reputationScore,
  totalCompleted,
  totalAccepted,
  totalRejected,
  acceptanceRate,
}: ReputationCardProps) {
  const getReputationLevel = (score: number) => {
    if (score >= 900) return { level: "Master", color: "text-purple-600", bg: "bg-purple-500/10" };
    if (score >= 750) return { level: "Expert", color: "text-blue-600", bg: "bg-blue-500/10" };
    if (score >= 500) return { level: "Intermediate", color: "text-green-600", bg: "bg-green-500/10" };
    if (score >= 250) return { level: "Novice", color: "text-yellow-600", bg: "bg-yellow-500/10" };
    return { level: "Beginner", color: "text-gray-600", bg: "bg-gray-500/10" };
  };

  const { level, color, bg } = getReputationLevel(reputationScore);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reputation</CardTitle>
        <CardDescription>Your performance and standing in the community</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Reputation Score</span>
            <span className={`text-2xl font-bold ${color}`}>{reputationScore}</span>
          </div>
          <Progress value={(reputationScore / 1000) * 100} className="h-2" />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Level: {level}</span>
            <span className="text-xs text-muted-foreground">{reputationScore} / 1000</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold">{totalCompleted}</div>
            <div className="text-xs text-muted-foreground">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{totalAccepted}</div>
            <div className="text-xs text-muted-foreground">Accepted</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{totalRejected}</div>
            <div className="text-xs text-muted-foreground">Rejected</div>
          </div>
        </div>

        <div className="pt-4 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Acceptance Rate</span>
            <span className={`text-lg font-bold ${
              acceptanceRate >= 90 ? "text-green-600" : 
              acceptanceRate >= 70 ? "text-yellow-600" : 
              "text-red-600"
            }`}>
              {acceptanceRate.toFixed(1)}%
            </span>
          </div>
          <Progress value={acceptanceRate} className="h-2 mt-2" />
        </div>
      </CardContent>
    </Card>
  );
}

interface NextBadgeProps {
  name: string;
  progress: number;
  target: number;
  requirement: string;
}

export function NextBadgeProgress({ name, progress, target, requirement }: NextBadgeProps) {
  const percentage = (progress / target) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Next Badge: {name}</CardTitle>
        <CardDescription>{requirement}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Progress</span>
          <span className="text-muted-foreground">
            {progress} / {target}
          </span>
        </div>
        <Progress value={percentage} className="h-3" />
        <div className="text-xs text-muted-foreground text-right">
          {(100 - percentage).toFixed(0)}% remaining
        </div>
      </CardContent>
    </Card>
  );
}
