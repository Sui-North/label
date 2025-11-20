"use client";

import { useState, use, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
} from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { useQueryClient } from "@tanstack/react-query";
import { useTask } from "@/hooks/use-tasks";
import { useTaskSubmissions } from "@/hooks/use-submissions";
import { useConsensus } from "@/hooks/use-consensus";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Calendar,
  DollarSign,
  Users,
  Clock,
  FileText,
  Download,
  CheckCircle,
  XCircle,
  Loader2,
  ArrowLeft,
  Edit,
  Trash2,
  AlertCircle,
} from "lucide-react";
import {
  TASK_REGISTRY_ID,
  PLATFORM_CONFIG_ID,
  PACKAGE_ID,
  finalizeConsensusTransaction,
} from "@/lib/contracts/songsim";
import { toast } from "sonner";
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
import { UserDisplay } from "@/components/user-display";
import { ConsensusDialog } from "@/components/consensus-dialog";
import { ReviewSubmissionDialog } from "@/components/review-submission-dialog";
import { downloadFromWalrus } from "@/lib/walrus";
import { ProcessedSubmission } from "@/hooks/use-submissions";

// Component for deadline status that can use Date.now()
function DeadlineStatus({ deadline }: { deadline: number }) {
  const [now] = useState(() => Date.now());
  const daysRemaining = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));

  return (
    <p className="text-sm text-muted-foreground">
      {daysRemaining > 0 ? `${daysRemaining} days remaining` : "Expired"}
    </p>
  );
}

export default function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const taskObjectId = resolvedParams.id;
  const router = useRouter();
  const account = useCurrentAccount();
  const { data: task, isLoading, error: taskError } = useTask(taskObjectId);
  const { data: submissions = [] } = useTaskSubmissions(task?.taskId || null);
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const queryClient = useQueryClient();

  const [isCancelling, setIsCancelling] = useState(false);
  const [consensusDialogOpen, setConsensusDialogOpen] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] =
    useState<ProcessedSubmission | null>(null);
  const [error, setError] = useState("");

  // Use the consensus hook for state management
  const {
    selectedAccepted,
    selectedRejected,
    toggleAccept,
    toggleReject,
    finalizeConsensus,
    isProcessing: isFinalizingConsensus,
  } = useConsensus(taskObjectId, task?.taskId || "");

  // Toggle functions are now provided by useConsensus hook

  const handleFinalizeConsensus = async (
    acceptedIds: number[],
    rejectedIds: number[]
  ) => {
    if (!task) return;

    // Extract labeler addresses for accepted submissions
    const acceptedLabelers = submissions
      .filter((s) => acceptedIds.includes(parseInt(s.submissionId)))
      .map((s) => s.labeler);

    // Use the hook's finalizeConsensus method
    await finalizeConsensus(acceptedIds, acceptedLabelers, rejectedIds);
    setConsensusDialogOpen(false);
  };

  const handleCancelTask = async () => {
    if (!account || !task || task.status !== "0" || submissions.length > 0)
      return;

    setIsCancelling(true);
    setError("");

    try {
      const tx = new Transaction();

      // Split the bounty amount from gas coin
      const bountyAmount = parseInt(task.bounty);
      const [bountyCoin] = tx.splitCoins(tx.gas, [bountyAmount]);

      // Call cancel_task with the task object and bounty coin
      tx.moveCall({
        target: `${PACKAGE_ID}::songsim::cancel_task`,
        arguments: [tx.object(taskObjectId), bountyCoin],
      });

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
            // Invalidate queries and redirect
            queryClient.invalidateQueries({ queryKey: ["myTasks"] });
            queryClient.invalidateQueries({ queryKey: ["allTasks"] });
            queryClient.invalidateQueries({
              queryKey: ["task", taskObjectId],
            });
            // Redirect to tasks list after a short delay
            setTimeout(() => {
              router.push("/dashboard/tasks");
            }, 1500);
          },
          onError: (error) => {
            console.error("Cancel task error:", error);
            const errorMsg =
              error.message || "Failed to cancel task. Please try again.";
            setError(errorMsg);
            toast.error("Failed to cancel task", {
              description: errorMsg,
            });
            setIsCancelling(false);
          },
        }
      );
    } catch (error) {
      console.error("Cancel task error:", error);
      const errorMsg =
        error instanceof Error ? error.message : "Failed to cancel task";
      setError(errorMsg);
      toast.error("Failed to cancel task", {
        description: errorMsg,
      });
      setIsCancelling(false);
    }
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

  if (taskError || !task) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-red-600 mb-4">Error loading task</p>
            <Button onClick={() => router.push("/dashboard/tasks")}>
              Back to My Tasks
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if user is the task owner
  const isOwner =
    account?.address.toLowerCase() === task.requester.toLowerCase();

  if (!isOwner) {
    router.push("/dashboard/tasks");
    return null;
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "0": // Open
        return (
          <Badge className="bg-green-500/10 text-green-600 dark:text-green-400">
            <Clock className="h-3 w-3 mr-1" />
            Active
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

  const getSubmissionStatusBadge = (status: string) => {
    switch (status) {
      case "0":
        return (
          <Badge variant="outline" className="text-yellow-600">
            Pending
          </Badge>
        );
      case "1":
        return (
          <Badge variant="outline" className="text-green-600">
            Accepted
          </Badge>
        );
      case "2":
        return (
          <Badge variant="outline" className="text-red-600">
            Rejected
          </Badge>
        );
      default:
        return null;
    }
  };

  const pendingSubmissions = submissions.filter((s) => s.status === "0");
  const acceptedSubmissions = submissions.filter((s) => s.status === "1");
  const rejectedSubmissions = submissions.filter((s) => s.status === "2");

  const bountySUI = (parseInt(task.bounty) / 1_000_000_000).toFixed(2);

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/dashboard/tasks")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{task.title}</h1>
            <p className="text-muted-foreground mt-1">Task #{task.taskId}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(task.status)}
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{task.description}</p>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>Instructions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{task.instructions}</p>
            </CardContent>
          </Card>

          {/* Dataset */}
          <Card>
            <CardHeader>
              <CardTitle>Dataset</CardTitle>
              <CardDescription>Original dataset file</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="font-medium">
                      {task.datasetFilename || "Dataset File"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {task.datasetContentType || "Unknown type"}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() =>
                    downloadFromWalrus(
                      task.datasetUrl,
                      task.datasetFilename || `task-${task.taskId}-dataset.csv`
                    )
                  }
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Submissions */}
          <Card>
            <CardHeader>
              <CardTitle>Submissions</CardTitle>
              <CardDescription>
                {submissions.length} total submission
                {submissions.length !== 1 ? "s" : ""}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {submissions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No submissions yet
                </div>
              ) : (
                <div className="space-y-4">
                  {submissions.map((submission) => (
                    <div
                      key={submission.submissionId}
                      className="border rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <p className="font-medium mb-2">
                            Submission #{submission.submissionId}
                          </p>
                          <UserDisplay
                            address={submission.labeler}
                            size="sm"
                            showAddress={false}
                          />
                        </div>
                        {getSubmissionStatusBadge(submission.status)}
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                          Submitted{" "}
                          {new Date(
                            parseInt(submission.submittedAt)
                          ).toLocaleDateString()}
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedSubmission(submission);
                            setReviewDialogOpen(true);
                          }}
                        >
                          Review
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Task Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <DollarSign className="h-4 w-4" />
                  <span className="text-sm">Total Bounty</span>
                </div>
                <p className="text-2xl font-bold text-green-600">
                  {bountySUI} SUI
                </p>
              </div>

              <Separator />

              <div>
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm">Deadline</span>
                </div>
                <p className="font-medium">
                  {new Date(parseInt(task.deadline)).toLocaleDateString()}
                </p>
                <DeadlineStatus deadline={parseInt(task.deadline)} />
              </div>

              <Separator />

              <div>
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Users className="h-4 w-4" />
                  <span className="text-sm">Labelers Progress</span>
                </div>
                <p className="font-medium">
                  {task.currentLabelers} / {task.requiredLabelers}
                </p>
              </div>

              <Separator />

              <div>
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm">Submissions</span>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <div className="text-center">
                    <p className="text-lg font-bold text-yellow-600">
                      {pendingSubmissions.length}
                    </p>
                    <p className="text-xs text-muted-foreground">Pending</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-green-600">
                      {acceptedSubmissions.length}
                    </p>
                    <p className="text-xs text-muted-foreground">Accepted</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-red-600">
                      {rejectedSubmissions.length}
                    </p>
                    <p className="text-xs text-muted-foreground">Rejected</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">Created</span>
                </div>
                <p className="font-medium">
                  {new Date(parseInt(task.createdAt)).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          {task.status === "0" && (
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full" disabled>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Task
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full text-red-600"
                      disabled={
                        isCancelling ||
                        submissions.length > 0 ||
                        task.status !== "0"
                      }
                    >
                      {isCancelling ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 mr-2" />
                      )}
                      Cancel Task
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Cancel Task</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to cancel this task? This action
                        cannot be undone and the bounty will be refunded to your
                        wallet.
                        {submissions.length > 0 && (
                          <span className="text-red-600 block mt-2 font-semibold">
                            Note: This task has {submissions.length}{" "}
                            submission(s) and cannot be cancelled.
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
                {submissions.length > 0 && (
                  <p className="text-xs text-muted-foreground text-center">
                    Cannot cancel task with submissions
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Finalize Consensus */}
          {task.status === "1" && pendingSubmissions.length > 0 && (
            <Card className="border-green-500">
              <CardHeader>
                <CardTitle className="text-green-600">
                  Ready for Consensus
                </CardTitle>
                <CardDescription>
                  {pendingSubmissions.length} submission
                  {pendingSubmissions.length !== 1 ? "s" : ""} ready to review
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={() => setConsensusDialogOpen(true)}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Finalize Consensus
                </Button>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Review and accept/reject submissions
                </p>
              </CardContent>
            </Card>
          )}

          {/* Waiting for Labelers Message */}
          {task.status === "0" && pendingSubmissions.length > 0 && (
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-muted-foreground">
                  Waiting for Labelers
                </CardTitle>
                <CardDescription>
                  {parseInt(task.requiredLabelers) -
                    parseInt(task.currentLabelers)}{" "}
                  more submission(s) needed to start consensus.
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </div>
      </div>

      {/* Consensus Dialog */}
      <ConsensusDialog
        open={consensusDialogOpen}
        onOpenChange={setConsensusDialogOpen}
        submissions={submissions}
        taskId={task.taskId}
        bountyAmount={task.bounty}
        requiredLabelers={parseInt(task.requiredLabelers)}
        onFinalize={handleFinalizeConsensus}
        isProcessing={isFinalizingConsensus}
        selectedAccepted={selectedAccepted}
        selectedRejected={selectedRejected}
        onToggleAccept={toggleAccept}
        onToggleReject={toggleReject}
      />

      <ReviewSubmissionDialog
        open={reviewDialogOpen}
        onOpenChange={setReviewDialogOpen}
        submission={selectedSubmission}
        onAccept={toggleAccept}
        onReject={toggleReject}
        currentSelection={
          selectedSubmission
            ? selectedAccepted.has(selectedSubmission.submissionId)
              ? "accepted"
              : selectedRejected.has(selectedSubmission.submissionId)
              ? "rejected"
              : null
            : null
        }
      />
    </div>
  );
}
