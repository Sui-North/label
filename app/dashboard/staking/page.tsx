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
  CardFooter,
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
  Wallet,
  Coins,
  ArrowRight,
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
      <div className="container mx-auto p-6 max-w-7xl animate-in fade-in duration-500">
        <Card className="glass-card border-dashed">
          <CardContent className="pt-12 pb-12 text-center">
            <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Connect Wallet</h3>
            <p className="text-muted-foreground mb-4 max-w-sm mx-auto">
              Connect your wallet to view staking information and manage your stakes.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">Staking Dashboard</h1>
        <p className="text-muted-foreground text-lg">
          Stake SUI to demonstrate commitment, earn reputation bonuses, and unlock higher-tier tasks.
        </p>
      </div>

      {/* Info Alert */}
      <Alert className="bg-primary/5 border-primary/20 text-primary">
        <Info className="h-4 w-4" />
        <AlertDescription className="ml-2">
          <strong>How staking works:</strong> Stake SUI when submitting labels to show commitment to quality work. 
          Your stake is returned after successful completion. Poor quality work may result in stake slashing.
        </AlertDescription>
      </Alert>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="glass-card hover:border-primary/30 transition-colors group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 blur-[50px] rounded-full -z-10 pointer-events-none" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground group-hover:text-primary transition-colors">
              <DollarSign className="h-4 w-4" />
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

        <Card className="glass-card hover:border-primary/30 transition-colors group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[50px] rounded-full -z-10 pointer-events-none" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground group-hover:text-primary transition-colors">
              <Lock className="h-4 w-4" />
              Locked Stakes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">
              {stakes.filter(s => s.isLocked).length}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Currently locked in active tasks
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card hover:border-primary/30 transition-colors group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-[50px] rounded-full -z-10 pointer-events-none" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground group-hover:text-primary transition-colors">
              <TrendingUp className="h-4 w-4" />
              Reputation Bonus
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-purple-600">
              +{(stakes.length * 5)}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Boost from staking activity
            </p>
          </CardContent>
        </Card>
      </div>

      {/* My Stakes */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            My Stakes
          </CardTitle>
          <CardDescription>
            View and manage your active stakes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingStakes ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Loading your stakes...</p>
            </div>
          ) : stakes.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed rounded-xl bg-muted/20">
              <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-semibold mb-2">No Active Stakes</h3>
              <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                You haven&apos;t staked for any tasks yet. Staking helps build trust and increases your reputation.
              </p>
              <Button onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" })} className="shadow-lg shadow-primary/20">
                Browse Tasks to Stake
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {stakes.map((stake) => (
                <Card key={stake.objectId} className="border bg-card/50 hover:bg-card transition-colors overflow-hidden">
                  <div className={`h-1 w-full ${!stake.isLocked ? "bg-green-500" : "bg-blue-500"}`} />
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">Labeler Stake</h3>
                        </div>
                        <p className="text-xs text-muted-foreground font-mono truncate max-w-[120px]">
                          {stake.objectId}
                        </p>
                      </div>
                      <Badge variant={!stake.isLocked ? "default" : "secondary"} className={!stake.isLocked ? "bg-green-500 hover:bg-green-600" : ""}>
                        {!stake.isLocked ? "Unlocked" : "Locked"}
                      </Badge>
                    </div>

                    <div className="py-2">
                      <p className="text-2xl font-bold text-foreground">
                        {(Number(stake.stakeValue) / 1_000_000_000).toFixed(4)} <span className="text-sm font-normal text-muted-foreground">SUI</span>
                      </p>
                    </div>

                    <div className="space-y-2 text-sm bg-muted/30 p-3 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Status</span>
                        <span className="flex items-center gap-1.5 font-medium">
                          {!stake.isLocked ? (
                            <>
                              <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                              <span className="text-green-600">Ready to withdraw</span>
                            </>
                          ) : (
                            <>
                              <Lock className="h-3.5 w-3.5 text-blue-600" />
                              <span className="text-blue-600">Locked</span>
                            </>
                          )}
                        </span>
                      </div>
                      {stake.isLocked && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Unlock Date</span>
                          <span>{new Date(stake.lockedUntil).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                    
                    {stake.slashedAmount > 0 && (
                      <Alert variant="destructive" className="py-2">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-xs ml-2">
                          Slashed: {(stake.slashedAmount / 1_000_000_000).toFixed(4)} SUI
                        </AlertDescription>
                      </Alert>
                    )}

                    {!stake.isLocked && (
                      <Button
                        className="w-full mt-2"
                        variant="outline"
                        onClick={() => handleUnstake(stake.objectId)}
                        disabled={isUnstaking}
                      >
                        {isUnstaking ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Unlock className="h-4 w-4 mr-2" />
                        )}
                        Withdraw Stake
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Tasks to Stake */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-primary" />
            Available Tasks
          </CardTitle>
          <CardDescription>
            Stake SUI on these tasks to increase your reputation and show commitment
          </CardDescription>
        </CardHeader>
        <CardContent>
          {availableTasks.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No tasks available for staking at the moment.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {availableTasks.slice(0, 5).map((task) => (
                <div
                  key={task.objectId}
                  className="group border rounded-xl p-4 hover:bg-muted/40 transition-all hover:border-primary/30 bg-card/30"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">{task.title}</h3>
                        <Badge variant="outline" className="text-xs font-normal">
                          {(Number(task.bounty) / 1_000_000_000).toFixed(2)} SUI Bounty
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {task.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 self-end md:self-center">
                      <div className="text-right hidden md:block">
                        <p className="text-sm font-medium">{task.currentLabelers} / {task.requiredLabelers}</p>
                        <p className="text-xs text-muted-foreground">Labelers</p>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          className="hover:bg-background"
                        >
                          <Link href={`/tasks/${task.objectId}`}>
                            Details
                          </Link>
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleOpenStakeDialog(task)}
                          className="bg-green-600 hover:bg-green-700 shadow-md shadow-green-600/20"
                        >
                          <Shield className="h-4 w-4 mr-2" />
                          Stake & Submit
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter className="border-t bg-muted/20 py-4">
          <Button variant="ghost" className="w-full text-muted-foreground hover:text-primary" asChild>
            <Link href="/dashboard/available">
              View All Available Tasks <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardFooter>
      </Card>

      {/* Stake Dialog */}
      <Dialog open={stakeDialogOpen} onOpenChange={setStakeDialogOpen}>
        <DialogContent className="glass-card border-primary/20 sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Shield className="h-6 w-6 text-green-600" />
              Stake for Task
            </DialogTitle>
            <DialogDescription>
              Stake SUI to show commitment to quality work on this task
            </DialogDescription>
          </DialogHeader>

          {selectedTask && (
            <div className="space-y-6 py-4">
              <div className="p-4 bg-muted/50 rounded-xl border">
                <p className="font-semibold text-lg mb-1">{selectedTask.title}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Coins className="h-4 w-4" />
                  <span>Bounty: <span className="text-foreground font-medium">{(Number(selectedTask.bounty) / 1_000_000_000).toFixed(2)} SUI</span></span>
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="stake-amount" className="text-base">Stake Amount (SUI)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="stake-amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0.00"
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(e.target.value)}
                    className="pl-9 text-lg font-medium bg-background/50"
                  />
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  Recommended: {(Number(selectedTask.bounty) / 1_000_000_000 * 0.1).toFixed(2)} - {(Number(selectedTask.bounty) / 1_000_000_000 * 0.2).toFixed(2)} SUI (10-20%)
                </p>
              </div>

              <Alert className="bg-yellow-500/10 border-yellow-500/20 text-yellow-700 dark:text-yellow-500">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs ml-2 font-medium">
                  Your stake will be locked until task completion. Quality work ensures full stake return.
                  Poor quality may result in stake slashing as determined by consensus.
                </AlertDescription>
              </Alert>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
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
              className="bg-green-600 hover:bg-green-700 shadow-lg shadow-green-600/20"
            >
              {isStaking ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Staking...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Confirm Stake
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
