"use client";

import { useState } from "react";
import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
} from "@mysten/dapp-kit";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Eye,
  Edit,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  Users,
  Loader2,
  Search,
  Filter,
  MoreVertical,
  ArrowUpRight,
  Calendar,
  DollarSign,
} from "lucide-react";
import { useMyTasks } from "@/hooks/use-tasks";
import { useTaskSubmissions } from "@/hooks/use-submissions";
import { cancelTaskTransaction, TASK_REGISTRY_ID } from "@/lib/contracts/songsim";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function MyTasksPage() {
  const account = useCurrentAccount();
  const { data: tasks = [], isLoading, error } = useMyTasks();
  const [searchQuery, setSearchQuery] = useState("");

  // Filter tasks based on search query
  const filteredTasks = tasks.filter(task => 
    task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group tasks by status (aligned with contract constants)
  const activeTasks = filteredTasks.filter((t) => t.status === "0" || t.status === "1"); // Open or In Progress
  const completedTasks = filteredTasks.filter((t) => t.status === "2"); // Completed
  const cancelledTasks = filteredTasks.filter((t) => t.status === "3"); // Cancelled

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "0": // Open/Active
        return (
          <Badge className="bg-green-500/10 text-green-600 border-green-200 dark:border-green-800 hover:bg-green-500/20">
            <Clock className="h-3 w-3 mr-1" />
            Open
          </Badge>
        );
      case "1": // In Progress
        return (
          <Badge className="bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-800 hover:bg-blue-500/20">
            <Users className="h-3 w-3 mr-1" />
            In Progress
          </Badge>
        );
      case "2": // Completed
        return (
          <Badge className="bg-purple-500/10 text-purple-600 border-purple-200 dark:border-purple-800 hover:bg-purple-500/20">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case "3": // Cancelled
        return (
          <Badge className="bg-red-500/10 text-red-600 border-red-200 dark:border-red-800 hover:bg-red-500/20">
            <XCircle className="h-3 w-3 mr-1" />
            Cancelled
          </Badge>
        );
      default:
        return null;
    }
  };

  const TaskCard = ({ task }: { task: (typeof tasks)[0] }) => {
    const { data: submissions = [] } = useTaskSubmissions(task.taskId);
    const acceptedSubmissions = submissions.filter((s) => s.status === "1");
    const [isCancelling, setIsCancelling] = useState(false);
    const { mutate: signAndExecute } = useSignAndExecuteTransaction();
    const queryClient = useQueryClient();

    const handleCancelTask = async () => {
      if (!task || task.status !== "0" || submissions.length > 0) return;
      if (!task.requesterProfileId || !TASK_REGISTRY_ID) {
        toast.error("Missing required data");
        return;
      }

      setIsCancelling(true);
      try {
        const tx = cancelTaskTransaction(TASK_REGISTRY_ID, task.objectId, task.requesterProfileId);

        signAndExecute(
          {
            transaction: tx,
          },
          {
            onSuccess: (result) => {
              console.log("Task cancelled:", result);
              toast.success("Task cancelled successfully", {
                description: "Your bounty has been refunded to your wallet.",
              });
              // Invalidate queries to refresh the task list
              queryClient.invalidateQueries({ queryKey: ["myTasks"] });
              queryClient.invalidateQueries({ queryKey: ["allTasks"] });
            },
            onError: (error) => {
              console.error("Cancel task error:", error);
              toast.error("Failed to cancel task", {
                description: error.message || "Please try again later.",
              });
            },
          }
        );
      } catch (error) {
        console.error("Cancel task error:", error);
        toast.error("Failed to cancel task");
      } finally {
        setIsCancelling(false);
      }
    };

    return (
      <Card className="glass-card hover:border-primary/30 transition-all duration-300 group">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                {getStatusBadge(task.status)}
                <span className="text-xs text-muted-foreground font-mono">ID: {task.taskId.slice(0, 8)}</span>
              </div>
              <CardTitle className="text-lg font-semibold truncate group-hover:text-primary transition-colors">
                {task.title}
              </CardTitle>
              <CardDescription className="line-clamp-2 mt-1">
                {task.description}
              </CardDescription>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link href={`/dashboard/tasks/${task.objectId}`} className="cursor-pointer">
                    <Eye className="h-4 w-4 mr-2" /> View Details
                  </Link>
                </DropdownMenuItem>
                {task.status === "0" && (
                  <>
                    <DropdownMenuItem disabled className="cursor-not-allowed opacity-50">
                      <Edit className="h-4 w-4 mr-2" /> Edit Task
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-red-600 focus:text-red-600 cursor-pointer"
                      disabled={submissions.length > 0 || isCancelling}
                      onSelect={(e) => {
                        e.preventDefault();
                        // We need to trigger the alert dialog here, but since it's inside a dropdown
                        // we'll handle it differently or just use the button below for now
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" /> Cancel Task
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-y border-border/50 bg-muted/20 rounded-lg px-4 mb-4">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <DollarSign className="h-3 w-3" /> Bounty
              </span>
              <span className="font-semibold text-sm">
                {(parseInt(task.bounty) / 1_000_000_000).toFixed(2)} SUI
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Deadline
              </span>
              <span className="font-semibold text-sm">
                {new Date(parseInt(task.deadline)).toLocaleDateString()}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <Users className="h-3 w-3" /> Labelers
              </span>
              <span className="font-semibold text-sm">
                {task.currentLabelers}/{task.requiredLabelers}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <CheckCircle className="h-3 w-3" /> Submissions
              </span>
              <span className="font-semibold text-sm">
                {acceptedSubmissions.length}/{submissions.length}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="flex -space-x-2">
              {/* Placeholder for labeler avatars if we had them */}
              {Array.from({ length: Math.min(3, parseInt(task.currentLabelers)) }).map((_, i) => (
                <div key={i} className="h-8 w-8 rounded-full border-2 border-background bg-muted flex items-center justify-center text-xs font-medium">
                  {String.fromCharCode(65 + i)}
                </div>
              ))}
              {parseInt(task.currentLabelers) > 3 && (
                <div className="h-8 w-8 rounded-full border-2 border-background bg-muted flex items-center justify-center text-xs font-medium">
                  +{parseInt(task.currentLabelers) - 3}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              {task.status === "0" && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                      disabled={submissions.length > 0 || isCancelling}
                    >
                      {isCancelling ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                      <span className="ml-2 sr-only md:not-sr-only">Cancel</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Cancel Task</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to cancel this task? This action
                        cannot be undone.
                        {submissions.length > 0 && (
                          <span className="text-red-600 block mt-2 font-medium">
                            Note: This task has submissions and cannot be
                            cancelled.
                          </span>
                        )}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>No, keep task</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleCancelTask}
                        disabled={submissions.length > 0}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Yes, cancel task
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              
              <Button asChild size="sm" className="shadow-md shadow-primary/20 group-hover:shadow-primary/40 transition-all">
                <Link href={`/dashboard/tasks/${task.objectId}`}>
                  View Details
                  <ArrowUpRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl min-h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading your tasks...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="text-center py-12">
            <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
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
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">My Tasks</h1>
          <p className="text-muted-foreground mt-1">
            Manage and track your created labeling tasks
          </p>
        </div>
        <Button asChild className="shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all">
          <Link href="/dashboard/create-task">
            <Plus className="h-4 w-4 mr-2" />
            Create New Task
          </Link>
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-muted/30 p-4 rounded-xl border">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search tasks..." 
            className="pl-9 bg-background/50"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Button variant="outline" size="icon" className="shrink-0">
            <Filter className="h-4 w-4" />
          </Button>
          <div className="text-sm text-muted-foreground whitespace-nowrap">
            Showing {filteredTasks.length} tasks
          </div>
        </div>
      </div>

      <Tabs defaultValue="active" className="space-y-6">
        <TabsList className="bg-muted/50 p-1 rounded-xl">
          <TabsTrigger value="active" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
            Active <Badge variant="secondary" className="ml-2 h-5 px-1.5">{activeTasks.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="completed" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
            Completed <Badge variant="secondary" className="ml-2 h-5 px-1.5">{completedTasks.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="cancelled" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
            Cancelled <Badge variant="secondary" className="ml-2 h-5 px-1.5">{cancelledTasks.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
          {activeTasks.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2">
              {activeTasks.map((task) => (
                <TaskCard key={task.objectId} task={task} />
              ))}
            </div>
          ) : (
            <Card className="glass-card border-dashed">
              <CardContent className="text-center py-16">
                <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No active tasks</h3>
                <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                  You don't have any active tasks at the moment. Create a new task to get started.
                </p>
                <Button asChild>
                  <Link href="/dashboard/create-task">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Task
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
          {completedTasks.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2">
              {completedTasks.map((task) => (
                <TaskCard key={task.objectId} task={task} />
              ))}
            </div>
          ) : (
            <Card className="glass-card border-dashed">
              <CardContent className="text-center py-16">
                <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No completed tasks</h3>
                <p className="text-muted-foreground">
                  Tasks will appear here once they are completed.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="cancelled" className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
          {cancelledTasks.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2">
              {cancelledTasks.map((task) => (
                <TaskCard key={task.objectId} task={task} />
              ))}
            </div>
          ) : (
            <Card className="glass-card border-dashed">
              <CardContent className="text-center py-16">
                <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <XCircle className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No cancelled tasks</h3>
                <p className="text-muted-foreground">
                  Cancelled tasks will be listed here.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
