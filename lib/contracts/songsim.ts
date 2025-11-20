/**
 * Songsim Smart Contract Integration
 * Package ID and contract functions
 */

import { Transaction } from "@mysten/sui/transactions";
import { SuiClient } from "@mysten/sui/client";

// Type definitions for contract data
interface MoveObject {
  [key: string]: unknown;
}

interface TableField {
  fields: {
    id: { id: string };
  };
}

export interface UserProfileData {
  objectId: string;
  owner: string;
  display_name: number[];
  bio: number[];
  avatar_url: number[];
  user_type: number;
  created_at: string;
  tasks_created: string;
  submissions_count: string;
}

// Contract addresses (update after deployment)
export const PACKAGE_ID =
  process.env.NEXT_PUBLIC_PACKAGE_ID ||
  "0xd567fd084674a7c76ea3edb4e184b1423139ae5bcda8c4c1e3a3a9569494b5a9";
export const PLATFORM_CONFIG_ID =
  process.env.NEXT_PUBLIC_PLATFORM_CONFIG_ID || "";
export const TASK_REGISTRY_ID = process.env.NEXT_PUBLIC_TASK_REGISTRY_ID || "";

// User types from contract
export const USER_TYPES = {
  REQUESTER: 1,
  LABELER: 2,
  BOTH: 3,
  ADMIN: 4,
} as const;

// Task status from contract
export const TASK_STATUS = {
  OPEN: 0,
  IN_PROGRESS: 1,
  COMPLETED: 2,
  CANCELLED: 3,
} as const;

export type UserType = (typeof USER_TYPES)[keyof typeof USER_TYPES];
export type TaskStatus = (typeof TASK_STATUS)[keyof typeof TASK_STATUS];

/**
 * Create user profile transaction
 */
export function createProfileTransaction(
  registryId: string,
  configId: string,
  displayName: string,
  bio: string,
  avatarUrl: string,
  userType: UserType
): Transaction {
  const tx = new Transaction();

  // Convert strings to vector<u8> format for Move
  const displayNameBytes = Array.from(new TextEncoder().encode(displayName));
  const bioBytes = Array.from(new TextEncoder().encode(bio));
  const avatarUrlBytes = Array.from(new TextEncoder().encode(avatarUrl));

  tx.moveCall({
    target: `${PACKAGE_ID}::songsim::create_profile`,
    arguments: [
      tx.object(registryId),
      tx.object(configId),
      tx.pure.vector("u8", displayNameBytes),
      tx.pure.vector("u8", bioBytes),
      tx.pure.vector("u8", avatarUrlBytes),
      tx.pure.u8(userType),
    ],
  });

  return tx;
}

/**
 * Update user profile transaction
 */
export function updateProfileTransaction(
  profileObjectId: string,
  displayName: string,
  bio: string,
  avatarUrl: string
): Transaction {
  const tx = new Transaction();

  const displayNameBytes = Array.from(new TextEncoder().encode(displayName));
  const bioBytes = Array.from(new TextEncoder().encode(bio));
  const avatarUrlBytes = Array.from(new TextEncoder().encode(avatarUrl));

  tx.moveCall({
    target: `${PACKAGE_ID}::songsim::update_profile`,
    arguments: [
      tx.object(profileObjectId),
      tx.pure.vector("u8", displayNameBytes),
      tx.pure.vector("u8", bioBytes),
      tx.pure.vector("u8", avatarUrlBytes),
    ],
  });

  return tx;
}

/**
 * Update user type preference transaction
 */
export function updateUserTypeTransaction(
  profileObjectId: string,
  newUserType: UserType
): Transaction {
  const tx = new Transaction();

  tx.moveCall({
    target: `${PACKAGE_ID}::songsim::update_user_type`,
    arguments: [tx.object(profileObjectId), tx.pure.u8(newUserType)],
  });

  return tx;
}

/**
 * Create task transaction
 */
export function createTaskTransaction(
  registryId: string,
  configId: string,
  profileObjectId: string,
  datasetUrl: string,
  title: string,
  description: string,
  instructions: string,
  requiredLabelers: number,
  deadline: number,
  bountyCoinId: string
): Transaction {
  const tx = new Transaction();

  const datasetUrlBytes = Array.from(new TextEncoder().encode(datasetUrl));
  const titleBytes = Array.from(new TextEncoder().encode(title));
  const descriptionBytes = Array.from(new TextEncoder().encode(description));
  const instructionsBytes = Array.from(new TextEncoder().encode(instructions));

  tx.moveCall({
    target: `${PACKAGE_ID}::songsim::create_task`,
    arguments: [
      tx.object(registryId),
      tx.object(configId),
      tx.object(profileObjectId),
      tx.pure.vector("u8", datasetUrlBytes),
      tx.pure.vector("u8", titleBytes),
      tx.pure.vector("u8", descriptionBytes),
      tx.pure.vector("u8", instructionsBytes),
      tx.pure.u64(requiredLabelers),
      tx.pure.u64(deadline),
      tx.object(bountyCoinId),
    ],
  });

  return tx;
}

/**
 * Submit labels transaction
 */
export function submitLabelsTransaction(
  registryId: string,
  taskObjectId: string,
  profileObjectId: string,
  resultUrl: string,
  resultFilename: string,
  resultContentType: string
): Transaction {
  const tx = new Transaction();

  const resultUrlBytes = Array.from(new TextEncoder().encode(resultUrl));
  const filenameBytes = Array.from(new TextEncoder().encode(resultFilename));
  const contentTypeBytes = Array.from(
    new TextEncoder().encode(resultContentType)
  );

  tx.moveCall({
    target: `${PACKAGE_ID}::songsim::submit_labels`,
    arguments: [
      tx.object(registryId),
      tx.object(taskObjectId),
      tx.object(profileObjectId),
      tx.pure.vector("u8", resultUrlBytes),
      tx.pure.vector("u8", filenameBytes),
      tx.pure.vector("u8", contentTypeBytes),
    ],
  });

  return tx;
}

/**
 * Cancel task transaction
 * Requires the task to be in OPEN status with no submissions
 * The bounty amount will be split from the gas coin and refunded to the requester
 */
export function cancelTaskTransaction(
  taskObjectId: string,
  bountyAmount: number
): Transaction {
  const tx = new Transaction();

  // Split the bounty amount from gas coin
  const [bountyCoin] = tx.splitCoins(tx.gas, [bountyAmount]);

  // Call cancel_task with the task object and bounty coin
  tx.moveCall({
    target: `${PACKAGE_ID}::songsim::cancel_task`,
    arguments: [tx.object(taskObjectId), bountyCoin],
  });

  return tx;
}

/**
 * Query user profile from blockchain
 */
export async function getUserProfile(
  client: SuiClient,
  userAddress: string,
  registryId: string
): Promise<UserProfileData | null> {
  try {
    // Get the registry object to access the profiles table
    const registry = await client.getObject({
      id: registryId,
      options: {
        showContent: true,
      },
    });

    if (
      !registry.data?.content ||
      registry.data.content.dataType !== "moveObject"
    ) {
      throw new Error("Invalid registry object");
    }

    const fields = registry.data.content.fields as MoveObject;
    const profilesTable = fields.profiles as TableField;
    const profilesTableId = profilesTable.fields.id.id;

    console.log("Profiles table ID:", profilesTableId);
    console.log("Looking for user address:", userAddress);

    // Query the dynamic field directly with the user's address as the key
    try {
      const dynamicFieldObject = await client.getDynamicFieldObject({
        parentId: profilesTableId,
        name: {
          type: "address",
          value: userAddress,
        },
      });

      if (
        dynamicFieldObject.data?.content &&
        dynamicFieldObject.data.content.dataType === "moveObject"
      ) {
        const fieldContent = dynamicFieldObject.data.content
          .fields as MoveObject;
        // The value field contains the profile object address
        const profileObjectId = fieldContent.value as string;

        console.log("Found profile object ID:", profileObjectId);

        // Fetch the actual UserProfile object
        const profileObject = await client.getObject({
          id: profileObjectId,
          options: {
            showContent: true,
          },
        });

        if (
          profileObject.data?.content &&
          profileObject.data.content.dataType === "moveObject"
        ) {
          const profileFields = profileObject.data.content.fields as MoveObject;
          return {
            objectId: profileObjectId,
            owner: profileFields.owner as string,
            display_name: profileFields.display_name as number[],
            bio: profileFields.bio as number[],
            avatar_url: profileFields.avatar_url as number[],
            user_type: profileFields.user_type as number,
            created_at: profileFields.created_at as string,
            tasks_created: profileFields.tasks_created as string,
            submissions_count: profileFields.submissions_count as string,
          };
        }
      }
    } catch {
      // Dynamic field not found means no profile exists
      console.log("No profile found for address:", userAddress);
      return null;
    }

    return null;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
}

/**
 * Check if user has a profile
 */
export async function hasUserProfile(
  client: SuiClient,
  userAddress: string,
  registryId: string
): Promise<boolean> {
  const profile = await getUserProfile(client, userAddress, registryId);
  return profile !== null;
}

/**
 * Get all tasks from the registry
 * Note: Falls back to querying user-owned tasks if registry table is empty
 */
export async function getAllTasks(client: SuiClient, registryId: string) {
  try {
    const registry = await client.getObject({
      id: registryId,
      options: {
        showContent: true,
      },
    });

    if (
      !registry.data?.content ||
      registry.data.content.dataType !== "moveObject"
    ) {
      throw new Error("Invalid registry object");
    }

    const fields = registry.data.content.fields as MoveObject;
    const tasksTable = fields.tasks as TableField;
    const tasksTableId = tasksTable.fields.id.id;

    // Query all dynamic fields in the tasks table
    const dynamicFields = await client.getDynamicFields({
      parentId: tasksTableId,
    });

    const tasks: any[] = [];

    // If the registry table is empty, we need to query tasks differently
    // Tasks are owned objects, so we'll return empty and rely on user-specific queries
    if (dynamicFields.data.length === 0) {
      console.warn(
        "Registry tasks table is empty. Tasks may not have been registered properly."
      );
      console.warn("Falling back to user-owned task queries in hooks.");
      return tasks;
    }

    for (const field of dynamicFields.data) {
      try {
        // Get the dynamic field to access the task object ID (stored as value)
        const dynamicFieldObject = await client.getDynamicFieldObject({
          parentId: tasksTableId,
          name: {
            type: "u64",
            value: field.name.value as string,
          },
        });

        if (
          dynamicFieldObject.data?.content &&
          dynamicFieldObject.data.content.dataType === "moveObject"
        ) {
          const fieldContent = dynamicFieldObject.data.content
            .fields as MoveObject;
          const taskObjectId = fieldContent.value as string;

          // Fetch the actual Task object
          const taskObject = await client.getObject({
            id: taskObjectId,
            options: {
              showContent: true,
            },
          });

          if (
            taskObject.data?.content &&
            taskObject.data.content.dataType === "moveObject"
          ) {
            const taskFields = taskObject.data.content.fields as MoveObject;
            tasks.push({
              objectId: taskObjectId,
              taskId: field.name.value,
              ...taskFields,
            });
          }
        }
      } catch (error) {
        console.error(`Error fetching task ${field.name.value}:`, error);
        // Continue with next task
      }
    }

    return tasks;
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return [];
  }
}

/**
 * Get tasks owned by a specific user
 * This is a workaround for when tasks aren't registered in the registry table
 */
export async function getUserOwnedTasks(
  client: SuiClient,
  ownerAddress: string
) {
  try {
    const ownedObjects = await client.getOwnedObjects({
      owner: ownerAddress,
      filter: {
        StructType: `${PACKAGE_ID}::songsim::Task`,
      },
      options: {
        showContent: true,
      },
    });

    const tasks: any[] = [];
    for (const obj of ownedObjects.data) {
      if (obj.data?.content && obj.data.content.dataType === "moveObject") {
        const taskFields = obj.data.content.fields as MoveObject;
        tasks.push({
          objectId: obj.data.objectId,
          taskId: taskFields.task_id,
          ...taskFields,
        });
      }
    }

    return tasks;
  } catch (error) {
    console.error("Error fetching user owned tasks:", error);
    return [];
  }
}

/**
 * Decode vector<u8> to string
 */
export function decodeVectorU8(bytes: number[]): string {
  return new TextDecoder().decode(new Uint8Array(bytes));
}

/**
 * Format SUI amount from MIST
 */
export function formatSuiAmount(mist: bigint | string | number): string {
  const mistBigInt = typeof mist === "bigint" ? mist : BigInt(mist);
  const sui = Number(mistBigInt) / 1_000_000_000;
  return sui.toFixed(2);
}

/**
 * Finalize consensus for a task
 * Marks submissions as accepted or rejected
 */
export function finalizeConsensusTransaction(
  taskObjectId: string,
  acceptedSubmissionIds: number[],
  rejectedSubmissionIds: number[]
) {
  const tx = new Transaction();

  tx.moveCall({
    target: `${PACKAGE_ID}::songsim::finalize_consensus`,
    arguments: [
      tx.object(taskObjectId),
      tx.pure.vector("u64", acceptedSubmissionIds),
      tx.pure.vector("u64", rejectedSubmissionIds),
    ],
  });

  return tx;
}
