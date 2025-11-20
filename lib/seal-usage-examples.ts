/**
 * Seal Integration Usage Examples
 *
 * These examples show how to integrate Seal encryption into the existing
 * task creation and submission workflows.
 */

import {
  encryptFileForWalrus,
  decryptWalrusData,
  createSessionKey,
  generateSealId,
  getSealPackageId,
  isEncryptionEnabled,
  envelopeEncrypt,
  envelopeDecrypt,
} from "./seal";
import { uploadToWalrus } from "./walrus";
import { SuiClient } from "@mysten/sui/client";

// ============================================================================
// EXAMPLE 1: Task Creation with Encryption
// ============================================================================

export async function createTaskWithEncryption(
  datasetFile: File,
  taskId: string,
  suiClient: SuiClient
) {
  // Check if encryption is enabled
  if (!isEncryptionEnabled()) {
    // Upload without encryption (current behavior)
    const uploadResult = await uploadToWalrus(datasetFile);
    return {
      datasetUrl: uploadResult.url,
      encrypted: false,
    };
  }

  try {
    // Generate unique ID for this encryption
    const sealId = generateSealId("task", taskId);
    const packageId = getSealPackageId();

    // Encrypt the dataset
    console.log("Encrypting dataset with Seal...");
    const encryptedBlob = await encryptFileForWalrus(
      datasetFile,
      packageId,
      sealId,
      suiClient
    );

    // Upload encrypted data to Walrus
    const uploadResult = await uploadToWalrus(
      new File([encryptedBlob], "encrypted_dataset.enc", {
        type: "application/octet-stream",
      }),
      { epochs: 5 }
    );

    console.log("Dataset encrypted and uploaded:", uploadResult.url);

    return {
      datasetUrl: uploadResult.url,
      encrypted: true,
      sealId,
      packageId,
    };
  } catch (error) {
    console.error("Encryption failed:", error);
    throw error;
  }
}

// ============================================================================
// EXAMPLE 2: Large File Encryption (Envelope Method)
// ============================================================================

export async function createTaskWithEnvelopeEncryption(
  largeFile: File, // >1MB
  taskId: string,
  suiClient: SuiClient
) {
  if (!isEncryptionEnabled()) {
    const uploadResult = await uploadToWalrus(largeFile);
    return { datasetUrl: uploadResult.url, encrypted: false };
  }

  try {
    const sealId = generateSealId("task", taskId);
    const packageId = getSealPackageId();

    // Encrypt using envelope method (faster for large files)
    console.log("Encrypting large file with envelope method...");
    const { encryptedData, encryptedKey } = await envelopeEncrypt(
      largeFile,
      packageId,
      sealId,
      suiClient
    );

    // Upload encrypted data to Walrus
    const dataUpload = await uploadToWalrus(
      new File([encryptedData as any], "data.enc"),
      { epochs: 5 }
    );

    // Upload encrypted key to Walrus (small file, ~100 bytes)
    const keyUpload = await uploadToWalrus(
      new File([encryptedKey as any], "key.enc"),
      { epochs: 5 }
    );

    return {
      datasetUrl: dataUpload.url,
      keyUrl: keyUpload.url, // Store this in contract metadata
      encrypted: true,
      envelopeEncryption: true,
      sealId,
      packageId,
    };
  } catch (error) {
    console.error("Envelope encryption failed:", error);
    throw error;
  }
}

// ============================================================================
// EXAMPLE 3: Dataset Decryption (Task Detail Page)
// ============================================================================

export async function downloadAndDecryptDataset(
  datasetUrl: string,
  taskId: string,
  userAddress: string,
  suiClient: SuiClient,
  signPersonalMessage: (message: Uint8Array) => Promise<{ signature: string }>
) {
  // Check if encryption is enabled
  if (!isEncryptionEnabled()) {
    // Download without decryption (current behavior)
    const response = await fetch(datasetUrl);
    return await response.blob();
  }

  try {
    const sealId = generateSealId("task", taskId);
    const packageId = getSealPackageId();

    // Step 1: Create session key (user signs once)
    console.log("Creating session key...");
    const sessionKey = await createSessionKey(
      userAddress,
      packageId,
      suiClient,
      10 // 10 minutes TTL
    );

    // Step 2: Get message and have user sign it
    const message = sessionKey.getPersonalMessage();
    const { signature } = await signPersonalMessage(message);
    sessionKey.setPersonalMessageSignature(signature);

    // Step 3: Download encrypted data from Walrus
    console.log("Downloading encrypted dataset...");
    const response = await fetch(datasetUrl);
    const encryptedData = new Uint8Array(await response.arrayBuffer());

    // Step 4: Decrypt the data
    console.log("Decrypting dataset...");
    const decryptedBlob = await decryptWalrusData(
      encryptedData,
      sessionKey,
      packageId,
      sealId,
      suiClient
    );

    console.log("Dataset decrypted successfully");
    return decryptedBlob;
  } catch (error) {
    console.error("Decryption failed:", error);
    throw error;
  }
}

// ============================================================================
// EXAMPLE 4: Submission Encryption
// ============================================================================

export async function submitEncryptedLabels(
  resultFile: File,
  submissionId: string,
  taskId: string,
  suiClient: SuiClient
) {
  if (!isEncryptionEnabled()) {
    const uploadResult = await uploadToWalrus(resultFile);
    return {
      resultUrl: uploadResult.url,
      encrypted: false,
    };
  }

  try {
    // Use submission ID for encryption
    const sealId = generateSealId("submission", submissionId);
    const packageId = getSealPackageId();

    // Encrypt the result file
    console.log("Encrypting submission results...");
    const encryptedBlob = await encryptFileForWalrus(
      resultFile,
      packageId,
      sealId,
      suiClient
    );

    // Upload to Walrus
    const uploadResult = await uploadToWalrus(
      new File([encryptedBlob], "encrypted_results.enc", {
        type: "application/octet-stream",
      }),
      { epochs: 5 }
    );

    return {
      resultUrl: uploadResult.url,
      encrypted: true,
      sealId,
      packageId,
    };
  } catch (error) {
    console.error("Submission encryption failed:", error);
    throw error;
  }
}

// ============================================================================
// EXAMPLE 5: Submission Decryption (Requester View)
// ============================================================================

export async function decryptSubmission(
  resultUrl: string,
  submissionId: string,
  userAddress: string,
  suiClient: SuiClient,
  signPersonalMessage: (message: Uint8Array) => Promise<{ signature: string }>
) {
  if (!isEncryptionEnabled()) {
    const response = await fetch(resultUrl);
    return await response.blob();
  }

  try {
    const sealId = generateSealId("submission", submissionId);
    const packageId = getSealPackageId();

    // Create session key
    const sessionKey = await createSessionKey(
      userAddress,
      packageId,
      suiClient,
      10
    );

    const message = sessionKey.getPersonalMessage();
    const { signature } = await signPersonalMessage(message);
    sessionKey.setPersonalMessageSignature(signature);

    // Download and decrypt
    const response = await fetch(resultUrl);
    const encryptedData = new Uint8Array(await response.arrayBuffer());

    const decryptedBlob = await decryptWalrusData(
      encryptedData,
      sessionKey,
      packageId,
      sealId,
      suiClient
    );

    return decryptedBlob;
  } catch (error) {
    console.error("Submission decryption failed:", error);
    throw error;
  }
}

// ============================================================================
// EXAMPLE 6: React Hook for Session Key Management
// ============================================================================

import { useState, useCallback } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import type { SessionKey } from "@mysten/seal";

export function useSealSessionKey(suiClient: SuiClient) {
  const account = useCurrentAccount();
  const [sessionKey, setSessionKey] = useState<SessionKey | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const createSession = useCallback(
    async (
      signMessage: (message: Uint8Array) => Promise<{ signature: string }>
    ) => {
      if (!account || !isEncryptionEnabled()) return null;

      setIsCreating(true);
      try {
        const packageId = getSealPackageId();
        const key = await createSessionKey(
          account.address,
          packageId,
          suiClient,
          10
        );

        const message = key.getPersonalMessage();
        const { signature } = await signMessage(message);
        key.setPersonalMessageSignature(signature);

        setSessionKey(key);
        return key;
      } catch (error) {
        console.error("Failed to create session key:", error);
        throw error;
      } finally {
        setIsCreating(false);
      }
    },
    [account, suiClient]
  );

  return { sessionKey, createSession, isCreating };
}

// ============================================================================
// EXAMPLE 7: Check if Data is Encrypted (by URL or metadata)
// ============================================================================

export function isDataEncrypted(url: string, metadata?: any): boolean {
  // Check if encryption is enabled
  if (!isEncryptionEnabled()) return false;

  // Check URL pattern
  if (url.includes("encrypted") || url.endsWith(".enc")) return true;

  // Check metadata
  if (metadata?.encrypted === true) return true;

  return false;
}
