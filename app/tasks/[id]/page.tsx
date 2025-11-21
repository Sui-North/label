"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
} from "@mysten/dapp-kit";
import { useQueryClient } from "@tanstack/react-query";
import { useUserProfile } from "@/hooks/use-user-profile";
import { useTask } from "@/hooks/use-tasks";
import { useTaskSubmissions } from "@/hooks/use-submissions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  DollarSign,
  Users,
  Clock,
  Upload,
  FileText,
  AlertCircle,
  CheckCircle,
  Download,
  Loader2,
} from "lucide-react";
import { uploadToWalrus } from "@/lib/walrus";
import {
  submitLabelsTransaction,
  TASK_REGISTRY_ID,
} from "@/lib/contracts/songsim";
import { UserDisplay } from "@/components/user-display";
import { downloadFromWalrus } from "@/lib/walrus";
import { Navbar } from "@/components/navbar";

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const taskObjectId = params.id as string;
  const account = useCurrentAccount();
  const { data: profile } = useUserProfile();
  const { data: task, isLoading, error: taskError } = useTask(taskObjectId);
  const { data: submissions = [] } = useTaskSubmissions(task?.taskId || null);
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const queryClient = useQueryClient();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [resultFile, setResultFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");

  // Check if user has already submitted
  const hasSubmitted = submissions.some(
    (s) => s.labeler.toLowerCase() === account?.address.toLowerCase()
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        setError("Result file must be less than 50MB");
        return;
      }
      setResultFile(file);
      setError("");
    }
  };

  const handleSubmit = async () => {
    if (!account || !task || !resultFile || !profile?.objectId) return;

    setIsSubmitting(true);
    setError("");
    setSuccess("");
    setUploadProgress(0);

    try {
      // Upload result file to Walrus
      setUploadProgress(20);
      console.log("Uploading result file to Walrus...");

      const uploadResult = await uploadToWalrus(resultFile);
      const resultUrl = uploadResult.url;
      const filename = resultFile.name;
      const contentType = resultFile.type || "application/octet-stream";
      console.log("Result file uploaded successfully:", resultUrl);

      setUploadProgress(60);

      // Check contract configuration
      if (!TASK_REGISTRY_ID) {
        setError("Contract not properly configured. Please contact support.");
        setIsSubmitting(false);
        return;
      }

      // Validate quality tracker ID
      if (!task.qualityTrackerId) {
        setError("Task is missing quality tracker. This may be a legacy task created before V3 upgrade.");
        setIsSubmitting(false);
        return;
      }

      // Create submission transaction using task's object ID
      const tx = submitLabelsTransaction(
        TASK_REGISTRY_ID,
        task.objectId,
        profile.objectId,
        task.qualityTrackerId,
        resultUrl,
        filename,
        contentType
      );

      setUploadProgress(70);

      // Execute transaction
      signAndExecute(
        {
          transaction: tx,
        },
        {
          onSuccess: (result) => {
            console.log("Labels submitted successfully:", result);
            setUploadProgress(100);
            setSuccess(
              "Your submission has been sent successfully! The requester will review it."
            );

            // Invalidate queries
            queryClient.invalidateQueries({ queryKey: ["allSubmissions"] });
            queryClient.invalidateQueries({
              queryKey: ["taskSubmissions", taskObjectId],
            });

            // Clear form
            setResultFile(null);
            setNotes("");

            // Redirect after delay
            setTimeout(() => {
              router.push("/dashboard/submissions");
            }, 2000);
          },
          onError: (error) => {
            console.error("Transaction failed:", error);
            setError(`Failed to submit labels: ${error.message}`);
            setIsSubmitting(false);
            setUploadProgress(0);
          },
        }
      );
    } catch (error) {
      console.error("Error submitting labels:", error);
      setError(
        error instanceof Error ? error.message : "Failed to submit labels"
      );
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading task details...</p>
          </div>
        </div>
      </>
    );
  }

  if (taskError) {
    return (
      <>
        <Navbar />
        <div className="flex items-center justify-center min-h-[400px]">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Error loading task: {taskError.message}
            </AlertDescription>
          </Alert>
        </div>
      </>
    );
  }

  if (!task) {
    return (
      <>
        <Navbar />
        <div className="flex items-center justify-center min-h-[400px]">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Task not found</AlertDescription>
          </Alert>
        </div>
      </>
    );
  }

  const isDeadlinePassed = new Date(parseInt(task.deadline)) < new Date();
  const isFull =
    parseInt(task.currentLabelers) >= parseInt(task.requiredLabelers);
  const canSubmit =
    !isDeadlinePassed && !isFull && task.status === "0" && !hasSubmitted;

  return (
    <>
      <Navbar />
      <div className="container mx-auto p-6 max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">{task.title}</h1>
          <p className="text-muted-foreground">{task.description}</p>
        </div>
        <Badge
          variant={
            task.status === "0"
              ? "default"
              : task.status === "1"
              ? "secondary"
              : task.status === "2"
              ? "outline"
              : "destructive"
          }
        >
          {task.status === "0"
            ? "Open"
            : task.status === "1"
            ? "In Progress"
            : task.status === "2"
            ? "Completed"
            : "Cancelled"}
        </Badge>
      </div>

      {/* Task Info */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Bounty</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-500" />
              <span className="text-2xl font-bold">
                {(parseInt(task.bounty) / 1_000_000_000).toFixed(2)} SUI
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Deadline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-500" />
              <span className="font-medium">
                {new Date(parseInt(task.deadline)).toLocaleDateString()}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Labelers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-500" />
              <span className="font-medium">
                {task.currentLabelers}/{task.requiredLabelers}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="font-medium">{submissions.length}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
          <CardDescription>
            Follow these guidelines to complete the task
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="whitespace-pre-wrap text-sm">{task.instructions}</div>
        </CardContent>
      </Card>

      {/* Dataset */}
      <Card>
        <CardHeader>
          <CardTitle>Dataset</CardTitle>
          <CardDescription>
            Download the dataset to begin labeling
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-blue-500" />
              <div>
                <p className="font-medium">Dataset File</p>
                <p className="text-sm text-muted-foreground">
                  Click to download from Walrus
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
              Download Dataset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Status Messages */}
      {hasSubmitted && (
        <Alert>
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription>
            You have already submitted work for this task. Check the submissions
            page for status.
          </AlertDescription>
        </Alert>
      )}

      {isDeadlinePassed && (
        <Alert variant="destructive">
          <Clock className="h-4 w-4" />
          <AlertDescription>
            This task deadline has passed and is no longer accepting
            submissions.
          </AlertDescription>
        </Alert>
      )}

      {isFull && !hasSubmitted && (
        <Alert variant="destructive">
          <Users className="h-4 w-4" />
          <AlertDescription>
            This task has reached its maximum number of labelers.
          </AlertDescription>
        </Alert>
      )}

      {/* Submission Form */}
      {canSubmit ? (
        <Card>
          <CardHeader>
            <CardTitle>Submit Your Work</CardTitle>
            <CardDescription>
              Upload your completed labels and submit for review
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-500 bg-green-500/10">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-600">
                  {success}
                </AlertDescription>
              </Alert>
            )}

            {/* Result File Upload */}
            <div className="space-y-2">
              <Label htmlFor="result">Result File *</Label>
              <div className="flex items-center gap-2">
                <input
                  id="result"
                  type="file"
                  onChange={handleFileChange}
                  disabled={isSubmitting}
                  className="flex-1"
                  accept=".csv,.json,.txt,.zip"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                CSV, JSON, TXT, or ZIP file. Max 50MB.
              </p>
              {resultFile && (
                <p className="text-sm text-green-600">
                  Selected: {resultFile.name}
                </p>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Submission Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes, observations, or clarifications about your work..."
                disabled={isSubmitting}
                rows={4}
              />
            </div>

            {/* Submit Button */}
            <div className="flex gap-3">
              <Button
                onClick={handleSubmit}
                disabled={!resultFile || isSubmitting}
                className="flex-1"
                size="lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Submit Work
                  </>
                )}
              </Button>
            </div>

            {/* Upload Progress */}
            {isSubmitting && uploadProgress > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Uploading and submitting...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} />
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}

      {/* Requester Info */}
      <Card>
        <CardHeader>
          <CardTitle>Task Requester</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <UserDisplay
              address={task.requester}
              size="md"
              showAddress={true}
              showBadge={true}
            />
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Task ID</span>
              <Badge variant="outline">#{task.taskId}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Created</span>
              <span className="text-sm">
                {new Date(parseInt(task.createdAt)).toLocaleDateString()}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
    </>
  );
}
