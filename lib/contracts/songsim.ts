/**
 * Songsim Smart Contract Integration
 * Package ID and contract functions
 */

import { Transaction } from "@mysten/sui/transactions";
import { SuiClient } from "@mysten/sui/client";

// Quality Score Conversion Utilities
// Contract uses 0-1000 scale, UI uses 0-100 for better UX
export const QUALITY_SCALE_FACTOR = 10;
export const toContractQualityScore = (uiScore: number): number =>
  Math.round(uiScore * QUALITY_SCALE_FACTOR);
export const toUIQualityScore = (contractScore: number): number =>
  contractScore / QUALITY_SCALE_FACTOR;

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
  display_name: string;
  bio: string;
  avatar_url: string;
  user_type: number;
  created_at: string;
  tasks_created: string;
  submissions_count: string;
}

// Contract addresses (update after deployment)
export const PACKAGE_ID =
  process.env.NEXT_PUBLIC_PACKAGE_ID ||
  "0xe92d9bf5a82568d6c994917c88606eedd97374c978367a233c3fe33955534dea";
export const PLATFORM_CONFIG_ID =
  process.env.NEXT_PUBLIC_PLATFORM_CONFIG_ID || "";
export const TASK_REGISTRY_ID = process.env.NEXT_PUBLIC_TASK_REGISTRY_ID || "";

// Sui system constants
const CLOCK_ID = "0x6" as const;

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
      tx.object(CLOCK_ID), // Clock object required by contract
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
  datasetFilename: string,
  datasetContentType: string,
  title: string,
  description: string,
  instructions: string,
  requiredLabelers: number,
  deadline: number,
  bountyCoinId: string
): Transaction {
  const tx = new Transaction();

  const datasetUrlBytes = Array.from(new TextEncoder().encode(datasetUrl));
  const datasetFilenameBytes = Array.from(
    new TextEncoder().encode(datasetFilename)
  );
  const datasetContentTypeBytes = Array.from(
    new TextEncoder().encode(datasetContentType)
  );
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
      tx.pure.vector("u8", datasetFilenameBytes),
      tx.pure.vector("u8", datasetContentTypeBytes),
      tx.pure.vector("u8", titleBytes),
      tx.pure.vector("u8", descriptionBytes),
      tx.pure.vector("u8", instructionsBytes),
      tx.pure.u64(requiredLabelers),
      tx.pure.u64(deadline),
      tx.object(bountyCoinId),
      tx.object(CLOCK_ID), // Clock object required by contract
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
      tx.object(CLOCK_ID), // Clock object required by contract
    ],
  });

  return tx;
}

/**
 * Cancel task transaction
 * Requires the task to be in OPEN status with no submissions
 * The bounty amount will be split from the gas coin and refunded to the requester
 */
export function cancelTaskTransaction(taskObjectId: string): Transaction {
  const tx = new Transaction();

  // Call cancel_task with the task object and clock
  // Contract signature: entry fun cancel_task(labeling_task: &mut Task, clock: &Clock, ctx: &mut TxContext)
  tx.moveCall({
    target: `${PACKAGE_ID}::songsim::cancel_task`,
    arguments: [tx.object(taskObjectId), tx.object(CLOCK_ID)],
  });

  return tx;
}

/**
 * Extend task deadline transaction
 * Only the requester can extend the deadline for open or in-progress tasks
 * New deadline must be in the future and greater than current deadline
 */
export function extendDeadlineTransaction(
  taskObjectId: string,
  newDeadline: number
): Transaction {
  const tx = new Transaction();

  // Call extend_deadline with task object, new deadline, and clock
  // Contract signature: public fun extend_deadline(labeling_task: &mut Task, new_deadline: u64, clock: &Clock, ctx: &TxContext)
  tx.moveCall({
    target: `${PACKAGE_ID}::songsim::extend_deadline`,
    arguments: [
      tx.object(taskObjectId),
      tx.pure.u64(newDeadline),
      tx.object(CLOCK_ID),
    ],
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
          
          console.log("Raw profile fields from blockchain:", profileFields);
          
          // Sui RPC returns Move String type as plain JavaScript strings
          const displayName = profileFields.display_name as string;
          const bio = profileFields.bio as string;
          const avatarUrl = profileFields.avatar_url as string;
          
          console.log("Extracted strings:", {
            displayName,
            bio,
            avatarUrl,
          });
          
          return {
            objectId: profileObjectId,
            owner: profileFields.owner as string,
            display_name: displayName,
            bio: bio,
            avatar_url: avatarUrl,
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
            
            // Sui RPC returns Move String types as plain JavaScript strings
            tasks.push({
              objectId: taskObjectId,
              taskId: field.name.value,
              task_id: taskFields.task_id,
              requester: taskFields.requester,
              title: taskFields.title as string,
              description: taskFields.description as string,
              instructions: taskFields.instructions as string,
              dataset_url: taskFields.dataset_url as string,
              dataset_filename: taskFields.dataset_filename as string,
              dataset_content_type: taskFields.dataset_content_type as string,
              required_labelers: taskFields.required_labelers,
              deadline: taskFields.deadline,
              status: taskFields.status,
              created_at: taskFields.created_at,
              submission_count: taskFields.submission_count,
              bounty: taskFields.bounty,
              bounty_amount: taskFields.bounty_amount,
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
          task_id: taskFields.task_id,
          requester: taskFields.requester,
          title: taskFields.title as string,
          description: taskFields.description as string,
          instructions: taskFields.instructions as string,
          dataset_url: taskFields.dataset_url as string,
          dataset_filename: taskFields.dataset_filename as string,
          dataset_content_type: taskFields.dataset_content_type as string,
          required_labelers: taskFields.required_labelers,
          deadline: taskFields.deadline,
          status: taskFields.status,
          created_at: taskFields.created_at,
          submission_count: taskFields.submission_count,
          bounty: taskFields.bounty,
          bounty_amount: taskFields.bounty_amount,
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
 * Finalize consensus and distribute bounty to accepted labelers
 * @param configId - Platform config object ID
 * @param taskObjectId - Task object ID
 * @param acceptedSubmissionIds - Array of accepted submission IDs
 * @param acceptedLabelers - Array of labeler addresses (must match acceptedSubmissionIds order)
 * @param rejectedSubmissionIds - Array of rejected submission IDs
 * @param clockId - Sui Clock object (0x6)
 */
export function finalizeConsensusTransaction(
  configId: string,
  taskObjectId: string,
  acceptedSubmissionIds: number[],
  acceptedLabelers: string[],
  rejectedSubmissionIds: number[],
  clockId: string = "0x6"
): Transaction {
  const tx = new Transaction();

  // Validate inputs
  if (acceptedSubmissionIds.length !== acceptedLabelers.length) {
    throw new Error(
      "Accepted submission IDs must match labeler addresses count"
    );
  }

  tx.moveCall({
    target: `${PACKAGE_ID}::songsim::finalize_consensus`,
    arguments: [
      tx.object(configId),
      tx.object(taskObjectId),
      tx.pure.vector("u64", acceptedSubmissionIds),
      tx.pure.vector("address", acceptedLabelers),
      tx.pure.vector("u64", rejectedSubmissionIds),
      tx.object(clockId),
    ],
  });

  return tx;
}

/**
 * Stake SUI for anti-Sybil protection
 *
 * ⚠️ TEMPORARILY DISABLED - Contract Update Required
 *
 * The staking module exists but isn't exposed in songsim.move.
 * Contract needs to add:
 *
 * public fun create_labeler_stake(config, stake_coin, clock, ctx) {
 *   let stake = staking::create_stake(ctx.sender(), stake_coin, clock, ctx);
 *   transfer::public_transfer(stake, ctx.sender());
 * }
 *
 * Then update this to call: `${PACKAGE_ID}::songsim::create_labeler_stake`
 */
export function stakeForTaskTransaction(
  platformConfigId: string,
  stakeAmount: number
): Transaction {
  const tx = new Transaction();

  const [stakeCoin] = tx.splitCoins(tx.gas, [stakeAmount]);

  // TODO: Update after contract deployment
  tx.moveCall({
    target: `${PACKAGE_ID}::songsim::create_labeler_stake`,
    arguments: [tx.object(platformConfigId), stakeCoin, tx.object(CLOCK_ID)],
  });

  return tx;
}

/**
 * Unstake and withdraw SUI after lock period
 *
 * ⚠️ TEMPORARILY DISABLED - Contract Update Required
 *
 * Contract needs to add:
 *
 * public fun withdraw_labeler_stake(stake, clock, ctx) {
 *   let coins = staking::withdraw_stake(stake, clock, ctx);
 *   transfer::public_transfer(coins, ctx.sender());
 * }
 *
 * Then update this to call: `${PACKAGE_ID}::songsim::withdraw_labeler_stake`
 */
export function unstakeTransaction(stakeObjectId: string): Transaction {
  const tx = new Transaction();

  // TODO: Update after contract deployment
  tx.moveCall({
    target: `${PACKAGE_ID}::songsim::withdraw_labeler_stake`,
    arguments: [tx.object(stakeObjectId), tx.object(CLOCK_ID)],
  });

  return tx;
}

/**
 * Create a dispute for a submission
 *
 * Note: Contract signature is:
 * public fun create_dispute(registry, task_id, submission_id, reason, clock, ctx)
 *
 * Evidence URL and stake amount are not part of current contract implementation.
 */
export function createDisputeTransaction(
  registryId: string,
  taskId: number,
  submissionId: number,
  reason: string
): Transaction {
  const tx = new Transaction();

  const reasonBytes = Array.from(new TextEncoder().encode(reason));

  tx.moveCall({
    target: `${PACKAGE_ID}::songsim::create_dispute`,
    arguments: [
      tx.object(registryId),
      tx.pure.u64(taskId),
      tx.pure.u64(submissionId),
      tx.pure.vector("u8", reasonBytes),
      tx.object(CLOCK_ID),
    ],
  });

  return tx;
}

/**
 * Vote on a dispute
 *
 * Contract function: public fun vote_on_dispute(dispute, vote_for, ctx)
 */
export function voteOnDisputeTransaction(
  disputeObjectId: string,
  voteFor: boolean
): Transaction {
  const tx = new Transaction();

  tx.moveCall({
    target: `${PACKAGE_ID}::songsim::vote_on_dispute`,
    arguments: [tx.object(disputeObjectId), tx.pure.bool(voteFor)],
  });

  return tx;
}

/**
 * Create a prize pool
 */
export function createPrizePoolTransaction(
  registryId: string,
  taskObjectId: string,
  prizeAmount: number,
  entryFee: number,
  maxParticipants: number,
  deadline: number
): Transaction {
  const tx = new Transaction();

  const [prizeCoin] = tx.splitCoins(tx.gas, [prizeAmount]);

  tx.moveCall({
    target: `${PACKAGE_ID}::prize_pool::create_prize_pool`,
    arguments: [
      tx.object(registryId),
      tx.object(taskObjectId),
      prizeCoin,
      tx.pure.u64(entryFee),
      tx.pure.u64(maxParticipants),
      tx.pure.u64(deadline),
    ],
  });

  return tx;
}

/**
 * Join a prize pool
 */
export function joinPrizePoolTransaction(
  prizePoolObjectId: string,
  entryFeeAmount: number
): Transaction {
  const tx = new Transaction();

  const [entryFeeCoin] = tx.splitCoins(tx.gas, [entryFeeAmount]);

  tx.moveCall({
    target: `${PACKAGE_ID}::prize_pool::join_prize_pool`,
    arguments: [tx.object(prizePoolObjectId), entryFeeCoin],
  });

  return tx;
}

/**
 * Report quality score for a submission (Admin/Requester)
 * @param qualityScore - UI scale (0-100), will be converted to contract scale (0-1000)
 */
export function reportQualityTransaction(
  qualityRegistryId: string,
  submissionObjectId: string,
  qualityScore: number // 0-100 UI scale
): Transaction {
  const tx = new Transaction();

  // Convert UI scale (0-100) to contract scale (0-1000)
  const contractScore = toContractQualityScore(qualityScore);

  tx.moveCall({
    target: `${PACKAGE_ID}::quality::record_quality_score`,
    arguments: [
      tx.object(qualityRegistryId),
      tx.object(submissionObjectId),
      tx.pure.u64(contractScore),
    ],
  });

  return tx;
}

/**
 * Pause or unpause platform (Admin only - requires AdminCap)
 * @param paused - true to pause, false to unpause
 */
export function setPlatformPausedTransaction(
  adminCapId: string,
  platformConfigId: string,
  paused: boolean
): Transaction {
  const tx = new Transaction();

  tx.moveCall({
    target: `${PACKAGE_ID}::songsim::set_platform_paused`,
    arguments: [
      tx.object(adminCapId),
      tx.object(platformConfigId),
      tx.pure.bool(paused),
    ],
  });

  return tx;
}

// Note: Staking functions removed - contract doesn't expose them yet
// TODO: Add back after contract update with create_labeler_stake() and withdraw_labeler_stake()

// Note: respondToDisputeTransaction removed - not implemented in contract
// Disputes can be voted on using vote_on_dispute()
