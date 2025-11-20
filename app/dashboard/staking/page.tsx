"use client";

import { useState } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { useStaking } from "@/hooks/use-staking";
import { useUserProfile } from "@/hooks/use-user-profile";
import { useAvailableTasks } from "@/hooks/use-tasks";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DollarSign,
  Lock,
  Unlock,
  TrendingUp,
  Shield,
  Loader2,
  AlertCircle,
  Info,
  ArrowUpRight,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";

export default function StakingPage() {
  const account = useCurrentAccount();
  const { data: profile } = useUserProfile();
  const { stakes, totalStaked, isLoadingStakes, isStaking, isUnstaking, stakeForTask, unstake } = useStaking();
  const { data: availableTasks = [] } = useAvailableTasks();

  const [stakeDialogOpen, setStakeDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [stakeAmount, setStakeAmount] = useState("");

  const handleOpenStakeDialog = (task: any) => {
    setSelectedTask(task);
    setStakeAmount("");
    setStakeDialogOpen(true);
  };

  const handleStake = async () => {
    const amount = parseFloat(stakeAmount);
    if (isNaN(amount) || amount <= 0) {
      return;
    }

    const success = await stakeForTask(amount);

    if (success) {
      setStakeDialogOpen(false);
      setSelectedTask(null);
      setStakeAmount("");
    }
  };

  const handleUnstake = async (stakeObjectId: string) => {
    await unstake(stakeObjectId);
  };

  const totalStakedSUI = (totalStaked / 1_000_000_000).toFixed(4);

  if (!account) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <Card>
          <CardContent className="pt-6 text-center">
            <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">
              Connect your wallet to view staking information
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Staking Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Stake SUI to demonstrate commitment and earn reputation bonuses
        </p>
      </div>

      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>How staking works:</strong> Stake SUI when submitting labels to show commitment to quality work. 
          Your stake is returned after successful completion. Poor quality work may result in stake slashing.
        </AlertDescription>
      </Alert>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              Total Staked
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{totalStakedSUI} SUI</p>
            <p className="text-xs text-muted-foreground mt-1">
              Across {stakes.length} task{stakes.length !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Lock className="h-4 w-4 text-muted-foreground" />
              Locked Stakes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">
              {stakes.filter(s => s.isLocked).length}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Currently locked
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              Reputation Bonus
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-purple-600">
              +{(stakes.length * 5)}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              From staking activity
            </p>
          </CardContent>
        </Card>
      </div>

      {/* My Stakes */}
      <Card>
        <CardHeader>
          <CardTitle>My Stakes</CardTitle>
          <CardDescription>
            View and manage your active stakes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingStakes ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : stakes.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">
                You haven&apos;t staked for any tasks yet
              </p>
              <Button onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" })}>
                Browse Tasks to Stake
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {stakes.map((stake) => (
                <div
                  key={stake.objectId}
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">Labeler Stake</h3>
                        <Badge variant={!stake.isLocked ? "default" : "secondary"}>
                          {!stake.isLocked ? "Can Withdraw" : "Locked"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground font-mono">
                        {stake.objectId.slice(0, 20)}...
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-green-600">
                        {(Number(stake.stakeValue) / 1_000_000_000).toFixed(4)} SUI
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Locked until {new Date(stake.lockedUntil).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {!stake.isLocked ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span>Lock period expired - Ready to withdraw</span>
                        </>
                      ) : (
                        <>
                          <Lock className="h-4 w-4" />
                          <span>Locked until {new Date(stake.lockedUntil).toLocaleString()}</span>
                        </>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {!stake.isLocked && (
                        <Button
                          size="sm"
                          onClick={() => handleUnstake(stake.objectId)}
                          disabled={isUnstaking}
                        >
                          {isUnstaking ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <Unlock className="h-4 w-4 mr-2" />
                          )}
                          Withdraw
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {stake.slashedAmount > 0 && (
                    <Alert className="mt-3" variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Slashed amount: {(stake.slashedAmount / 1_000_000_000).toFixed(4)} SUI
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Tasks to Stake */}
      <Card>
        <CardHeader>
          <CardTitle>Available Tasks</CardTitle>
          <CardDescription>
            Stake SUI on tasks to increase your reputation and show commitment
          </CardDescription>
        </CardHeader>
        <CardContent>
          {availableTasks.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No tasks available for staking</p>
            </div>
          ) : (
            <div className="space-y-4">
              {availableTasks.slice(0, 5).map((task) => (
                <div
                  key={task.objectId}
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{task.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {task.description}
                      </p>
                    </div>
                    <Badge className="ml-2">
                      {(Number(task.bounty) / 1_000_000_000).toFixed(2)} SUI
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <p className="text-sm text-muted-foreground">
                      {task.currentLabelers} / {task.requiredLabelers} labelers
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                      >
                        <Link href={`/tasks/${task.objectId}`}>
                          <ArrowUpRight className="h-4 w-4 mr-2" />
                          View Task
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleOpenStakeDialog(task)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Shield className="h-4 w-4 mr-2" />
                        Stake & Submit
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stake Dialog */}
      <Dialog open={stakeDialogOpen} onOpenChange={setStakeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Stake for Task</DialogTitle>
            <DialogDescription>
              Stake SUI to show commitment to quality work on this task
            </DialogDescription>
          </DialogHeader>

          {selectedTask && (
            <div className="space-y-4 py-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-medium mb-1">{selectedTask.title}</p>
                <p className="text-sm text-muted-foreground">
                  Bounty: {(Number(selectedTask.bounty) / 1_000_000_000).toFixed(2)} SUI
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="stake-amount">Stake Amount (SUI)</Label>
                <Input
                  id="stake-amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Recommended: 10-20% of bounty amount (
                  {(Number(selectedTask.bounty) / 1_000_000_000 * 0.1).toFixed(2)} - 
                  {(Number(selectedTask.bounty) / 1_000_000_000 * 0.2).toFixed(2)} SUI)
                </p>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Your stake will be locked until task completion. Quality work ensures full stake return.
                  Poor quality may result in stake slashing as determined by consensus.
                </AlertDescription>
              </Alert>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setStakeDialogOpen(false)}
              disabled={isStaking}
            >
              Cancel
            </Button>
            <Button
              onClick={handleStake}
              disabled={isStaking || !stakeAmount || parseFloat(stakeAmount) <= 0}
              className="bg-green-600 hover:bg-green-700"
            >
              {isStaking ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Staking...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Stake SUI
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
