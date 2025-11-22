"use client";

import { useState } from "react";
import { Plus, Trophy, Users, Calendar, Award, Loader2, AlertCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { usePrizePools } from "@/hooks/use-prize-pools";
import { useCurrentAccount } from "@mysten/dapp-kit";

export default function PrizePoolsPage() {
  const account = useCurrentAccount();
  const { activePools, endedPools, isLoadingPools, isCreating, isJoining, createPool, joinPool } = usePrizePools();
  
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    prizeAmount: "",
    startTime: "",
    endTime: "",
    minSubmissions: "",
    winnersCount: "",
  });

  const handleCreatePool = async () => {
    const startTime = new Date(formData.startTime).getTime();
    const endTime = new Date(formData.endTime).getTime();

    const success = await createPool(
      formData.name,
      formData.description,
      parseFloat(formData.prizeAmount),
      startTime,
      endTime,
      parseInt(formData.minSubmissions),
      parseInt(formData.winnersCount)
    );

    if (success) {
      setCreateDialogOpen(false);
      setFormData({
        name: "",
        description: "",
        prizeAmount: "",
        startTime: "",
        endTime: "",
        minSubmissions: "",
        winnersCount: "",
      });
    }
  };

  const handleJoinPool = async (poolObjectId: string, poolName: string) => {
    await joinPool(poolObjectId, poolName);
  };

  const formatSUI = (mist: string) => {
    return (Number(mist) / 1_000_000_000).toFixed(2);
  };

  const formatDate = (timestamp: string) => {
    return new Date(Number(timestamp)).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getStatusBadge = (status: number) => {
    switch (status) {
      case 0:
        return <Badge className="bg-green-500/10 text-green-600 border-green-200 dark:border-green-800 hover:bg-green-500/20">Active</Badge>;
      case 1:
        return <Badge variant="secondary">Ended</Badge>;
      case 2:
        return <Badge variant="outline" className="border-primary/20 text-primary">Distributed</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">Prize Pools</h1>
          <p className="text-muted-foreground mt-1">
            Compete for prizes by completing high-quality labeling tasks
          </p>
        </div>
        
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all">
              <Plus className="mr-2 h-4 w-4" />
              Create Pool
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] glass-card border-primary/20">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-primary">Create Prize Pool</DialogTitle>
              <DialogDescription>
                Create a competition prize pool for labelers
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Pool Name</Label>
                <Input
                  id="name"
                  placeholder="Q1 2026 Labeling Competition"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-background/50"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Compete for prizes by completing the most tasks with highest quality..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="bg-background/50"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="prize">Prize Amount (SUI)</Label>
                  <Input
                    id="prize"
                    type="number"
                    step="0.01"
                    placeholder="100"
                    value={formData.prizeAmount}
                    onChange={(e) => setFormData({ ...formData, prizeAmount: e.target.value })}
                    className="bg-background/50"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="winners">Winners</Label>
                  <Input
                    id="winners"
                    type="number"
                    placeholder="3"
                    value={formData.winnersCount}
                    onChange={(e) => setFormData({ ...formData, winnersCount: e.target.value })}
                    className="bg-background/50"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="start">Start Date</Label>
                  <Input
                    id="start"
                    type="datetime-local"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="bg-background/50"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="end">End Date</Label>
                  <Input
                    id="end"
                    type="datetime-local"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="bg-background/50"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="minSubs">Minimum Submissions</Label>
                <Input
                  id="minSubs"
                  type="number"
                  placeholder="10"
                  value={formData.minSubmissions}
                  onChange={(e) => setFormData({ ...formData, minSubmissions: e.target.value })}
                  className="bg-background/50"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreatePool} disabled={isCreating} className="w-full sm:w-auto">
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Pool"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="active" className="space-y-6">
        <TabsList className="bg-muted/50 p-1 rounded-xl">
          <TabsTrigger value="active" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
            Active <Badge variant="secondary" className="ml-2 h-5 px-1.5">{activePools.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="ended" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
            Ended <Badge variant="secondary" className="ml-2 h-5 px-1.5">{endedPools.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
          {isLoadingPools ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Loading prize pools...</p>
            </div>
          ) : activePools.length === 0 ? (
            <Card className="glass-card border-dashed">
              <CardContent className="py-16">
                <div className="text-center space-y-4">
                  <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                    <Trophy className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                  <h3 className="text-lg font-semibold">No active prize pools</h3>
                  <p className="text-muted-foreground max-w-sm mx-auto">
                    Check back later or create your own prize pool to start a competition.
                  </p>
                  <Button variant="outline" onClick={() => setCreateDialogOpen(true)}>
                    Create First Pool
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {activePools.map((pool) => (
                <Card key={pool.objectId} className="glass-card hover:border-primary/30 transition-all duration-300 group flex flex-col h-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <CardTitle className="text-xl group-hover:text-primary transition-colors">{pool.name}</CardTitle>
                        <CardDescription className="line-clamp-2">{pool.description}</CardDescription>
                      </div>
                      {getStatusBadge(pool.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 flex-1">
                    <div className="p-4 bg-muted/30 rounded-xl border space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-2">
                          <Trophy className="h-4 w-4 text-yellow-500" />
                          Prize Pool
                        </span>
                        <span className="font-bold text-primary">{formatSUI(pool.total_amount)} SUI</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-2">
                          <Award className="h-4 w-4 text-purple-500" />
                          Winners
                        </span>
                        <span className="font-medium">{pool.winners_count}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-2">
                          <Users className="h-4 w-4 text-blue-500" />
                          Participants
                        </span>
                        <span className="font-medium">{pool.participant_count} / {pool.min_submissions}+</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-green-500" />
                          Ends
                        </span>
                        <span className="font-medium">{formatDate(pool.end_time)}</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <Button 
                      className="w-full shadow-md shadow-primary/10 group-hover:shadow-primary/30 transition-all" 
                      onClick={() => handleJoinPool(pool.objectId, pool.name)}
                      disabled={isJoining || !account}
                    >
                      {isJoining ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Joining...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Join Pool
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="ended" className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
          {endedPools.length === 0 ? (
            <Card className="glass-card border-dashed">
              <CardContent className="py-16">
                <div className="text-center space-y-4">
                  <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                    <Trophy className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                  <h3 className="text-lg font-semibold">No ended pools</h3>
                  <p className="text-muted-foreground">
                    Past competitions will appear here
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {endedPools.map((pool) => (
                <Card key={pool.objectId} className="glass-card opacity-80 hover:opacity-100 transition-opacity">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <CardTitle className="text-xl text-muted-foreground">{pool.name}</CardTitle>
                        <CardDescription className="line-clamp-1">{pool.description}</CardDescription>
                      </div>
                      {getStatusBadge(pool.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-muted/30 rounded-xl border space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Prize Pool</span>
                        <span className="font-semibold">{formatSUI(pool.total_amount)} SUI</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Winners</span>
                        <span>{pool.winners_count}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Participants</span>
                        <span>{pool.participant_count}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Ended</span>
                        <span>{formatDate(pool.end_time)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
