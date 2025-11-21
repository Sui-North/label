/**
 * Songsim Smart Contract Constants
 *
 * Auto-generated from deployment on Sui Testnet
 * Deployed: November 21, 2025 (v4.0.0 - Batch Submission Updates)
 * Transaction: 217gS5Xha1aDwiH2hkSaXA1PNcwxnWxU8iKJkvAoSegW
 * Version: 4.0.0
 *
 * This deployment includes:
 * - Main songsim module (marketplace logic)
 * - NEW: batch_update_submissions() - Update up to 5 submission statuses at once
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
    "0x386894d174ee5fc9b5d61c29dbc87ebb3a63139f9ff9f175d53d4b18b20df019",
  MODULE_NAME: "songsim",
  ACCESS_POLICY_MODULE: "access_policy",
  STAKING_MODULE: "staking",
  BATCH_UPDATES_MODULE: "batch_updates",
  QUALITY_MODULE: "quality",
} as const;

export const OBJECTS = {
  ADMIN_CAP_ID:
    "0x7a20244472259959ffafa9d70385bcb7593b29b0c67d71d932a2330ada6e808d",
  PLATFORM_CONFIG_ID:
    "0x25c4b71c7ead987430f2c4ab37afea9d7eab65d3976667353cbe00124f673ec6",
  TASK_REGISTRY_ID:
    "0x927240e69cb7fae86ddef16151537398abe4ab52966b8dc0814cd51029869fde",
  MIGRATION_STATE_ID:
    "0x1a04c9cafa721875bdf0445e56215d832d1b8ad939c93d2fa53990fc50522b8f",
  ACCESS_REGISTRY_ID:
    "0xa1c6c929da4570ccca5d68db5edbf88a0fd6361b0bb0f610503abdadc0b177a5",
  UPGRADE_CAP_ID:
    "0x8784187ddb2481f27c1d9836a79e35052c599ea12a5fb7bd0a2b71461f30219c",
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
