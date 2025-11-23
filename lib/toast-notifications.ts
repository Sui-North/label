/**
 * Centralized toast notification utilities
 * Provides consistent toast messages across the platform
 */

import { toast } from "sonner";

// Task-related toasts
export const taskToasts = {
  createStart: () =>
    toast.loading("Creating task...", {
      description: "Uploading to blockchain",
    }),
  createSuccess: (taskId: string) =>
    toast.success("Task created successfully!", {
      description: `Task #${taskId} is now live`,
      duration: 5000,
    }),
  createError: (error: string) =>
    toast.error("Failed to create task", {
      description: error,
      duration: 7000,
    }),
  cancelStart: () =>
    toast.loading("Cancelling task...", {
      description: "Processing refund",
    }),
  cancelSuccess: () =>
    toast.success("Task cancelled", {
      description: "Bounty has been refunded",
    }),
  cancelError: (error: string) =>
    toast.error("Failed to cancel task", {
      description: error,
    }),
  extendStart: () =>
    toast.loading("Extending deadline...", {
      description: "Updating task on blockchain",
    }),
  extendSuccess: (newDeadline: string) =>
    toast.success("Deadline extended!", {
      description: `New deadline: ${newDeadline}`,
    }),
  extendError: (error: string) =>
    toast.error("Failed to extend deadline", {
      description: error,
    }),
  fetchError: (error: string) =>
    toast.error("Failed to load tasks", {
      description: error,
    }),
};

// Submission-related toasts
export const submissionToasts = {
  submitStart: () =>
    toast.loading("Submitting work...", {
      description: "Uploading to Walrus storage",
    }),
  submitSuccess: (taskTitle: string) =>
    toast.success("Submission successful!", {
      description: `Your work for "${taskTitle}" has been submitted`,
      duration: 5000,
    }),
  submitError: (error: string) =>
    toast.error("Submission failed", {
      description: error,
      duration: 7000,
    }),
  deadlinePassed: () =>
    toast.error("Submission deadline passed", {
      description:
        "Submissions close 24 hours before task deadline for review. Please find another task.",
      duration: 10000,
    }),
  duplicateSubmission: () =>
    toast.warning("Already submitted", {
      description: "You've already submitted work for this task",
    }),
  fetchError: (error: string) =>
    toast.error("Failed to load submissions", {
      description: error,
    }),
};

// Profile-related toasts
export const profileToasts = {
  createStart: () =>
    toast.loading("Creating profile...", {
      description: "Setting up your account",
    }),
  createSuccess: () =>
    toast.success("Profile created!", {
      description: "Welcome to Songsim Label",
      duration: 5000,
    }),
  createError: (error: string) =>
    toast.error("Failed to create profile", {
      description: error,
    }),
  updateStart: () =>
    toast.loading("Updating profile...", {
      description: "Saving changes",
    }),
  updateSuccess: () =>
    toast.success("Profile updated!", {
      description: "Your changes have been saved",
    }),
  updateError: (error: string) =>
    toast.error("Failed to update profile", {
      description: error,
    }),
  fetchError: (error: string) =>
    toast.error("Failed to load profile", {
      description: error,
    }),
  notFound: () =>
    toast.info("No profile found", {
      description: "Please create a profile to continue",
    }),
};

// Wallet-related toasts
export const walletToasts = {
  connecting: () =>
    toast.loading("Connecting wallet...", {
      description: "Please approve in your wallet",
    }),
  connected: (address: string) =>
    toast.success("Wallet connected!", {
      description: `${address.slice(0, 6)}...${address.slice(-4)}`,
    }),
  disconnected: () =>
    toast.info("Wallet disconnected", {
      description: "You've been signed out",
    }),
  connectionError: (error: string) =>
    toast.error("Connection failed", {
      description: error,
    }),
  insufficientBalance: () =>
    toast.error("Insufficient balance", {
      description: "You don't have enough SUI for this transaction",
    }),
  transactionStart: () =>
    toast.loading("Processing transaction...", {
      description: "Please approve in your wallet",
    }),
  transactionSuccess: (txDigest: string) =>
    toast.success("Transaction successful!", {
      description: `Digest: ${txDigest.slice(0, 8)}...${txDigest.slice(-6)}`,
      duration: 5000,
    }),
  transactionError: (error: string) =>
    toast.error("Transaction failed", {
      description: error,
      duration: 7000,
    }),
};

// Consensus-related toasts
export const consensusToasts = {
  finalizeStart: () =>
    toast.loading("Finalizing consensus...", {
      description: "Processing submissions",
    }),
  finalizeSuccess: (acceptedCount: number, totalCount: number) =>
    toast.success("Consensus finalized!", {
      description: `${acceptedCount}/${totalCount} submissions accepted`,
      duration: 5000,
    }),
  finalizeError: (error: string) =>
    toast.error("Failed to finalize consensus", {
      description: error,
    }),
  thresholdNotMet: () =>
    toast.warning("Consensus threshold not met", {
      description: "More submissions needed for consensus",
    }),
};

// Staking-related toasts
export const stakingToasts = {
  stakeStart: () =>
    toast.loading("Staking tokens...", {
      description: "Locking your SUI",
    }),
  stakeSuccess: (amount: string) =>
    toast.success("Stake successful!", {
      description: `${amount} SUI staked`,
    }),
  stakeError: (error: string) =>
    toast.error("Failed to stake", {
      description: error,
    }),
  unstakeStart: () =>
    toast.loading("Unstaking tokens...", {
      description: "Withdrawing your SUI",
    }),
  unstakeSuccess: (amount: string) =>
    toast.success("Unstake successful!", {
      description: `${amount} SUI withdrawn`,
    }),
  unstakeError: (error: string) =>
    toast.error("Failed to unstake", {
      description: error,
    }),
  stakeLocked: (unlockDate: string) =>
    toast.warning("Stake is locked", {
      description: `Unlocks on ${unlockDate}`,
    }),
};

// Quality control toasts
export const qualityToasts = {
  reviewStart: () =>
    toast.loading("Submitting review...", {
      description: "Processing quality check",
    }),
  reviewSuccess: () =>
    toast.success("Review submitted!", {
      description: "Thank you for your feedback",
    }),
  reviewError: (error: string) =>
    toast.error("Failed to submit review", {
      description: error,
    }),
};

// Upload-related toasts
export const uploadToasts = {
  uploadStart: (filename: string) =>
    toast.loading("Uploading file...", {
      description: filename,
    }),
  uploadProgress: (progress: number) =>
    toast.loading("Uploading...", {
      description: `${progress}% complete`,
    }),
  uploadSuccess: (filename: string) =>
    toast.success("Upload successful!", {
      description: filename,
    }),
  uploadError: (error: string) =>
    toast.error("Upload failed", {
      description: error,
    }),
  fileTooLarge: (maxSize: string) =>
    toast.error("File too large", {
      description: `Maximum size is ${maxSize}`,
    }),
  invalidFileType: (allowedTypes: string) =>
    toast.error("Invalid file type", {
      description: `Allowed types: ${allowedTypes}`,
    }),
};

// General system toasts
export const systemToasts = {
  configError: () =>
    toast.error("Configuration error", {
      description: "Platform is not properly configured",
    }),
  unauthorized: () =>
    toast.error("Unauthorized", {
      description: "You don't have permission to perform this action",
    }),
  networkError: () =>
    toast.error("Network error", {
      description: "Please check your connection and try again",
    }),
  success: (message: string) => toast.success(message),
  error: (message: string) => toast.error(message),
  info: (message: string) => toast.info(message),
  warning: (message: string) => toast.warning(message),
};
