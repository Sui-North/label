"use client";

import { useState, useMemo } from "react";
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createPrizePoolTransaction,
  joinPrizePoolTransaction,
  getAllPrizePools,
  TASK_REGISTRY_ID,
} from "@/lib/contracts/songsim";
import { handleTransactionError } from "@/lib/error-handler";

interface PrizePool {
  objectId: string;
  pool_id: string;
  name: string;
  description: string;
  total_amount: string;
  start_time: string;
  end_time: string;
  min_submissions: string;
  winners_count: string;
  status: number;
  participant_count: number;
}

export function usePrizePools() {
  const account = useCurrentAccount();
  const suiClient = useSuiClient();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [currentTime] = useState(() => Date.now());

  // Fetch all prize pools
  const { data: pools = [], isLoading: isLoadingPools } = useQuery({
    queryKey: ["prizePools"],
    queryFn: async () => {
      if (!TASK_REGISTRY_ID) return [];
      const pools = await getAllPrizePools(suiClient, TASK_REGISTRY_ID);
      return pools as PrizePool[];
    },
    enabled: !!TASK_REGISTRY_ID,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  // Filter active pools
  const activePools = useMemo(
    () => pools.filter(pool => pool.status === 0 && currentTime < Number(pool.end_time)),
    [pools, currentTime]
  );
  
  // Filter ended pools
  const endedPools = useMemo(
    () => pools.filter(pool => pool.status !== 0 || currentTime >= Number(pool.end_time)),
    [pools, currentTime]
  );

  /**
   * Create a new prize pool
   */
  const createPool = async (
    name: string,
    description: string,
    prizeAmount: number,
    startTime: number,
    endTime: number,
    minSubmissions: number,
    winnersCount: number
  ): Promise<boolean> => {
    if (!account || !TASK_REGISTRY_ID) {
      toast.error("Wallet not connected");
      return false;
    }

    setIsCreating(true);

    try {
      const tx = createPrizePoolTransaction(
        TASK_REGISTRY_ID,
        name,
        description,
        Math.floor(prizeAmount * 1_000_000_000),
        startTime,
        endTime,
        minSubmissions,
        winnersCount
      );

      return await new Promise((resolve) => {
        signAndExecute(
          { transaction: tx },
          {
            onSuccess: (result) => {
              console.log("Pool created:", result);
              toast.success("Prize pool created", {
                description: `Created "${name}" with ${prizeAmount} SUI prize.`,
              });

              queryClient.invalidateQueries({ queryKey: ["prizePools"] });
              setIsCreating(false);
              resolve(true);
            },
            onError: (error) => {
              console.error("Create pool error:", error);
              handleTransactionError(error);
              setIsCreating(false);
              resolve(false);
            },
          }
        );
      });
    } catch (error) {
      console.error("Create pool error:", error);
      handleTransactionError(error);
      setIsCreating(false);
      return false;
    }
  };

  /**
   * Join a prize pool
   */
  const joinPool = async (poolObjectId: string, poolName: string): Promise<boolean> => {
    if (!account) {
      toast.error("Wallet not connected");
      return false;
    }

    setIsJoining(true);

    try {
      const tx = joinPrizePoolTransaction(poolObjectId);

      return await new Promise((resolve) => {
        signAndExecute(
          { transaction: tx },
          {
            onSuccess: (result) => {
              console.log("Joined pool:", result);
              toast.success("Joined prize pool", {
                description: `You're now competing in "${poolName}".`,
              });

              queryClient.invalidateQueries({ queryKey: ["prizePools"] });
              setIsJoining(false);
              resolve(true);
            },
            onError: (error) => {
              console.error("Join pool error:", error);
              handleTransactionError(error);
              setIsJoining(false);
              resolve(false);
            },
          }
        );
      });
    } catch (error) {
      console.error("Join pool error:", error);
      handleTransactionError(error);
      setIsJoining(false);
      return false;
    }
  };

  return {
    pools,
    activePools,
    endedPools,
    isLoadingPools,
    isCreating,
    isJoining,
    createPool,
    joinPool,
  };
}
