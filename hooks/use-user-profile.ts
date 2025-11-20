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

  console.log("Processing profile data:", {
    display_name: profile.display_name,
    bio: profile.bio,
    avatar_url: profile.avatar_url,
  });

  // Sui RPC already decodes Move String types to JavaScript strings
  const displayName = profile.display_name || "";
  const bio = profile.bio || "";
  const avatarUrl = profile.avatar_url || null;

  console.log("Processed profile data:", {
    displayName,
    bio,
    avatarUrl,
    displayNameLength: displayName.length,
  });

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

      if (!profile) return null;

      // Fetch reputation from registry
      let reputationScore = 500; // Default for new users
      try {
        const registryObject = await client.getObject({
          id: TASK_REGISTRY_ID,
          options: { showContent: true },
        });

        if (registryObject.data?.content && "fields" in registryObject.data.content) {
          const fields = registryObject.data.content.fields as any;
          const reputationsTableId = fields.reputations?.fields?.id?.id;

          if (reputationsTableId) {
            try {
              const dynamicFieldObject = await client.getDynamicFieldObject({
                parentId: reputationsTableId,
                name: {
                  type: "address",
                  value: account.address,
                },
              });

              if (dynamicFieldObject.data?.content && "fields" in dynamicFieldObject.data.content) {
                const fieldContent = dynamicFieldObject.data.content.fields as any;
                const reputationObjectId = fieldContent.value as string;

                const reputationObject = await client.getObject({
                  id: reputationObjectId,
                  options: { showContent: true },
                });

                if (reputationObject.data?.content && "fields" in reputationObject.data.content) {
                  const repFields = reputationObject.data.content.fields as any;
                  reputationScore = Number(repFields.reputation_score || 500);
                }
              }
            } catch (error) {
              console.log("No reputation found for user, using default");
            }
          }
        }
      } catch (error) {
        console.error("Error fetching reputation:", error);
      }

      const processed = processProfileData(profile);
      if (processed) {
        processed.reputationScore = reputationScore;
      }
      return processed;
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
