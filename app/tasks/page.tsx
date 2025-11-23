"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { UserDisplay } from "@/components/user-display";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Filter,
  Clock,
  DollarSign,
  Users,
  TrendingUp,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useAllTasks } from "@/hooks/use-tasks";

export default function TasksPage() {
  const { data: tasks, isLoading, error } = useAllTasks();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");

  // Filter and sort tasks
  const filteredTasks = useMemo(() => {
    if (!tasks) return [];

    return tasks
      .filter((task) => {
        const matchesSearch = task.title
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
        const matchesStatus =
          statusFilter === "all" ||
          (statusFilter === "open" && (task.status === "0" || task.status === "1")) || // Open or In Progress
          (statusFilter === "completed" && task.status === "2") ||
          (statusFilter === "cancelled" && task.status === "3");
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "newest":
            return Number(b.taskId) - Number(a.taskId);
          case "reward":
            return Number(b.bounty) - Number(a.bounty);
          case "deadline":
            return Number(a.deadline) - Number(b.deadline);
          default:
            return 0;
        }
      });
  }, [tasks, searchQuery, statusFilter, sortBy]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "0":
        return "bg-green-500/10 text-green-600 dark:text-green-400"; // Open
      case "1":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400"; // In Progress
      case "2":
        return "bg-purple-500/10 text-purple-600 dark:text-purple-400"; // Completed
      case "3":
        return "bg-red-500/10 text-red-600 dark:text-red-400"; // Cancelled
      default:
        return "";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "0":
        return "Open";
      case "1":
        return "In Progress";
      case "2":
        return "Completed";
      case "3":
        return "Cancelled";
      default:
        return "Unknown";
    }
  };

  const getDaysRemaining = (deadline: string) => {
    const days = Math.ceil(
      (Number(deadline) - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return days > 0 ? days : 0;
  };

  return (
    <>
      <Navbar />
      <div className="container mx-auto max-w-7xl py-8 space-y-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Browse Tasks</h1>
          <p className="text-muted-foreground">
            Find and complete labeling tasks to earn rewards
          </p>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search tasks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              {/* Sort */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="reward">Highest Reward</SelectItem>
                  <SelectItem value="deadline">Ending Soon</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">
              Loading tasks from blockchain...
            </span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="border-destructive">
            <CardContent className="pt-6 text-center">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <p className="text-destructive font-semibold mb-2">
                Failed to load tasks
              </p>
              <p className="text-sm text-muted-foreground">{error.message}</p>
            </CardContent>
          </Card>
        )}

        {/* Results Count */}
        {!isLoading && !error && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {filteredTasks.length} task
              {filteredTasks.length !== 1 ? "s" : ""}
            </p>
          </div>
        )}

        {/* Task Grid */}
        {!isLoading && !error && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTasks.map((task) => {
              const daysRemaining = getDaysRemaining(task.deadline);
              const bountySUI = (Number(task.bounty) / 1_000_000_000).toFixed(
                2
              );

              return (
                <Card
                  key={task.objectId}
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardHeader className="space-y-3">
                    <div className="flex items-start justify-between">
                      <Badge className={getStatusColor(task.status)}>
                        {getStatusLabel(task.status)}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg line-clamp-2">
                      {task.title}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {task.description}
                    </p>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <div>
                          <p className="font-semibold text-green-600">
                            {bountySUI} SUI
                          </p>
                          <p className="text-xs text-muted-foreground">
                            total bounty
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-orange-600" />
                        <div>
                          <p className="font-semibold">{daysRemaining}d</p>
                          <p className="text-xs text-muted-foreground">
                            remaining
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <Users className="h-4 w-4 text-blue-600" />
                        <div>
                          <p className="font-semibold">
                            {task.requiredLabelers}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            labelers
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <TrendingUp className="h-4 w-4 text-purple-600" />
                        <div>
                          <p className="font-semibold">Task #{task.taskId}</p>
                          <p className="text-xs text-muted-foreground">
                            task ID
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Requester */}
                    <div className="pt-3 border-t">
                      <p className="text-xs text-muted-foreground mb-2">
                        Requester
                      </p>
                      <UserDisplay
                        address={task.requester}
                        size="sm"
                        showAddress={false}
                      />
                    </div>

                    {/* Action Button */}
                    <Button className="w-full" asChild>
                      <Link href={`/tasks/${task.objectId}`}>
                        {task.status === "0"
                          ? "Start Labeling"
                          : "View Details"}
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && filteredTasks.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">
                No tasks found matching your filters
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                }}
              >
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
