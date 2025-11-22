"use client";

import { useState } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
  ArrowUpRight,
  Search,
  Filter,
} from "lucide-react";
import { useMySubmissions } from "@/hooks/use-submissions";
import { useAllTasks } from "@/hooks/use-tasks";
import { ReviewSubmissionDialog } from "@/components/review-submission-dialog";
import { downloadFromWalrus } from "@/lib/walrus";
import { Input } from "@/components/ui/input";

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
  const [searchQuery, setSearchQuery] = useState("");

  // Filter submissions based on search query
  const filteredSubmissions = submissions.filter(s => {
    const task = allTasks.find(t => t.taskId === s.taskId);
    const taskTitle = task?.title.toLowerCase() || "";
    return taskTitle.includes(searchQuery.toLowerCase()) || s.submissionId.includes(searchQuery);
  });

  // Group submissions by status
  const pendingSubmissions = filteredSubmissions.filter((s) => s.status === "0"); // Pending
  const acceptedSubmissions = filteredSubmissions.filter((s) => s.status === "1"); // Accepted
  const rejectedSubmissions = filteredSubmissions.filter((s) => s.status === "2"); // Rejected

  // Calculate total earned from accepted submissions
  // Note: bounty amount will need to be fetched from task objects
  const totalEarned = acceptedSubmissions.reduce((acc, s) => {
    const task = allTasks.find(t => t.taskId === s.taskId);
    return acc + (task ? parseInt(task.bounty) : 0);
  }, 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "0": // Pending
        return (
          <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-200 dark:border-yellow-800 hover:bg-yellow-500/20">
            <Clock className="h-3 w-3 mr-1" />
            Pending Review
          </Badge>
        );
      case "1": // Accepted
        return (
          <Badge className="bg-green-500/10 text-green-600 border-green-200 dark:border-green-800 hover:bg-green-500/20">
            <CheckCircle className="h-3 w-3 mr-1" />
            Accepted
          </Badge>
        );
      case "2": // Rejected
        return (
          <Badge className="bg-red-500/10 text-red-600 border-red-200 dark:border-red-800 hover:bg-red-500/20">
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
      <Card className="glass-card h-full hover:border-primary/50 hover:shadow-primary/10 transition-all duration-300 group flex flex-col overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 to-purple-500/50 opacity-0 group-hover:opacity-100 transition-opacity" />
        
        <CardHeader className="pb-2 space-y-4">
          <div className="flex items-center justify-between">
            {getStatusBadge(submission.status)}
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono bg-muted/50 px-2 py-1 rounded-full">
              ID: {submission.submissionId.slice(0, 8)}
            </span>
          </div>
          
          <div className="space-y-1">
            <CardTitle className="text-xl font-bold truncate group-hover:text-primary transition-colors">
              {task?.title || "Unknown Task"}
            </CardTitle>
            <CardDescription className="flex items-center gap-2 text-xs">
              <Clock className="h-3 w-3" />
              Submitted {new Date(parseInt(submission.submittedAt)).toLocaleDateString()}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="pb-4 flex-1">
          <div className="grid grid-cols-2 gap-3 p-3 bg-muted/30 rounded-xl border border-border/50 group-hover:border-primary/20 transition-colors">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                <DollarSign className="h-3 w-3 text-primary" /> 
                Bounty
              </span>
              <p className="font-bold text-primary">
                {task ? (parseInt(task.bounty) / 1_000_000_000).toFixed(2) : "0.00"} SUI
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Calendar className="h-3 w-3 text-primary" /> 
                Date
              </span>
              <p className="font-medium">
                {new Date(parseInt(submission.submittedAt)).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </p>
            </div>
          </div>
        </CardContent>

        <CardFooter className="pt-0">
          <div className="flex flex-col gap-2 w-full">
            <Button
              className="w-full shadow-lg shadow-primary/10 group-hover:shadow-primary/20 transition-all"
              onClick={() => {
                setViewSubmission(submission);
                setViewDialogOpen(true);
              }}
            >
              <FileText className="h-4 w-4 mr-2" />
              View Submission
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-muted-foreground hover:text-primary"
              onClick={() => setSelectedTask(task ?? null)}
              disabled={!task}
            >
              <Eye className="h-4 w-4 mr-2" />
              View Task Details
            </Button>
          </div>
        </CardFooter>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl min-h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading your submissions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="text-center py-12">
            <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="text-lg font-semibold text-destructive mb-2">Error loading submissions</p>
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
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">My Submissions</h1>
          <p className="text-muted-foreground mt-1">
            Track your labeling submissions and earnings
          </p>
        </div>
        <Button asChild variant="outline" className="shadow-sm">
          <Link href="/dashboard/available">
            <ArrowUpRight className="h-4 w-4 mr-2" />
            Browse More Tasks
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="glass-card hover:shadow-lg transition-all duration-300">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Submissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <p className="text-3xl font-bold">{submissions.length}</p>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card hover:shadow-lg transition-all duration-300 border-green-500/20 bg-green-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600/80">
              Accepted
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <p className="text-3xl font-bold text-green-600">
                {acceptedSubmissions.length}
              </p>
              <CheckCircle className="h-4 w-4 text-green-600/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card hover:shadow-lg transition-all duration-300 border-yellow-500/20 bg-yellow-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-600/80">
              Pending Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <p className="text-3xl font-bold text-yellow-600">
                {pendingSubmissions.length}
              </p>
              <Clock className="h-4 w-4 text-yellow-600/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-primary">
              Total Earned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <p className="text-3xl font-bold text-primary">{(totalEarned / 1_000_000_000).toFixed(2)} SUI</p>
              <DollarSign className="h-4 w-4 text-primary/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-muted/30 p-4 rounded-xl border">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search submissions..." 
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
            Showing {filteredSubmissions.length} submissions
          </div>
        </div>
      </div>

      {/* Submissions List */}
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="bg-muted/50 p-1 rounded-xl">
          <TabsTrigger value="all" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
            All <Badge variant="secondary" className="ml-2 h-5 px-1.5">{submissions.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="pending" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
            Pending <Badge variant="secondary" className="ml-2 h-5 px-1.5">{pendingSubmissions.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="accepted" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
            Accepted <Badge variant="secondary" className="ml-2 h-5 px-1.5">{acceptedSubmissions.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="rejected" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
            Rejected <Badge variant="secondary" className="ml-2 h-5 px-1.5">{rejectedSubmissions.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
          {filteredSubmissions.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredSubmissions.map((submission) => (
                <SubmissionCard
                  key={submission.submissionId}
                  submission={submission}
                />
              ))}
            </div>
          ) : (
            <Card className="glass-card border-dashed">
              <CardContent className="text-center py-16">
                <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No submissions found</h3>
                <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                  You haven't made any submissions matching your criteria yet.
                </p>
                <Button asChild>
                  <Link href="/dashboard/available">
                    <ArrowUpRight className="h-4 w-4 mr-2" />
                    Browse Available Tasks
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
          {pendingSubmissions.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {pendingSubmissions.map((submission) => (
                <SubmissionCard
                  key={submission.submissionId}
                  submission={submission}
                />
              ))}
            </div>
          ) : (
            <Card className="glass-card border-dashed">
              <CardContent className="text-center py-16">
                <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No pending submissions</h3>
                <p className="text-muted-foreground">
                  All your submissions have been reviewed.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="accepted" className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
          {acceptedSubmissions.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {acceptedSubmissions.map((submission) => (
                <SubmissionCard
                  key={submission.submissionId}
                  submission={submission}
                />
              ))}
            </div>
          ) : (
            <Card className="glass-card border-dashed">
              <CardContent className="text-center py-16">
                <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No accepted submissions</h3>
                <p className="text-muted-foreground">
                  Keep working! Your accepted submissions will appear here.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
          {rejectedSubmissions.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {rejectedSubmissions.map((submission) => (
                <SubmissionCard
                  key={submission.submissionId}
                  submission={submission}
                />
              ))}
            </div>
          ) : (
            <Card className="glass-card border-dashed">
              <CardContent className="text-center py-16">
                <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <XCircle className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No rejected submissions</h3>
                <p className="text-muted-foreground">
                  Great job! You have no rejected submissions.
                </p>
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
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto glass-card border-primary/20">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">{selectedTask?.title}</DialogTitle>
            <DialogDescription>Task Details</DialogDescription>
          </DialogHeader>

          {selectedTask && (
            <div className="space-y-6 mt-4">
              {/* Task Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-muted/30 p-4 rounded-xl border">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <DollarSign className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Bounty</p>
                    <p className="font-semibold text-primary">
                      {(parseInt(selectedTask.bounty) / 1_000_000_000).toFixed(
                        2
                      )}{" "}
                      SUI
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Calendar className="h-5 w-5" />
                  </div>
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
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Progress</p>
                    <p className="font-semibold">
                      {selectedTask.currentLabelers} /{" "}
                      {selectedTask.requiredLabelers}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <FileText className="h-5 w-5" />
                  </div>
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

              <Separator className="bg-border/50" />

              {/* Description */}
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  Description
                </h3>
                <div className="bg-muted/20 p-4 rounded-lg text-sm text-muted-foreground whitespace-pre-wrap border">
                  {selectedTask.description}
                </div>
              </div>

              {/* Instructions */}
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  Instructions
                </h3>
                <div className="bg-muted/20 p-4 rounded-lg text-sm text-muted-foreground whitespace-pre-wrap border">
                  {selectedTask.instructions}
                </div>
              </div>

              <Separator className="bg-border/50" />

              {/* Dataset */}
              <div>
                <h3 className="font-semibold mb-2">Dataset</h3>
                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border hover:border-primary/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <FileText className="h-5 w-5" />
                    </div>
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
                    className="hover:bg-primary hover:text-primary-foreground"
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
