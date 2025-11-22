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
  ArrowLeft,
  Share2,
  FileCode,
  CheckCircle2,
  Shield,
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
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
            <Loader2 className="h-12 w-12 animate-spin text-primary relative z-10" />
          </div>
          <p className="text-muted-foreground font-medium">Loading task details...</p>
        </div>
      </>
    );
  }

  if (taskError) {
    return (
      <>
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh] p-4">
          <Alert variant="destructive" className="max-w-md">
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
        <div className="flex items-center justify-center min-h-[60vh] p-4">
          <Alert variant="destructive" className="max-w-md">
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
    <div className="min-h-screen bg-background pb-12">
      <Navbar />
      
      {/* Hero Header */}
      <div className="relative bg-muted/30 border-b pb-12 pt-8">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
        <div className="container mx-auto px-4 max-w-6xl relative z-10">
          <Button 
            variant="ghost" 
            className="mb-6 hover:bg-background/50" 
            onClick={() => router.back()}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tasks
          </Button>
          
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="space-y-4 max-w-3xl">
              <div className="flex items-center gap-3">
                <Badge
                  className={`px-3 py-1 text-sm ${
                    task.status === "0"
                      ? "bg-green-500/10 text-green-600 border-green-200 hover:bg-green-500/20"
                      : task.status === "1"
                      ? "bg-blue-500/10 text-blue-600 border-blue-200 hover:bg-blue-500/20"
                      : task.status === "2"
                      ? "bg-gray-500/10 text-gray-600 border-gray-200 hover:bg-gray-500/20"
                      : "bg-red-500/10 text-red-600 border-red-200 hover:bg-red-500/20"
                  }`}
                >
                  {task.status === "0"
                    ? "Open for Submissions"
                    : task.status === "1"
                    ? "In Progress"
                    : task.status === "2"
                    ? "Completed"
                    : "Cancelled"}
                </Badge>
                <span className="text-muted-foreground text-sm font-mono">#{task.taskId}</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                {task.title}
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                {task.description}
              </p>
            </div>
            
            <div className="flex gap-3">
              <Button variant="outline" className="glass-card hover:bg-background/80">
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
              {canSubmit && (
                <Button 
                  className="shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all"
                  onClick={() => document.getElementById("submission-form")?.scrollIntoView({ behavior: "smooth" })}
                >
                  Submit Work
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-6xl -mt-8 relative z-20 space-y-8">
        {/* Key Metrics Grid */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="glass-card hover:border-primary/30 transition-colors">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Bounty</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-green-500/10">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
                <span className="text-2xl font-bold text-foreground">
                  {(parseInt(task.bounty) / 1_000_000_000).toFixed(2)} <span className="text-sm font-normal text-muted-foreground">SUI</span>
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card hover:border-primary/30 transition-colors">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Deadline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-blue-500/10">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-lg">
                    {new Date(parseInt(task.deadline)).toLocaleDateString()}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {isDeadlinePassed ? "Ended" : "Remaining"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card hover:border-primary/30 transition-colors">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Labeler Spots</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-purple-500/10">
                  <Users className="h-5 w-5 text-purple-600" />
                </div>
                <div className="flex flex-col w-full">
                   <div className="flex justify-between items-baseline">
                    <span className="font-bold text-lg">
                      {task.currentLabelers}/{task.requiredLabelers}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {isFull ? "Full" : "Open"}
                    </span>
                   </div>
                   <Progress value={(parseInt(task.currentLabelers) / parseInt(task.requiredLabelers)) * 100} className="h-1.5 mt-1" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card hover:border-primary/30 transition-colors">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Submissions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-orange-500/10">
                  <CheckCircle className="h-5 w-5 text-orange-600" />
                </div>
                <span className="text-2xl font-bold text-foreground">{submissions.length}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-8">
            {/* Instructions */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Instructions
                </CardTitle>
                <CardDescription>
                  Detailed guidelines for completing this task
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm dark:prose-invert max-w-none bg-muted/30 p-6 rounded-xl border">
                  <div className="whitespace-pre-wrap">{task.instructions}</div>
                </div>
              </CardContent>
            </Card>

            {/* Dataset */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileCode className="h-5 w-5 text-primary" />
                  Dataset
                </CardTitle>
                <CardDescription>
                  Download the source files required for labeling
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-5 border rounded-xl bg-muted/20 hover:bg-muted/40 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-blue-500/10 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
                      <FileText className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Dataset File</p>
                      <p className="text-sm text-muted-foreground">
                        Stored on Walrus Decentralized Storage
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() =>
                      downloadFromWalrus(
                        task.datasetUrl,
                        task.datasetFilename || `task-${task.taskId}-dataset.csv`
                      )
                    }
                    className="hover:border-primary/50 hover:text-primary"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Status Messages */}
            {hasSubmitted && (
              <Alert className="bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-400">
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription className="ml-2 font-medium">
                  You have already submitted work for this task. You can track its status in your submissions dashboard.
                </AlertDescription>
              </Alert>
            )}

            {isDeadlinePassed && (
              <Alert variant="destructive" className="bg-destructive/5 border-destructive/20">
                <Clock className="h-4 w-4" />
                <AlertDescription className="ml-2 font-medium">
                  This task deadline has passed and is no longer accepting submissions.
                </AlertDescription>
              </Alert>
            )}

            {isFull && !hasSubmitted && (
              <Alert variant="destructive" className="bg-destructive/5 border-destructive/20">
                <Users className="h-4 w-4" />
                <AlertDescription className="ml-2 font-medium">
                  This task has reached its maximum number of labelers.
                </AlertDescription>
              </Alert>
            )}

            {/* Submission Form */}
            {canSubmit && (
              <div id="submission-form">
                <Card className="glass-card border-primary/20 shadow-lg shadow-primary/5">
                  <CardHeader className="bg-primary/5 border-b border-primary/10">
                    <CardTitle className="flex items-center gap-2 text-primary">
                      <Upload className="h-5 w-5" />
                      Submit Your Work
                    </CardTitle>
                    <CardDescription>
                      Upload your completed labels and submit for review
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6 pt-6">
                    {error && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    {success && (
                      <Alert className="border-green-500 bg-green-500/10 text-green-600">
                        <CheckCircle2 className="h-4 w-4" />
                        <AlertDescription>
                          {success}
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Result File Upload */}
                    <div className="space-y-3">
                      <Label htmlFor="result" className="text-base font-medium">Result File <span className="text-destructive">*</span></Label>
                      <div className="border-2 border-dashed rounded-xl p-8 text-center hover:bg-muted/20 transition-colors relative group">
                        <input
                          id="result"
                          type="file"
                          onChange={handleFileChange}
                          disabled={isSubmitting}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                          accept=".csv,.json,.txt,.zip"
                        />
                        <div className="flex flex-col items-center gap-2 pointer-events-none">
                           <div className="h-12 w-12 bg-muted rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                             <Upload className="h-6 w-6 text-muted-foreground" />
                           </div>
                           {resultFile ? (
                             <div className="space-y-1">
                               <p className="font-semibold text-green-600">{resultFile.name}</p>
                               <p className="text-xs text-muted-foreground">{(resultFile.size / 1024).toFixed(2)} KB</p>
                             </div>
                           ) : (
                             <div className="space-y-1">
                               <p className="font-medium">Click to upload or drag and drop</p>
                               <p className="text-xs text-muted-foreground">CSV, JSON, TXT, or ZIP (Max 50MB)</p>
                             </div>
                           )}
                        </div>
                      </div>
                    </div>

                    {/* Notes */}
                    <div className="space-y-3">
                      <Label htmlFor="notes" className="text-base font-medium">Submission Notes (Optional)</Label>
                      <Textarea
                        id="notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Add any notes, observations, or clarifications about your work..."
                        disabled={isSubmitting}
                        rows={4}
                        className="bg-background/50 resize-none"
                      />
                    </div>

                    {/* Submit Button */}
                    <div className="pt-2">
                      <Button
                        onClick={handleSubmit}
                        disabled={!resultFile || isSubmitting}
                        className="w-full h-12 text-base shadow-lg shadow-primary/20"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <Shield className="h-4 w-4 mr-2" />
                            Submit Work Securely
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Upload Progress */}
                    {isSubmitting && uploadProgress > 0 && (
                      <div className="space-y-2 bg-muted/30 p-3 rounded-lg border">
                        <div className="flex justify-between text-sm font-medium">
                          <span className="text-primary">
                            {uploadProgress < 50 ? "Uploading to Walrus..." : "Confirming on Blockchain..."}
                          </span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <Progress value={uploadProgress} className="h-2" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Requester Info */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg">Task Requester</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex justify-center">
                    <UserDisplay
                      address={task.requester}
                      size="lg"
                      showAddress={true}
                      showBadge={true}
                      className="flex-col text-center"
                    />
                  </div>
                  <Separator />
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Task ID</span>
                      <Badge variant="outline" className="font-mono">#{task.taskId}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Created</span>
                      <span>
                        {new Date(parseInt(task.createdAt)).toLocaleDateString()}
                      </span>
                    </div>
                     <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Quality Tracker</span>
                      <span className="font-mono text-xs truncate max-w-[100px] text-muted-foreground" title={task.qualityTrackerId}>
                        {task.qualityTrackerId ? `${task.qualityTrackerId.slice(0, 6)}...` : "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Help Card */}
            <Card className="glass-card bg-gradient-to-b from-blue-500/5 to-transparent border-blue-500/20">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-blue-600 dark:text-blue-400 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Need Help?
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>
                  Make sure your submission follows the format specified in the instructions.
                </p>
                <p>
                  Quality checks are performed after submission. High quality work earns reputation points.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
