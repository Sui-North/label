"use client";

import { useState } from "react";
import { Plus, Trophy, Users, Calendar, Award } from "lucide-react";
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
    return new Date(Number(timestamp)).toLocaleDateString();
  };

  const getStatusBadge = (status: number) => {
    switch (status) {
      case 0:
        return <Badge variant="default">Active</Badge>;
      case 1:
        return <Badge variant="secondary">Ended</Badge>;
      case 2:
        return <Badge variant="outline">Distributed</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Prize Pools</h1>
          <p className="text-muted-foreground">
            Compete for prizes by completing high-quality labeling tasks
          </p>
        </div>
        
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Pool
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create Prize Pool</DialogTitle>
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
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Compete for prizes by completing the most tasks with highest quality..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="prize">Prize Amount (SUI)</Label>
                  <Input
                    id="prize"
                    type="number"
                    step="0.01"
                    placeholder="100"
                    value={formData.prizeAmount}
                    onChange={(e) => setFormData({ ...formData, prizeAmount: e.target.value })}
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
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="start">Start Date</Label>
                  <Input
                    id="start"
                    type="datetime-local"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="end">End Date</Label>
                  <Input
                    id="end"
                    type="datetime-local"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
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
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreatePool} disabled={isCreating}>
                {isCreating ? "Creating..." : "Create Pool"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">
            Active ({activePools.length})
          </TabsTrigger>
          <TabsTrigger value="ended">
            Ended ({endedPools.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {isLoadingPools ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading prize pools...</p>
            </div>
          ) : activePools.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center space-y-2">
                  <Trophy className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="text-lg font-semibold">No active prize pools</h3>
                  <p className="text-sm text-muted-foreground">
                    Check back later or create your own prize pool
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {activePools.map((pool) => (
                <Card key={pool.objectId}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{pool.name}</CardTitle>
                      {getStatusBadge(pool.status)}
                    </div>
                    <CardDescription>{pool.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Trophy className="h-4 w-4" />
                          Prize Pool
                        </span>
                        <span className="font-semibold">{formatSUI(pool.total_amount)} SUI</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Award className="h-4 w-4" />
                          Winners
                        </span>
                        <span>{pool.winners_count}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          Participants
                        </span>
                        <span>{pool.participant_count} / {pool.min_submissions}+</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Ends
                        </span>
                        <span>{formatDate(pool.end_time)}</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full" 
                      onClick={() => handleJoinPool(pool.objectId, pool.name)}
                      disabled={isJoining || !account}
                    >
                      {isJoining ? "Joining..." : "Join Pool"}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="ended" className="space-y-4">
          {endedPools.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center space-y-2">
                  <Trophy className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="text-lg font-semibold">No ended pools</h3>
                  <p className="text-sm text-muted-foreground">
                    Past competitions will appear here
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {endedPools.map((pool) => (
                <Card key={pool.objectId}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{pool.name}</CardTitle>
                      {getStatusBadge(pool.status)}
                    </div>
                    <CardDescription>{pool.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
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
