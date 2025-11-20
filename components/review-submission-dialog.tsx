import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserDisplay } from "@/components/user-display";
import {
  Download,
  FileText,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { ProcessedSubmission } from "@/hooks/use-submissions";
import { downloadFromWalrus } from "@/lib/walrus";

interface ReviewSubmissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submission: ProcessedSubmission | null;
  onAccept?: (id: string) => void;
  onReject?: (id: string) => void;
  currentSelection?: "accepted" | "rejected" | null;
}

export function ReviewSubmissionDialog({
  open,
  onOpenChange,
  submission,
  onAccept,
  onReject,
  currentSelection,
}: ReviewSubmissionDialogProps) {
  if (!submission) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "0":
        return (
          <Badge
            variant="outline"
            className="text-yellow-600 border-yellow-600 bg-yellow-50"
          >
            <Clock className="h-3 w-3 mr-1" />
            Pending Review
          </Badge>
        );
      case "1":
        return (
          <Badge
            variant="outline"
            className="text-green-600 border-green-600 bg-green-50"
          >
            <CheckCircle className="h-3 w-3 mr-1" />
            Accepted
          </Badge>
        );
      case "2":
        return (
          <Badge
            variant="outline"
            className="text-red-600 border-red-600 bg-red-50"
          >
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-background">
        <DialogHeader>
          <div className="flex items-center justify-between pr-8">
            <DialogTitle>Submission #{submission.submissionId}</DialogTitle>
            {getStatusBadge(submission.status)}
          </div>
          <DialogDescription>
            Review the details and result file submitted by the labeler.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Labeler Info */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">
              Labeler
            </h4>
            <div className="p-3 border rounded-lg bg-muted/30">
              <UserDisplay
                address={submission.labeler}
                size="md"
                showAddress={true}
                showBadge={true}
              />
            </div>
          </div>

          {/* Submission Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">
                Submitted At
              </h4>
              <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/30">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {new Date(
                    parseInt(submission.submittedAt)
                  ).toLocaleDateString()}
                </span>
                <span className="text-sm text-muted-foreground">
                  {new Date(
                    parseInt(submission.submittedAt)
                  ).toLocaleTimeString()}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">
                File Type
              </h4>
              <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/30">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span
                  className="text-sm truncate"
                  title={submission.resultContentType}
                >
                  {submission.resultContentType || "Unknown"}
                </span>
              </div>
            </div>
          </div>

          {/* Result File */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">
              Result File
            </h4>
            <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <p
                    className="font-medium truncate"
                    title={submission.resultFilename}
                  >
                    {submission.resultFilename || "result.csv"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {submission.resultUrl}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  downloadFromWalrus(
                    submission.resultUrl,
                    submission.resultFilename ||
                      `submission-${submission.submissionId}-result.csv`
                  )
                }
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {onAccept && onReject && submission && (
            <div className="flex items-center gap-2 mr-auto">
              <Button
                variant={
                  currentSelection === "accepted" ? "default" : "outline"
                }
                onClick={() => onAccept(submission.submissionId)}
                className={
                  currentSelection === "accepted"
                    ? "bg-green-600 hover:bg-green-700"
                    : ""
                }
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {currentSelection === "accepted" ? "Accepted" : "Accept"}
              </Button>
              <Button
                variant={
                  currentSelection === "rejected" ? "destructive" : "outline"
                }
                onClick={() => onReject(submission.submissionId)}
              >
                <XCircle className="h-4 w-4 mr-2" />
                {currentSelection === "rejected" ? "Rejected" : "Reject"}
              </Button>
            </div>
          )}
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
