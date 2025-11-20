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
} from "lucide-react";
import { useMyTasks } from "@/hooks/use-tasks";
import { useTaskSubmissions } from "@/hooks/use-submissions";
import { cancelTaskTransaction } from "@/lib/contracts/songsim";
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

export default function MyTasksPage() {
  const account = useCurrentAccount();
  const { data: tasks = [], isLoading, error } = useMyTasks();

  // Group tasks by status (aligned with contract constants)
  const activeTasks = tasks.filter((t) => t.status === "0" || t.status === "1"); // Open or In Progress
  const completedTasks = tasks.filter((t) => t.status === "2"); // Completed
  const cancelledTasks = tasks.filter((t) => t.status === "3"); // Cancelled

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "0": // Open/Active
        return (
          <Badge className="bg-green-500/10 text-green-600 dark:text-green-400">
            <Clock className="h-3 w-3 mr-1" />
            Open
          </Badge>
        );
      case "1": // In Progress
        return (
          <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <Users className="h-3 w-3 mr-1" />
            In Progress
          </Badge>
        );
      case "2": // Completed
        return (
          <Badge className="bg-purple-500/10 text-purple-600 dark:text-purple-400">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case "3": // Cancelled
        return (
          <Badge className="bg-red-500/10 text-red-600 dark:text-red-400">
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

      setIsCancelling(true);
      try {
        const tx = cancelTaskTransaction(task.objectId);

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
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-xl mb-2">{task.title}</CardTitle>
              <CardDescription>{task.description}</CardDescription>
            </div>
            {getStatusBadge(task.status)}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground mb-1">Bounty</p>
                <p className="font-semibold">
                  {(parseInt(task.bounty) / 1_000_000_000).toFixed(2)} SUI
                </p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Deadline</p>
                <p className="font-semibold">
                  {new Date(parseInt(task.deadline)).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Labelers</p>
                <p className="font-semibold flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {task.currentLabelers}/{task.requiredLabelers}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Submissions</p>
                <p className="font-semibold">
                  {acceptedSubmissions.length}/{submissions.length}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href={`/dashboard/tasks/${task.objectId}`}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </Link>
              </Button>
              {task.status === "0" && (
                <>
                  <Button variant="outline" size="sm" disabled>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600"
                        disabled={submissions.length > 0 || isCancelling}
                      >
                        {isCancelling ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4 mr-2" />
                        )}
                        Cancel
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Cancel Task</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to cancel this task? This action
                          cannot be undone.
                          {submissions.length > 0 && (
                            <span className="text-red-600 block mt-2">
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
                </>
              )}
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
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Tasks</h1>
          <p className="text-muted-foreground mt-1">
            Manage your created labeling tasks
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/create-task">
            <Plus className="h-4 w-4 mr-2" />
            Create Task
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="active" className="space-y-6">
        <TabsList>
          <TabsTrigger value="active">
            Active ({activeTasks.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({completedTasks.length})
          </TabsTrigger>
          <TabsTrigger value="cancelled">
            Cancelled ({cancelledTasks.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {activeTasks.length > 0 ? (
            activeTasks.map((task) => (
              <TaskCard key={task.objectId} task={task} />
            ))
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-muted-foreground mb-4">
                  No active tasks yet
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

        <TabsContent value="completed" className="space-y-4">
          {completedTasks.length > 0 ? (
            completedTasks.map((task) => (
              <TaskCard key={task.objectId} task={task} />
            ))
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-muted-foreground">No completed tasks yet</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="cancelled" className="space-y-4">
          {cancelledTasks.length > 0 ? (
            cancelledTasks.map((task) => (
              <TaskCard key={task.objectId} task={task} />
            ))
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-muted-foreground">No cancelled tasks</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
