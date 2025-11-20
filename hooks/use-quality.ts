"use client";

import { useState } from "react";
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { reportQualityTransaction, toUIQualityScore, TASK_REGISTRY_ID, PACKAGE_ID } from "@/lib/contracts/songsim";
import { handleTransactionError } from "@/lib/error-handler";

export interface QualityReport {
  submissionId: string;
  taskId: string;
  labelerAddress: string;
  qualityScore: number; // 0-100 (UI scale, converted from contract's 0-1000)
  reportedAt: number;
}

export interface QualityStats {
  averageScore: number; // Same as reputationScore for backward compatibility
  totalSubmissions: number;
  acceptedCount: number;
  rejectedCount: number;
  reputationScore: number; // 0-100 (converted from 0-1000)
}

export function useQuality() {
  const account = useCurrentAccount();
  const suiClient = useSuiClient();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const queryClient = useQueryClient();
  const [isReporting, setIsReporting] = useState(false);

  // Fetch user's reputation/quality data
  const { data: qualityData, isLoading: isLoadingQuality } = useQuery({
    queryKey: ["quality", account?.address],
    queryFn: async () => {
      if (!account?.address || !TASK_REGISTRY_ID) return null;
      
      try {
        // Query the TaskRegistry to get user's reputation address
        const registry = await suiClient.getObject({
          id: TASK_REGISTRY_ID,
          options: { showContent: true }
        });

        if (!registry.data?.content || !('fields' in registry.data.content)) {
          return null;
        }

        const fields = (registry.data.content as any).fields;
        const reputationTableId = fields.reputation_addresses?.fields?.id?.id;

        if (!reputationTableId) {
          return null;
        }

        // Query dynamic field for user's reputation
        try {
          const repField = await suiClient.getDynamicFieldObject({
            parentId: reputationTableId,
            name: {
              type: "address",
              value: account.address
            }
          });

          if (!repField.data?.content || !('fields' in repField.data.content)) {
            return null;
          }

          const repAddress = (repField.data.content as any).fields.value;

          // Get the actual Reputation object
          const repObject = await suiClient.getObject({
            id: repAddress,
            options: { showContent: true }
          });

          if (!repObject.data?.content || !('fields' in repObject.data.content)) {
            return null;
          }

          const repFields = (repObject.data.content as any).fields;

          return {
            reputationScore: toUIQualityScore(Number(repFields.score || 0)),
            averageScore: toUIQualityScore(Number(repFields.score || 0)), // Same as reputation
            totalSubmissions: Number(repFields.total_tasks || 0),
            acceptedCount: Number(repFields.accepted_tasks || 0),
            rejectedCount: Number(repFields.rejected_tasks || 0),
          };
        } catch (error) {
          // User might not have reputation yet
          console.log("No reputation found for user");
          return null;
        }
      } catch (error) {
        console.error("Error fetching quality data:", error);
        return null;
      }
    },
    enabled: !!account?.address && !!TASK_REGISTRY_ID && !!PACKAGE_ID,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  // Calculate quality statistics
  const qualityStats: QualityStats = qualityData || {
    averageScore: 0,
    totalSubmissions: 0,
    acceptedCount: 0,
    rejectedCount: 0,
    reputationScore: 0,
  };

  /**
   * Report quality score for a submission
   */
  const reportQuality = async (
    qualityRegistryId: string,
    submissionObjectId: string,
    qualityScore: number
  ): Promise<boolean> => {
    if (!account) {
      toast.error("Wallet not connected");
      return false;
    }

    if (qualityScore < 0 || qualityScore > 100) {
      toast.error("Invalid quality score", {
        description: "Score must be between 0 and 100.",
      });
      return false;
    }

    setIsReporting(true);

    try {
      const tx = reportQualityTransaction(
        qualityRegistryId,
        submissionObjectId,
        qualityScore
      );

      return await new Promise((resolve) => {
        signAndExecute(
          { transaction: tx },
          {
            onSuccess: (result) => {
              console.log("Quality report submitted:", result);
              toast.success("Quality score recorded", {
                description: `Score: ${qualityScore}/100`,
              });

              // Invalidate queries
              queryClient.invalidateQueries({ queryKey: ["qualityReports"] });
              queryClient.invalidateQueries({ queryKey: ["qualityStats"] });
              queryClient.invalidateQueries({ queryKey: ["submissions"] });

              setIsReporting(false);
              resolve(true);
            },
            onError: (error) => {
              console.error("Quality report error:", error);
              handleTransactionError(error);
              setIsReporting(false);
              resolve(false);
            },
          }
        );
      });
    } catch (error) {
      console.error("Quality report error:", error);
      handleTransactionError(error);
      setIsReporting(false);
      return false;
    }
  };

  /**
   * Get quality badge based on score
   */
  const getQualityBadge = (score: number) => {
    if (score >= 90) return { label: "Excellent", color: "green", emoji: "🌟" };
    if (score >= 75) return { label: "Good", color: "blue", emoji: "👍" };
    if (score >= 60) return { label: "Fair", color: "yellow", emoji: "⚠️" };
    return { label: "Poor", color: "red", emoji: "⚠️" };
  };

  /**
   * Get quality color for charts
   */
  const getQualityColor = (score: number) => {
    if (score >= 90) return "#22c55e"; // green-500
    if (score >= 75) return "#3b82f6"; // blue-500
    if (score >= 60) return "#eab308"; // yellow-500
    return "#ef4444"; // red-500
  };

  return {
    qualityData,
    qualityStats,
    isLoadingQuality,
    isReporting,
    reportQuality,
    getQualityBadge,
    getQualityColor,
  };
}
