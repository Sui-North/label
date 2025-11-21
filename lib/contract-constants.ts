/**
 * Songsim Smart Contract Constants
 *
 * Auto-generated from deployment on Sui Testnet
 * Deployed: January 2025 (v3.0.0 - Shared Object Architecture)
 * Transaction: 97F1tghBCqbDuSk2zpCXaJzxqtApFdy799JV1YGp9M9Z
 * Version: 3.0.0 (19/19 tests passing)
 *
 * This deployment includes:
 * - Main songsim module (marketplace logic)
 * - Staking module (anti-Sybil protection)
 * - access_policy module (Seal encryption access control)
 * - migration module (version tracking & upgrades)
 * - batch_updates module (post-consensus labeler updates)
 * - quality module (per-task quality metrics)
 * - ARCHITECTURE: Shared objects (Profile, Reputation, Submission, QualityTracker)
 * - All security features (quality, emergency, disputes, prize pools)
 */

export const NETWORK = "testnet" as const;

export const CONTRACT = {
  PACKAGE_ID:
    "0xe26690f7c4c45ee7ceedee6dceb2b269ab49581a2b9844ff1ca382fe8415757d",
  MODULE_NAME: "songsim",
  ACCESS_POLICY_MODULE: "access_policy",
  STAKING_MODULE: "staking",
  BATCH_UPDATES_MODULE: "batch_updates",
  QUALITY_MODULE: "quality",
} as const;

export const OBJECTS = {
  ADMIN_CAP_ID:
    "0xba868a6534fb40aa16b896c2b79382584f3c8f9a6d4a8232faf7285eeb139203",
  PLATFORM_CONFIG_ID:
    "0x57377260251d300719d7423db4a290e323b4c6a5383a70ea2ae26e36390e9ff1",
  TASK_REGISTRY_ID:
    "0xb3d5c0cfdb4cc0894f3c5dbd15f3f2b1f9daa94cd333f84c8a027e5d2fab8470",
  MIGRATION_STATE_ID:
    "0xf35a64efef3f466da9d713f1c54272085d5dcd2c228c9b6f2909cf282699050c",
  ACCESS_REGISTRY_ID:
    "0xadfdc3da5595990615091002bcbe1bd9baff6a75b2f9b6f20794cad409b68c67",
  UPGRADE_CAP_ID:
    "0x200264ee1adfbb72e9e33d5acea96f7e8037374fa0123ae52fd3f5c7f282a59d",
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
