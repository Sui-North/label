"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { UserDisplay } from "@/components/user-display";
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Users,
  DollarSign,
  FileText,
  Loader2,
} from "lucide-react";

interface Submission {
  submissionId: string;
  objectId: string; // Add objectId for unique identification
  labeler: string;
  status: string;
  resultUrl: string;
  resultFilename: string;
  submittedAt: string;
}

interface ConsensusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submissions: Submission[];
  taskId: string;
  bountyAmount: string;
  requiredLabelers: number;
  onFinalize: (acceptedObjectIds: string[], rejectedObjectIds: string[]) => Promise<void>;
  isProcessing: boolean;
  selectedAccepted: Set<string>;
  selectedRejected: Set<string>;
  onToggleAccept: (id: string) => void;
  onToggleReject: (id: string) => void;
}

export function ConsensusDialog({
  open,
  onOpenChange,
  submissions,
  taskId,
  bountyAmount,
  requiredLabelers,
  onFinalize,
  isProcessing,
  selectedAccepted,
  selectedRejected,
  onToggleAccept,
  onToggleReject,
}: ConsensusDialogProps) {
  const handleFinalize = async () => {
    const acceptedObjectIds = Array.from(selectedAccepted);
    const rejectedObjectIds = Array.from(selectedRejected);

    await onFinalize(acceptedObjectIds, rejectedObjectIds);
  };

  const pendingSubmissions = submissions.filter((s) => s.status === "0");
  const bountyPerLabeler =
    parseFloat(bountyAmount) / 1_000_000_000 / requiredLabelers;
  const totalAcceptedPayout = selectedAccepted.size * bountyPerLabeler;
  const allReviewed =
    selectedAccepted.size + selectedRejected.size === pendingSubmissions.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Finalize Consensus</DialogTitle>
          <DialogDescription>
            Review and accept/reject submissions to finalize this task
          </DialogDescription>
        </DialogHeader>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">
              {pendingSubmissions.length}
            </p>
            <p className="text-xs text-muted-foreground">Total Submissions</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {selectedAccepted.size}
            </p>
            <p className="text-xs text-muted-foreground">Accepting</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">
              {selectedRejected.size}
            </p>
            <p className="text-xs text-muted-foreground">Rejecting</p>
          </div>
        </div>

        {/* Review Progress Alert */}
        {!allReviewed && pendingSubmissions.length > 0 && (
          <Alert className="border-yellow-500 bg-yellow-500/10">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800 dark:text-yellow-200">
              <strong>Action Required:</strong> You must review ALL {pendingSubmissions.length} submissions before finalizing.
              <div className="mt-2 font-medium">
                Progress: {selectedAccepted.size + selectedRejected.size} / {pendingSubmissions.length} reviewed
              </div>
            </AlertDescription>
          </Alert>
        )}

        {allReviewed && selectedAccepted.size === 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You must accept at least one submission to finalize consensus.
            </AlertDescription>
          </Alert>
        )}

        <Separator />

        {/* Payout Preview */}
        <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm font-medium">Total Payout</p>
              <p className="text-xs text-muted-foreground">
                {bountyPerLabeler.toFixed(4)} SUI per accepted submission
              </p>
            </div>
          </div>
          <p className="text-xl font-bold text-green-600">
            {totalAcceptedPayout.toFixed(4)} SUI
          </p>
        </div>

        <Separator />

        {/* Submissions List */}
        <div className="space-y-3">
          <h3 className="font-semibold flex items-center gap-2">
            <Users className="h-4 w-4" />
            Submissions ({pendingSubmissions.length})
          </h3>

          {pendingSubmissions.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No pending submissions to review.
              </AlertDescription>
            </Alert>
          ) : (
            pendingSubmissions.map((submission) => {
              const isAccepted = selectedAccepted.has(submission.objectId);
              const isRejected = selectedRejected.has(submission.objectId);

              return (
                <div
                  key={submission.objectId}
                  className={`border rounded-lg p-4 ${
                    isAccepted
                      ? "border-green-500 bg-green-500/5"
                      : isRejected
                      ? "border-red-500 bg-red-500/5"
                      : ""
                  }`}
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
                    <div className="flex gap-2">
                      {isAccepted && (
                        <Badge className="bg-green-500">Accepting</Badge>
                      )}
                      {isRejected && (
                        <Badge variant="destructive">Rejecting</Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mb-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground flex-1">
                      {submission.resultFilename}
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        window.open(submission.resultUrl, "_blank")
                      }
                    >
                      View File
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant={isAccepted ? "default" : "outline"}
                      onClick={() => onToggleAccept(submission.objectId)}
                      className={
                        isAccepted ? "bg-green-600 hover:bg-green-700" : ""
                      }
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant={isRejected ? "destructive" : "outline"}
                      onClick={() => onToggleReject(submission.objectId)}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <DialogFooter>
          <div className="flex flex-col w-full gap-3">
            {!allReviewed && pendingSubmissions.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Cannot finalize:</strong> All {pendingSubmissions.length} submissions must be reviewed (accepted or rejected).
                  Currently reviewed: {selectedAccepted.size + selectedRejected.size} / {pendingSubmissions.length}
                </AlertDescription>
              </Alert>
            )}

            {allReviewed && selectedAccepted.size === 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Cannot finalize:</strong> At least one submission must be accepted.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                onClick={handleFinalize}
                disabled={!allReviewed || selectedAccepted.size === 0 || isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Finalize Consensus
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
