/**
 * React Query hooks for user profile management
 */

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSuiClient, useCurrentAccount } from "@mysten/dapp-kit";
import {
  getUserProfile,
  hasUserProfile,
  decodeVectorU8,
  TASK_REGISTRY_ID,
  type UserProfileData,
} from "@/lib/contracts/songsim";

export interface ProcessedProfile {
  objectId: string;
  owner: string;
  displayName: string;
  bio: string;
  avatarUrl: string | null;
  userType: number;
  createdAt: string;
  tasksCreated: string;
  submissionsCount: string;
  reputationScore: number;
  totalEarned: number;
}

/**
 * Process raw profile data from blockchain
 */
function processProfileData(
  profile: UserProfileData | null
): ProcessedProfile | null {
  if (!profile) return null;

  const displayName = decodeVectorU8(profile.display_name);
  const bio = decodeVectorU8(profile.bio);

  // Avatar URL is now stored directly in the contract
  let avatarUrl: string | null = null;
  if (profile.avatar_url && profile.avatar_url.length > 0) {
    avatarUrl = decodeVectorU8(profile.avatar_url);
    console.log("Avatar URL (from contract):", avatarUrl);
  }

  return {
    objectId: profile.objectId,
    owner: profile.owner,
    displayName,
    bio,
    avatarUrl,
    userType: profile.user_type,
    createdAt: profile.created_at,
    tasksCreated: profile.tasks_created,
    submissionsCount: profile.submissions_count,
    reputationScore: 500, // Default reputation score (will be fetched from Reputation object in future)
    totalEarned: 0, // Total earnings (will be calculated from submissions in future)
  };
}

/**
 * Hook to fetch current user's profile
 */
export function useUserProfile() {
  const client = useSuiClient();
  const account = useCurrentAccount();

  return useQuery({
    queryKey: ["userProfile", account?.address],
    queryFn: async () => {
      if (!account || !TASK_REGISTRY_ID) {
        return null;
      }

      const profile = await getUserProfile(
        client,
        account.address,
        TASK_REGISTRY_ID
      );

      return processProfileData(profile);
    },
    enabled: !!account && !!TASK_REGISTRY_ID,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to check if user has a profile
 */
export function useHasProfile() {
  const client = useSuiClient();
  const account = useCurrentAccount();

  return useQuery({
    queryKey: ["hasProfile", account?.address],
    queryFn: async () => {
      if (!account || !TASK_REGISTRY_ID) {
        return false;
      }

      return await hasUserProfile(client, account.address, TASK_REGISTRY_ID);
    },
    enabled: !!account && !!TASK_REGISTRY_ID,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to fetch any user's profile by address
 */
export function useProfileByAddress(address: string | null) {
  const client = useSuiClient();

  return useQuery({
    queryKey: ["profile", address],
    queryFn: async () => {
      if (!address || !TASK_REGISTRY_ID) {
        return null;
      }

      const profile = await getUserProfile(client, address, TASK_REGISTRY_ID);
      return processProfileData(profile);
    },
    enabled: !!address && !!TASK_REGISTRY_ID,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to invalidate profile queries (after updates)
 */
export function useInvalidateProfile() {
  const queryClient = useQueryClient();
  const account = useCurrentAccount();

  return () => {
    queryClient.invalidateQueries({
      queryKey: ["userProfile", account?.address],
    });
    queryClient.invalidateQueries({
      queryKey: ["hasProfile", account?.address],
    });
    queryClient.invalidateQueries({
      queryKey: ["profile", account?.address],
    });
  };
}
