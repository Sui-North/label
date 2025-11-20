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
      <Badge variant="outline" className="text-blue-600">
        Task
      </Badge>
    );
  };

  const TaskCard = ({ task }: { task: (typeof allTasks)[0] }) => {
    const spotsRemaining =
      parseInt(task.requiredLabelers) - parseInt(task.currentLabelers);
    const progress =
      (parseInt(task.currentLabelers) / parseInt(task.requiredLabelers)) * 100;

    return (
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-xl mb-2">{task.title}</CardTitle>
              <CardDescription className="line-clamp-2">
                {task.description}
              </CardDescription>
            </div>
            {getDifficultyBadge()}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground text-xs">Bounty</p>
                  <p className="font-semibold">
                    {(parseInt(task.bounty) / 1_000_000_000).toFixed(2)} SUI
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground text-xs">Deadline</p>
                  <p className="font-semibold">
                    {new Date(parseInt(task.deadline)).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground text-xs">Spots Left</p>
                  <p className="font-semibold">{spotsRemaining}</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">
                  {task.currentLabelers}/{task.requiredLabelers} labelers
                </span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div
                  className="bg-primary rounded-full h-2 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Badge variant="secondary">Task #{task.taskId}</Badge>
              <Button asChild>
                <Link href={`/tasks/${task.objectId}`}>View Task</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-red-600 mb-4">Error loading tasks</p>
            <p className="text-sm text-muted-foreground">{error.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Available Tasks</h1>
        <p className="text-muted-foreground mt-1">
          Browse and claim labeling tasks to earn rewards
        </p>
      </div>

      {/* Filters and Search */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="md:col-span-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Image">Image</SelectItem>
                  <SelectItem value="Text">Text</SelectItem>
                  <SelectItem value="Audio">Audio</SelectItem>
                  <SelectItem value="Video">Video</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <TrendingUp className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bounty-high">Highest Bounty</SelectItem>
                  <SelectItem value="bounty-low">Lowest Bounty</SelectItem>
                  <SelectItem value="deadline-soon">Deadline (Soon)</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Task Results */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filteredTasks.length} task{filteredTasks.length !== 1 ? "s" : ""}{" "}
          available
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {filteredTasks.length > 0 ? (
          filteredTasks.map((task) => (
            <TaskCard key={task.objectId} task={task} />
          ))
        ) : (
          <Card className="md:col-span-2">
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground">
                No tasks found matching your criteria
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
