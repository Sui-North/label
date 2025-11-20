"use client";

import { useSuiClient } from "@mysten/dapp-kit";
import { useQuery } from "@tanstack/react-query";
import { TASK_REGISTRY_ID, PACKAGE_ID } from "@/lib/contracts/songsim";

interface ReputationData {
  user: string;
  total_completed: number;
  total_accepted: number;
  total_rejected: number;
  reputation_score: number;
  weighted_score: number;
  badges: number[];
}

const BADGE_NAMES: Record<number, string> = {
  1: "Novice",
  2: "Intermediate",
  3: "Expert",
  4: "Master",
  5: "Consistent",
};

const BADGE_REQUIREMENTS: Record<number, string> = {
  1: "Complete 10 tasks",
  2: "Complete 50 tasks",
  3: "Complete 200 tasks",
  4: "Complete 500 tasks",
  5: "95%+ acceptance rate (20+ tasks)",
};

export function useReputation(userAddress?: string) {
  const suiClient = useSuiClient();

  // Fetch user's reputation
  const { data: reputation, isLoading } = useQuery({
    queryKey: ["reputation", userAddress],
    queryFn: async () => {
      if (!userAddress || !PACKAGE_ID) return null;

      try {
        // Query Reputation objects owned by user
        const result = await suiClient.getOwnedObjects({
          owner: userAddress,
          options: {
            showContent: true,
            showType: true,
          }
        });

        // Find reputation object
        const reputationObj = result.data.find(obj => {
          const type = obj.data?.type;
          return type?.includes('::reputation::Reputation');
        });

        if (!reputationObj?.data?.content || !('fields' in reputationObj.data.content)) {
          return null;
        }

        const fields = reputationObj.data.content.fields as any;
        
        return {
          user: fields.user,
          total_completed: Number(fields.total_completed),
          total_accepted: Number(fields.total_accepted),
          total_rejected: Number(fields.total_rejected),
          reputation_score: Number(fields.reputation_score),
          weighted_score: Number(fields.weighted_score),
          badges: fields.badges || [],
        } as ReputationData;
      } catch (error) {
        console.error("Error fetching reputation:", error);
        return null;
      }
    },
    enabled: !!userAddress && !!PACKAGE_ID,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  // Calculate acceptance rate
  const acceptanceRate = reputation
    ? reputation.total_completed > 0
      ? (reputation.total_accepted / reputation.total_completed) * 100
      : 0
    : 0;

  // Get badge details
  const badgeDetails = reputation?.badges.map((badgeId: number) => ({
    id: badgeId,
    name: BADGE_NAMES[badgeId] || "Unknown",
    requirement: BADGE_REQUIREMENTS[badgeId] || "",
  })) || [];

  // Calculate next badge progress
  const nextBadge = (() => {
    if (!reputation) return null;

    const hasNovice = reputation.badges.includes(1);
    const hasIntermediate = reputation.badges.includes(2);
    const hasExpert = reputation.badges.includes(3);
    const hasMaster = reputation.badges.includes(4);
    const hasConsistent = reputation.badges.includes(5);

    if (!hasNovice && reputation.total_completed < 10) {
      return {
        name: "Novice",
        progress: reputation.total_completed,
        target: 10,
        requirement: "Complete 10 tasks",
      };
    }

    if (!hasIntermediate && reputation.total_completed < 50) {
      return {
        name: "Intermediate",
        progress: reputation.total_completed,
        target: 50,
        requirement: "Complete 50 tasks",
      };
    }

    if (!hasExpert && reputation.total_completed < 200) {
      return {
        name: "Expert",
        progress: reputation.total_completed,
        target: 200,
        requirement: "Complete 200 tasks",
      };
    }

    if (!hasMaster && reputation.total_completed < 500) {
      return {
        name: "Master",
        progress: reputation.total_completed,
        target: 500,
        requirement: "Complete 500 tasks",
      };
    }

    if (!hasConsistent && reputation.total_completed >= 20) {
      const rate = (reputation.total_accepted / reputation.total_completed) * 100;
      return {
        name: "Consistent",
        progress: Math.floor(rate),
        target: 95,
        requirement: "Achieve 95% acceptance rate (20+ tasks)",
      };
    }

    return null;
  })();

  return {
    reputation,
    isLoading,
    acceptanceRate,
    badgeDetails,
    nextBadge,
    BADGE_NAMES,
    BADGE_REQUIREMENTS,
  };
}

// Hook for fetching all user reputations (for leaderboard)
export function useAllReputations() {
  const suiClient = useSuiClient();

  const { data: reputations = [], isLoading } = useQuery({
    queryKey: ["allReputations"],
    queryFn: async () => {
      if (!TASK_REGISTRY_ID || !PACKAGE_ID) return [];

      try {
        // Query all Reputation objects
        // Note: This is a simplified approach. In production, you'd want to
        // maintain a registry of reputations or use indexing
        const registry = await suiClient.getObject({
          id: TASK_REGISTRY_ID,
          options: {
            showContent: true,
          },
        });

        // For now, return empty array. In production, implement proper indexing
        // or maintain a separate registry of user reputations
        return [];
      } catch (error) {
        console.error("Error fetching all reputations:", error);
        return [];
      }
    },
    enabled: !!TASK_REGISTRY_ID && !!PACKAGE_ID,
    staleTime: 60_000,
  });

  return {
    reputations,
    isLoading,
  };
}
