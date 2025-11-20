"use client";

import { useState } from "react";
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  stakeForTaskTransaction,
  unstakeTransaction,
  PACKAGE_ID,
  PLATFORM_CONFIG_ID,
} from "@/lib/contracts/songsim";
import { handleTransactionError } from "@/lib/error-handler";

interface StakeInfo {
  objectId: string;
  labeler: string;
  stakeValue: number; // MIST
  lockedUntil: number; // timestamp
  slashedAmount: number;
  isLocked: boolean;
}

export function useStaking() {
  const account = useCurrentAccount();
  const suiClient = useSuiClient();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const queryClient = useQueryClient();
  const [isStaking, setIsStaking] = useState(false);
  const [isUnstaking, setIsUnstaking] = useState(false);

  // Fetch user's stakes
  const { data: stakes = [], isLoading: isLoadingStakes } = useQuery({
    queryKey: ["stakes", account?.address],
    queryFn: async () => {
      if (!account?.address) return [];
      
      try {
        // Query LabelerStake objects owned by current user
        const result = await suiClient.getOwnedObjects({
          owner: account.address,
          filter: {
            StructType: `${PACKAGE_ID}::staking::LabelerStake`
          },
          options: {
            showContent: true,
            showType: true,
          }
        });

        const now = Date.now();
        const stakesData: StakeInfo[] = result.data
          .filter(obj => obj.data?.content && 'fields' in obj.data.content)
          .map(obj => {
            const fields = (obj.data?.content as any).fields;
            const lockedUntil = Number(fields.locked_until);
            
            return {
              objectId: obj.data!.objectId,
              labeler: fields.labeler,
              stakeValue: Number(fields.stake_value),
              lockedUntil: lockedUntil,
              slashedAmount: Number(fields.slashed_amount || 0),
              isLocked: now < lockedUntil,
            };
          });

        return stakesData;
      } catch (error) {
        console.error("Error fetching stakes:", error);
        return [];
      }
    },
    enabled: !!account?.address && !!PACKAGE_ID,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  // Calculate total staked amount
  const totalStaked = stakes.reduce(
    (sum, stake) => sum + stake.stakeValue,
    0
  );

  /**
   * Create a new stake
   */
  const stakeForTask = async (
    amountSUI: number
  ): Promise<boolean> => {
    if (!account) {
      toast.error("Wallet not connected", {
        description: "Please connect your wallet to stake.",
      });
      return false;
    }

    if (amountSUI <= 0) {
      toast.error("Invalid amount", {
        description: "Stake amount must be greater than 0.",
      });
      return false;
    }

    setIsStaking(true);

    try {
      // Convert SUI to MIST
      const amountMIST = Math.floor(amountSUI * 1_000_000_000);

      const tx = stakeForTaskTransaction(
        PLATFORM_CONFIG_ID!,
        amountMIST
      );

      return await new Promise((resolve) => {
        signAndExecute(
          { transaction: tx },
          {
            onSuccess: (result) => {
              console.log("Stake successful:", result);
              toast.success("Stake successful", {
                description: `You staked ${amountSUI} SUI for this task.`,
              });

              // Invalidate queries
              queryClient.invalidateQueries({ queryKey: ["stakes"] });
              queryClient.invalidateQueries({ queryKey: ["profile"] });

              setIsStaking(false);
              resolve(true);
            },
            onError: (error) => {
              console.error("Stake error:", error);
              handleTransactionError(error);
              setIsStaking(false);
              resolve(false);
            },
          }
        );
      });
    } catch (error) {
      console.error("Stake error:", error);
      handleTransactionError(error);
      setIsStaking(false);
      return false;
    }
  };

  /**
   * Unstake SUI from a completed task
   */
  const unstake = async (
    stakeObjectId: string
  ): Promise<boolean> => {
    if (!account) {
      toast.error("Wallet not connected");
      return false;
    }

    setIsUnstaking(true);

    try {
      const tx = unstakeTransaction(stakeObjectId);

      return await new Promise((resolve) => {
        signAndExecute(
          { transaction: tx },
          {
            onSuccess: (result) => {
              console.log("Unstake successful:", result);
              toast.success("Unstake successful", {
                description: "Your stake has been returned to your wallet.",
              });

              // Invalidate queries
              queryClient.invalidateQueries({ queryKey: ["stakes"] });
              queryClient.invalidateQueries({ queryKey: ["profile"] });

              setIsUnstaking(false);
              resolve(true);
            },
            onError: (error) => {
              console.error("Unstake error:", error);
              handleTransactionError(error);
              setIsUnstaking(false);
              resolve(false);
            },
          }
        );
      });
    } catch (error) {
      console.error("Unstake error:", error);
      handleTransactionError(error);
      setIsUnstaking(false);
      return false;
    }
  };

  return {
    stakes,
    totalStaked,
    isLoadingStakes,
    isStaking,
    isUnstaking,
    stakeForTask,
    unstake,
  };
}
