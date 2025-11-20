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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  DollarSign,
  Calendar,
  FileText,
  Loader2,
  Download,
  Users,
} from "lucide-react";
import { useMySubmissions } from "@/hooks/use-submissions";
import { useAllTasks } from "@/hooks/use-tasks";
import { ReviewSubmissionDialog } from "@/components/review-submission-dialog";
import { downloadFromWalrus } from "@/lib/walrus";

export default function MySubmissionsPage() {
  const account = useCurrentAccount();
  const { data: submissions = [], isLoading, error } = useMySubmissions();
  const { data: allTasks = [] } = useAllTasks();
  const [selectedTask, setSelectedTask] = useState<(typeof allTasks)[0] | null>(
    null
  );
  const [viewSubmission, setViewSubmission] = useState<
    (typeof submissions)[0] | null
  >(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  // Group submissions by status
  const pendingSubmissions = submissions.filter((s) => s.status === "0"); // Pending
  const acceptedSubmissions = submissions.filter((s) => s.status === "1"); // Accepted
  const rejectedSubmissions = submissions.filter((s) => s.status === "2"); // Rejected

  // Calculate total earned from accepted submissions
  // Note: bounty amount will need to be fetched from task objects
  const totalEarned = acceptedSubmissions.length * 0; // Placeholder

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "0": // Pending
        return (
          <Badge className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400">
            <Clock className="h-3 w-3 mr-1" />
            Pending Review
          </Badge>
        );
      case "1": // Accepted
        return (
          <Badge className="bg-green-500/10 text-green-600 dark:text-green-400">
            <CheckCircle className="h-3 w-3 mr-1" />
            Accepted
          </Badge>
        );
      case "2": // Rejected
        return (
          <Badge className="bg-red-500/10 text-red-600 dark:text-red-400">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return null;
    }
  };

  const SubmissionCard = ({
    submission,
  }: {
    submission: (typeof submissions)[0];
  }) => {
    // Find the task for this submission by matching task_id (numeric ID)
    const task = allTasks.find((t) => t.taskId === submission.taskId);

    return (
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-xl mb-2">
                {task?.title || "Unknown Task"}
              </CardTitle>
              <CardDescription>
                Submission ID: {submission.submissionId}
              </CardDescription>
            </div>
            {getStatusBadge(submission.status)}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              {task && (
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground text-xs">Bounty</p>
                    <p className="font-semibold">
                      {(parseInt(task.bounty) / 1_000_000_000).toFixed(2)} SUI
                    </p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground text-xs">Submitted</p>
                  <p className="font-semibold">
                    {new Date(
                      parseInt(submission.submittedAt)
                    ).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedTask(task ?? null)}
                disabled={!task}
              >
                <Eye className="h-4 w-4 mr-2" />
                View Task
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setViewSubmission(submission);
                  setViewDialogOpen(true);
                }}
              >
                <FileText className="h-4 w-4 mr-2" />
                View Submission
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
            <p className="text-red-600 mb-4">Error loading submissions</p>
            <p className="text-sm text-muted-foreground">{error.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">My Submissions</h1>
        <p className="text-muted-foreground mt-1">
          Track your labeling submissions and earnings
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Submissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{submissions.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Accepted
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">
              {acceptedSubmissions.length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-yellow-600">
              {pendingSubmissions.length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Earned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalEarned.toFixed(2)} SUI</p>
          </CardContent>
        </Card>
      </div>

      {/* Submissions List */}
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">All ({submissions.length})</TabsTrigger>
          <TabsTrigger value="pending">
            Pending ({pendingSubmissions.length})
          </TabsTrigger>
          <TabsTrigger value="accepted">
            Accepted ({acceptedSubmissions.length})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejected ({rejectedSubmissions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {submissions.length > 0 ? (
            submissions.map((submission) => (
              <SubmissionCard
                key={submission.submissionId}
                submission={submission}
              />
            ))
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-muted-foreground mb-4">No submissions yet</p>
                <Button asChild>
                  <Link href="/dashboard/available">
                    Browse Available Tasks
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          {pendingSubmissions.length > 0 ? (
            pendingSubmissions.map((submission) => (
              <SubmissionCard
                key={submission.submissionId}
                submission={submission}
              />
            ))
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-muted-foreground">No pending submissions</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="accepted" className="space-y-4">
          {acceptedSubmissions.length > 0 ? (
            acceptedSubmissions.map((submission) => (
              <SubmissionCard
                key={submission.submissionId}
                submission={submission}
              />
            ))
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-muted-foreground">
                  No accepted submissions yet
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4">
          {rejectedSubmissions.length > 0 ? (
            rejectedSubmissions.map((submission) => (
              <SubmissionCard
                key={submission.submissionId}
                submission={submission}
              />
            ))
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-muted-foreground">No rejected submissions</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Task Details Dialog */}
      <Dialog
        open={!!selectedTask}
        onOpenChange={(open) => !open && setSelectedTask(null)}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedTask?.title}</DialogTitle>
            <DialogDescription>Task Details</DialogDescription>
          </DialogHeader>

          {selectedTask && (
            <div className="space-y-6">
              {/* Task Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Bounty</p>
                    <p className="font-semibold">
                      {(parseInt(selectedTask.bounty) / 1_000_000_000).toFixed(
                        2
                      )}{" "}
                      SUI
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Deadline</p>
                    <p className="font-semibold">
                      {new Date(
                        parseInt(selectedTask.deadline)
                      ).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Progress</p>
                    <p className="font-semibold">
                      {selectedTask.currentLabelers} /{" "}
                      {selectedTask.requiredLabelers}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <p className="font-semibold capitalize">
                      {selectedTask.status === "0"
                        ? "Open"
                        : selectedTask.status === "1"
                        ? "In Progress"
                        : selectedTask.status === "2"
                        ? "Completed"
                        : selectedTask.status === "3"
                        ? "Cancelled"
                        : "Unknown"}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Description */}
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {selectedTask.description}
                </p>
              </div>

              {/* Instructions */}
              <div>
                <h3 className="font-semibold mb-2">Instructions</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {selectedTask.instructions}
                </p>
              </div>

              <Separator />

              {/* Dataset */}
              <div>
                <h3 className="font-semibold mb-2">Dataset</h3>
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">
                        {selectedTask.datasetFilename}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {selectedTask.datasetContentType}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      downloadFromWalrus(
                        selectedTask.datasetUrl,
                        selectedTask.datasetFilename || "dataset.csv"
                      )
                    }
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ReviewSubmissionDialog
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
        submission={viewSubmission}
      />
    </div>
  );
}
