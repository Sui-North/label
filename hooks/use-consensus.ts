/**
 * React Query hook for consensus management
 * 
 * IMPORTANT: New V3 Architecture Requirements
 * The consensus hook now requires additional shared object IDs:
 * - registryId: Task registry object (from TASK_REGISTRY_ID)
 * - requesterProfileId: Requester's UserProfile object ID
 * - qualityTrackerId: Quality tracker for this task
 * - rejectedLabelers: Addresses of rejected labelers (matches rejectedIds order)
 * 
 * These are fetched from the task object and registry during consensus preparation.
 */

import { useState } from "react";
import { useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";
import { useQueryClient } from "@tanstack/react-query";
import {
  finalizeConsensusTransaction,
  updateSubmissionStatusTransaction,
  PLATFORM_CONFIG_ID,
  TASK_REGISTRY_ID,
} from "@/lib/contracts/songsim";
import { toast } from "sonner";

export function useConsensus(
  taskObjectId: string,
  taskId: string,
  requesterProfileId?: string,
  qualityTrackerId?: string
) {
  const [selectedAccepted, setSelectedAccepted] = useState<Set<string>>(
    new Set()
  );
  const [selectedRejected, setSelectedRejected] = useState<Set<string>>(
    new Set()
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const queryClient = useQueryClient();
  const suiClient = useSuiClient();

  const toggleAccept = (submissionId: string) => {
    setSelectedAccepted((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(submissionId)) {
        newSet.delete(submissionId);
      } else {
        newSet.add(submissionId);
        // Remove from rejected if present
        setSelectedRejected((prevRejected) => {
          const newRejected = new Set(prevRejected);
          newRejected.delete(submissionId);
          return newRejected;
        });
      }
      return newSet;
    });
  };

  const toggleReject = (submissionId: string) => {
    setSelectedRejected((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(submissionId)) {
        newSet.delete(submissionId);
      } else {
        newSet.add(submissionId);
        // Remove from accepted if present
        setSelectedAccepted((prevAccepted) => {
          const newAccepted = new Set(prevAccepted);
          newAccepted.delete(submissionId);
          return newAccepted;
        });
      }
      return newSet;
    });
  };

  const finalizeConsensus = async (
    acceptedIds: number[],
    acceptedLabelers: string[],
    rejectedIds: number[],
    rejectedLabelers: string[],
    acceptedSubmissionObjectIds: string[],
    rejectedSubmissionObjectIds: string[]
  ) => {
    if (!PLATFORM_CONFIG_ID || !TASK_REGISTRY_ID) {
      toast.error("Platform not configured");
      return;
    }

    if (!requesterProfileId || !qualityTrackerId) {
      toast.error("Missing required objects", {
        description: "Requester profile and quality tracker must be provided",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const tx = finalizeConsensusTransaction(
        PLATFORM_CONFIG_ID,
        TASK_REGISTRY_ID,
        taskObjectId,
        requesterProfileId,
        qualityTrackerId,
        acceptedIds,
        acceptedLabelers,
        rejectedIds,
        rejectedLabelers
      );

      signAndExecute(
        { transaction: tx },
        {
          onSuccess: async (result) => {
            console.log("Consensus finalized:", result);
            
            // Update submission statuses - process accepted first
            const updatePromises: Promise<any>[] = [];
            
            for (const submissionObjectId of acceptedSubmissionObjectIds) {
              const updateTx = updateSubmissionStatusTransaction(submissionObjectId, true);
              const promise = new Promise((resolve, reject) => {
                signAndExecute(
                  { transaction: updateTx },
                  {
                    onSuccess: (res) => {
                      console.log(`Updated submission ${submissionObjectId} to ACCEPTED`);
                      resolve(res);
                    },
                    onError: (err) => {
                      console.error(`Failed to update submission ${submissionObjectId}:`, err);
                      reject(err);
                    },
                  }
                );
              });
              updatePromises.push(promise);
            }
            
            for (const submissionObjectId of rejectedSubmissionObjectIds) {
              const updateTx = updateSubmissionStatusTransaction(submissionObjectId, false);
              const promise = new Promise((resolve, reject) => {
                signAndExecute(
                  { transaction: updateTx },
                  {
                    onSuccess: (res) => {
                      console.log(`Updated submission ${submissionObjectId} to REJECTED`);
                      resolve(res);
                    },
                    onError: (err) => {
                      console.error(`Failed to update submission ${submissionObjectId}:`, err);
                      reject(err);
                    },
                  }
                );
              });
              updatePromises.push(promise);
            }

            // Wait for all submission updates
            try {
              await Promise.all(updatePromises);
              toast.success("All submission statuses updated!");
            } catch (updateError) {
              console.error("Some submission updates failed:", updateError);
              toast.warning("Consensus finalized but some submission status updates failed");
            }

            toast.success("Consensus finalized!", {
              description: `${acceptedIds.length} submission(s) accepted. Bounty distributed automatically.`,
            });

            // Invalidate all related queries
            queryClient.invalidateQueries({ queryKey: ["task", taskObjectId] });
            queryClient.invalidateQueries({
              queryKey: ["taskByTaskId", taskId],
            });
            queryClient.invalidateQueries({ queryKey: ["allSubmissions"] });
            queryClient.invalidateQueries({ queryKey: ["myTasks"] });
            queryClient.invalidateQueries({ queryKey: ["allTasks"] });

            setIsProcessing(false);
          },
          onError: (error) => {
            console.error("Consensus finalization failed:", error);
            toast.error("Failed to finalize consensus", {
              description: error.message,
            });
            setIsProcessing(false);
          },
        }
      );
    } catch (error) {
      console.error("Error preparing consensus transaction:", error);
      toast.error("Error preparing transaction");
      setIsProcessing(false);
    }
  };

  return {
    selectedAccepted,
    selectedRejected,
    toggleAccept,
    toggleReject,
    finalizeConsensus,
    isProcessing,
  };
}
