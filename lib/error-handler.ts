/**
 * Error handling utilities
 */

import { toast } from "sonner";
import { getErrorMessage } from "./error-messages";

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = "AppError";
  }
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    delayMs?: number;
    onRetry?: (attempt: number) => void;
  } = {}
): Promise<T> {
  const { maxRetries = 3, delayMs = 1000, onRetry } = options;

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt < maxRetries) {
        onRetry?.(attempt);
        await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
      }
    }
  }

  throw lastError;
}

export function handleError(error: unknown, context?: string): void {
  console.error(`Error in ${context || "unknown context"}:`, error);

  const errorInfo = getErrorMessage(error);

  toast.error(errorInfo.title, {
    description: errorInfo.description,
    action: errorInfo.action
      ? {
          label: errorInfo.action,
          onClick: () => {
            // Handle action click (e.g., retry, navigate)
          },
        }
      : undefined,
  });
}

export function handleTransactionError(error: unknown): void {
  handleError(error, "Transaction");
}

export function handleUploadError(error: unknown): void {
  handleError(error, "Upload");
}
