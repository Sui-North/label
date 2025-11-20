/**
 * Songsim Smart Contract Constants
 *
 * Auto-generated from deployment on Sui Testnet
 * Date: Latest deployment - Epoch 923, Transaction: 45HVFV68FumxmYoutcy5bqtdJ7pdtAoVMHY8McMk13TX
 *
 * This deployment includes:
 * - Main songsim module (marketplace logic)
 * - access_policy module (Seal encryption access control)
 */

export const NETWORK = "testnet" as const;

export const CONTRACT = {
  PACKAGE_ID:
    "0x6c6d48de42b8908bd08b110c820517f020954c887b8e02b2c1b1c4018ce4c1bf",
  MODULE_NAME: "songsim",
  ACCESS_POLICY_MODULE: "access_policy",
} as const;

export const OBJECTS = {
  ADMIN_CAP_ID:
    "0x24b16d11daf8a4c98e54a6abbfac354a43ddbecbea3e6abe5991eeee1876de08",
  PLATFORM_CONFIG_ID:
    "0x05ac3d26c32c397a85c02cbadc0785f3bda4cc9ca97be84e06d30e8d8b2ab5f9",
  TASK_REGISTRY_ID:
    "0xedf112f1c732d5010e45b6b3da4e3b2d63d911a1195aa3f96bbc3f02cf81e518",
  ACCESS_REGISTRY_ID:
    "0x79fd9e826cab39eb1d4aeb15a63084c63625ce725c1ea22480a816a61514c03d",
  UPGRADE_CAP_ID:
    "0x90409f8e4c8303598a1be19eb384721a283992d0d5d28544466aa4fa435ea718",
} as const;

export const PLATFORM_CONFIG = {
  FEE_BPS: 500, // 5%
  MIN_BOUNTY: 1_000_000, // 0.001 SUI (1M MIST)
} as const;

export const USER_TYPES = {
  REQUESTER: 1,
  LABELER: 2,
  BOTH: 3,
} as const;

export const TASK_STATUS = {
  OPEN: 0,
  IN_PROGRESS: 1,
  COMPLETED: 2,
  CANCELLED: 3,
} as const;

export const SUBMISSION_STATUS = {
  PENDING: 0,
  ACCEPTED: 1,
  REJECTED: 2,
} as const;

export const REPUTATION = {
  MIN_SCORE: 0,
  MAX_SCORE: 1000,
  ACCEPTANCE_BONUS: 50,
  REJECTION_PENALTY: 50,
} as const;

export const RPC_ENDPOINTS = {
  TESTNET: "https://fullnode.testnet.sui.io:443",
} as const;

export const EXPLORER_URLS = {
  TRANSACTION: (digest: string) =>
    `https://testnet.suivision.xyz/txblock/${digest}`,
  PACKAGE: (packageId: string) =>
    `https://testnet.suivision.xyz/package/${packageId}`,
  OBJECT: (objectId: string) =>
    `https://testnet.suivision.xyz/object/${objectId}`,
  ADDRESS: (address: string) =>
    `https://testnet.suivision.xyz/account/${address}`,
} as const;

// Transaction type definitions
export const TRANSACTION_TYPES = {
  CREATE_PROFILE: `${CONTRACT.PACKAGE_ID}::${CONTRACT.MODULE_NAME}::create_profile`,
  UPDATE_PROFILE: `${CONTRACT.PACKAGE_ID}::${CONTRACT.MODULE_NAME}::update_profile`,
  CREATE_TASK: `${CONTRACT.PACKAGE_ID}::${CONTRACT.MODULE_NAME}::create_task`,
  SUBMIT_LABELS: `${CONTRACT.PACKAGE_ID}::${CONTRACT.MODULE_NAME}::submit_labels`,
  CANCEL_TASK: `${CONTRACT.PACKAGE_ID}::${CONTRACT.MODULE_NAME}::cancel_task`,
  FINALIZE_CONSENSUS: `${CONTRACT.PACKAGE_ID}::${CONTRACT.MODULE_NAME}::finalize_consensus`,
  DISTRIBUTE_PAYOUT: `${CONTRACT.PACKAGE_ID}::${CONTRACT.MODULE_NAME}::distribute_payout`,

  // Seal encryption access policy transactions
  SEAL_REGISTER_TASK: `${CONTRACT.PACKAGE_ID}::${CONTRACT.ACCESS_POLICY_MODULE}::register_task`,
  SEAL_REGISTER_SUBMISSION: `${CONTRACT.PACKAGE_ID}::${CONTRACT.ACCESS_POLICY_MODULE}::register_submission`,
  SEAL_APPROVE_TASK: `${CONTRACT.PACKAGE_ID}::${CONTRACT.ACCESS_POLICY_MODULE}::seal_approve_task`,
  SEAL_APPROVE_SUBMISSION: `${CONTRACT.PACKAGE_ID}::${CONTRACT.ACCESS_POLICY_MODULE}::seal_approve_submission`,
  SEAL_APPROVE_PUBLIC: `${CONTRACT.PACKAGE_ID}::${CONTRACT.ACCESS_POLICY_MODULE}::seal_approve_public`,
} as const;

// Event type definitions
export const EVENT_TYPES = {
  PROFILE_CREATED: `${CONTRACT.PACKAGE_ID}::${CONTRACT.MODULE_NAME}::ProfileCreated`,
  PROFILE_UPDATED: `${CONTRACT.PACKAGE_ID}::${CONTRACT.MODULE_NAME}::ProfileUpdated`,
  TASK_CREATED: `${CONTRACT.PACKAGE_ID}::${CONTRACT.MODULE_NAME}::TaskCreated`,
  SUBMISSION_RECEIVED: `${CONTRACT.PACKAGE_ID}::${CONTRACT.MODULE_NAME}::SubmissionReceived`,
  CONSENSUS_FINALIZED: `${CONTRACT.PACKAGE_ID}::${CONTRACT.MODULE_NAME}::ConsensusFinalized`,
  PAYOUT_DISTRIBUTED: `${CONTRACT.PACKAGE_ID}::${CONTRACT.MODULE_NAME}::PayoutDistributed`,
  PLATFORM_FEE_COLLECTED: `${CONTRACT.PACKAGE_ID}::${CONTRACT.MODULE_NAME}::PlatformFeeCollected`,
  REPUTATION_UPDATED: `${CONTRACT.PACKAGE_ID}::${CONTRACT.MODULE_NAME}::ReputationUpdated`,
  PLATFORM_CONFIG_UPDATED: `${CONTRACT.PACKAGE_ID}::${CONTRACT.MODULE_NAME}::PlatformConfigUpdated`,
} as const;

// Helper to convert MIST to SUI
export const MIST_PER_SUI = 1_000_000_000;

export const formatSUI = (mist: number): string => {
  return (mist / MIST_PER_SUI).toFixed(4);
};

export const parseSUI = (sui: string): number => {
  return Math.floor(parseFloat(sui) * MIST_PER_SUI);
};
