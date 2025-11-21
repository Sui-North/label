"use client";

import { useState } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import Link from "next/link";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Clock,
  DollarSign,
  Users,
  Search,
  Filter,
  TrendingUp,
  Loader2,
  ArrowUpRight,
  Briefcase,
  Image as ImageIcon,
  Type,
  Mic,
  Video,
} from "lucide-react";
import { useAvailableTasks } from "@/hooks/use-tasks";

export default function AvailableTasksPage() {
  const account = useCurrentAccount();
  const { data: allTasks = [], isLoading, error } = useAvailableTasks();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("bounty-high");
  const [filterCategory, setFilterCategory] = useState("all");

  // Filter and sort tasks
  const filteredTasks = allTasks
    .filter((task) => {
      const matchesSearch =
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description.toLowerCase().includes(searchQuery.toLowerCase());
      // Category filtering can be added when we have category metadata
      return matchesSearch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "bounty-high":
          return parseInt(b.bounty) - parseInt(a.bounty);
        case "bounty-low":
          return parseInt(a.bounty) - parseInt(b.bounty);
        case "deadline-soon":
          return parseInt(a.deadline) - parseInt(b.deadline);
        case "newest":
          return parseInt(b.createdAt) - parseInt(a.createdAt);
        default:
          return 0;
      }
    });

  const getDifficultyBadge = () => {
    // This can be determined based on bounty or other factors
    return (
      <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
        Open Task
      </Badge>
    );
  };

  const TaskCard = ({ task }: { task: (typeof allTasks)[0] }) => {
    const spotsRemaining =
      parseInt(task.requiredLabelers) - parseInt(task.currentLabelers);
    const progress =
      (parseInt(task.currentLabelers) / parseInt(task.requiredLabelers)) * 100;

    return (
      <Card className="glass-card hover:border-primary/50 transition-all duration-300 group h-full flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary" className="bg-secondary/50 text-xs font-mono">
                  #{task.taskId.slice(0, 6)}
                </Badge>
                {getDifficultyBadge()}
              </div>
              <CardTitle className="text-lg font-semibold line-clamp-1 group-hover:text-primary transition-colors">
                {task.title}
              </CardTitle>
              <CardDescription className="line-clamp-2 mt-1">
                {task.description}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col justify-between gap-4">
          <div className="grid grid-cols-3 gap-2 text-sm bg-muted/30 p-3 rounded-lg border">
            <div className="flex flex-col items-center text-center p-1">
              <span className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <DollarSign className="h-3 w-3" /> Bounty
              </span>
              <span className="font-bold text-primary">
                {(parseInt(task.bounty) / 1_000_000_000).toFixed(2)} SUI
              </span>
            </div>
            <div className="flex flex-col items-center text-center p-1 border-x border-border/50">
              <span className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <Clock className="h-3 w-3" /> Deadline
              </span>
              <span className="font-medium">
                {new Date(parseInt(task.deadline)).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </span>
            </div>
            <div className="flex flex-col items-center text-center p-1">
              <span className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <Users className="h-3 w-3" /> Spots
              </span>
              <span className="font-medium">{spotsRemaining} left</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">
                  {Math.round(progress)}% filled
                </span>
              </div>
              <div className="w-full bg-secondary/50 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-primary to-purple-500 rounded-full h-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <Button asChild className="w-full shadow-md shadow-primary/10 group-hover:shadow-primary/30 transition-all">
              <Link href={`/tasks/${task.objectId}`}>
                View Task Details
                <ArrowUpRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl min-h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading available tasks...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="text-center py-12">
            <p className="text-lg font-semibold text-destructive mb-2">Error loading tasks</p>
            <p className="text-sm text-muted-foreground">{error.message}</p>
            <Button 
              variant="outline" 
              className="mt-4" 
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">Available Tasks</h1>
          <p className="text-muted-foreground mt-1">
            Browse and claim labeling tasks to earn rewards
          </p>
        </div>
      </div>

      {/* Filters and Search */}
      <Card className="glass-card">
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-12">
            <div className="md:col-span-5 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks by title or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-background/50"
              />
            </div>
            <div className="md:col-span-3">
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="bg-background/50">
                  <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Image">Image Classification</SelectItem>
                  <SelectItem value="Text">Text Annotation</SelectItem>
                  <SelectItem value="Audio">Audio Transcription</SelectItem>
                  <SelectItem value="Video">Video Labeling</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-4">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="bg-background/50">
                  <TrendingUp className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bounty-high">Highest Bounty</SelectItem>
                  <SelectItem value="bounty-low">Lowest Bounty</SelectItem>
                  <SelectItem value="deadline-soon">Deadline (Soon)</SelectItem>
                  <SelectItem value="newest">Newest Added</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Task Results */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            Task Listings
          </h2>
          <Badge variant="secondary" className="px-3 py-1">
            {filteredTasks.length} task{filteredTasks.length !== 1 ? "s" : ""} found
          </Badge>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredTasks.length > 0 ? (
            filteredTasks.map((task) => (
              <TaskCard key={task.objectId} task={task} />
            ))
          ) : (
            <div className="col-span-full">
              <Card className="glass-card border-dashed">
                <CardContent className="text-center py-16">
                  <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No tasks found</h3>
                  <p className="text-muted-foreground max-w-sm mx-auto">
                    We couldn't find any tasks matching your criteria. Try adjusting your filters or search query.
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-6"
                    onClick={() => {
                      setSearchQuery("");
                      setFilterCategory("all");
                      setSortBy("bounty-high");
                    }}
                  >
                    Clear Filters
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
