/**
 * Songsim Smart Contract Constants
 *
 * Auto-generated from deployment on Sui Testnet
 * Date: November 20, 2025
 * Transaction: EFmYwACtrQ3xVzsfxsPJQ2ZK7aw3XxRZr494ZHx5FLAw
 * Version: 2.0.0 (36/36 tests passing + Staking Functions)
 *
 * This deployment includes:
 * - Main songsim module (marketplace logic)
 * - Staking module (anti-Sybil protection) - NOW EXPOSED
 * - access_policy module (Seal encryption access control)
 * - migration module (version tracking & upgrades)
 * - All security features (quality, emergency, disputes, prize pools)
 */

export const NETWORK = "testnet" as const;

export const CONTRACT = {
  PACKAGE_ID:
    "0xe92d9bf5a82568d6c994917c88606eedd97374c978367a233c3fe33955534dea",
  MODULE_NAME: "songsim",
  ACCESS_POLICY_MODULE: "access_policy",
  STAKING_MODULE: "staking",
} as const;

export const OBJECTS = {
  ADMIN_CAP_ID:
    "0x361efdc205a526c6dfaf5ef7313bac1dc1b1f690c6d0c7ac826bcb02a057d429",
  PLATFORM_CONFIG_ID:
    "0x80ecfcccd12cfcfccb0436691d3cda735a02fc9d02a4f55bbea75cd8eb703385",
  TASK_REGISTRY_ID:
    "0x8d0aaa56bac53294a2c35220bc66dc2159043d67d12a6b31a2605644edb7c82a",
  MIGRATION_STATE_ID:
    "0xa6b0753bc01a20116959c36bbce33243faabc2ed1b74f7ac7a0a76d2c2a956c7",
  ACCESS_REGISTRY_ID:
    "0x703b68cc81fd3e9e450a6f3861b14238014c8d80aebe5b94405828f78fbb2e48",
  UPGRADE_CAP_ID:
    "0xcf8a2af8ce073e32292d446c4fb356cddea0d66aaf5c112680f4f5a96322282a",
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
