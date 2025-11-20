/**
 * User-friendly error messages for common errors
 */

export const ERROR_MESSAGES = {
  // Wallet errors
  WALLET_NOT_CONNECTED: {
    title: "Wallet Not Connected",
    description: "Please connect your wallet to continue",
    action: "Connect Wallet",
  },
  WALLET_INSUFFICIENT_FUNDS: {
    title: "Insufficient Funds",
    description: "You don't have enough SUI to complete this transaction",
    action: "Add Funds",
  },

  // Upload errors
  FILE_TOO_LARGE: {
    title: "File Too Large",
    description: "Please choose a file smaller than 5MB",
    action: "Choose Smaller File",
  },
  UPLOAD_NETWORK_ERROR: {
    title: "Network Error",
    description:
      "Unable to connect to Walrus storage. Check your internet connection.",
    action: "Retry Upload",
  },
  UPLOAD_CORS_ERROR: {
    title: "Upload Blocked",
    description:
      "This URL blocks cross-origin requests. Download the file first, then upload.",
    action: "Download & Upload",
  },

  // Transaction errors
  TRANSACTION_REJECTED: {
    title: "Transaction Rejected",
    description: "You cancelled the transaction",
    action: "Try Again",
  },
  TRANSACTION_FAILED: {
    title: "Transaction Failed",
    description:
      "The blockchain transaction failed. This may be due to insufficient gas or invalid parameters.",
    action: "Check Details",
  },
  GAS_BUDGET_EXCEEDED: {
    title: "Insufficient Gas",
    description: "You don't have enough SUI to pay for gas fees",
    action: "Add Funds",
  },

  // Contract errors
  TASK_ALREADY_COMPLETED: {
    title: "Task Already Completed",
    description: "This task has already been finalized",
    action: "View Results",
  },
  SUBMISSION_ALREADY_EXISTS: {
    title: "Already Submitted",
    description: "You have already submitted work for this task",
    action: "View Submission",
  },
  INSUFFICIENT_STAKE: {
    title: "Insufficient Stake",
    description: "You need to stake more SUI to participate in this task",
    action: "Stake SUI",
  },

  // Generic errors
  UNKNOWN_ERROR: {
    title: "Something Went Wrong",
    description: "An unexpected error occurred. Please try again.",
    action: "Retry",
  },
};

export function getErrorMessage(error: unknown): {
  title: string;
  description: string;
  action?: string;
} {
  // Network errors
  if (error instanceof Error) {
    if (
      error.message.includes("Network Error") ||
      error.message.includes("ECONNABORTED")
    ) {
      return ERROR_MESSAGES.UPLOAD_NETWORK_ERROR;
    }
    if (error.message.includes("413")) {
      return ERROR_MESSAGES.FILE_TOO_LARGE;
    }
    if (error.message.includes("CORS") || error.message.includes("403")) {
      return ERROR_MESSAGES.UPLOAD_CORS_ERROR;
    }
    if (error.message.includes("User rejected")) {
      return ERROR_MESSAGES.TRANSACTION_REJECTED;
    }
    if (
      error.message.includes("insufficient funds") ||
      error.message.includes("gas")
    ) {
      return ERROR_MESSAGES.GAS_BUDGET_EXCEEDED;
    }
    if (error.message.includes("already submitted")) {
      return ERROR_MESSAGES.SUBMISSION_ALREADY_EXISTS;
    }
    if (
      error.message.includes("already completed") ||
      error.message.includes("finalized")
    ) {
      return ERROR_MESSAGES.TASK_ALREADY_COMPLETED;
    }
  }

  return ERROR_MESSAGES.UNKNOWN_ERROR;
}
