/**
 * Seal Protocol Integration for End-to-End Encryption
 * Documentation: https://seal-docs.wal.app/
 */

import { SealClient, SessionKey, EncryptedObject } from "@mysten/seal";
import { SuiClient } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";

// Seal configuration for testnet
const SEAL_PACKAGE_ID =
  "0x927a54e9ae803f82ebf480136a9bcff45101ccbe28b13f433c89f5181069d682"; // Testnet

// Verified key servers for testnet (Open mode)
const TESTNET_KEY_SERVERS = [
  "0x73d05d62c18d9374e3ea529e8e0ed6161da1a141a94d3f76ae3fe4e99356db75",
  "0xf5d14a81a982144ae441cd7d64b09027f116a468bd36e7eca494f750591623c8",
];

export interface SealEncryptionResult {
  encryptedData: Uint8Array;
  encryptedObject: any; // EncryptedObject instance
  backupKey?: Uint8Array;
}

export interface SealDecryptionOptions {
  encryptedData: Uint8Array;
  sessionKey: SessionKey;
  packageId: string;
  id: string;
}

/**
 * Create a Seal client instance for encryption/decryption operations
 */
export function createSealClient(suiClient: SuiClient): SealClient {
  return new SealClient({
    suiClient,
    serverConfigs: TESTNET_KEY_SERVERS.map((id) => ({
      objectId: id,
      weight: 1,
    })),
    verifyKeyServers: false, // Set to true for production to verify server URLs
  });
}

/**
 * Encrypt data using Seal protocol
 * @param data - Data to encrypt (File, Blob, or Uint8Array)
 * @param packageId - Your access policy package ID
 * @param id - Unique identifier for this encryption (e.g., task ID, user ID)
 * @param suiClient - Sui client instance
 * @param threshold - Number of key servers required for decryption (default: 2)
 * @returns Encrypted data and metadata
 */
export async function encryptWithSeal(
  data: File | Blob | Uint8Array,
  packageId: string,
  id: string,
  suiClient: SuiClient,
  threshold: number = 2
): Promise<SealEncryptionResult> {
  try {
    // Convert data to Uint8Array if needed
    let dataBytes: Uint8Array;
    if (data instanceof File || data instanceof Blob) {
      const arrayBuffer = await data.arrayBuffer();
      dataBytes = new Uint8Array(arrayBuffer);
    } else {
      dataBytes = data;
    }

    // Create Seal client
    const client = createSealClient(suiClient);

    // Encrypt the data
    // Seal SDK expects packageId and id as hex strings without 0x prefix
    const cleanPackageId = packageId.startsWith("0x")
      ? packageId.slice(2)
      : packageId;
    const cleanId = id.startsWith("0x") ? id.slice(2) : id;

    const { encryptedObject: encryptedBytes, key: backupKey } =
      await client.encrypt({
        threshold,
        packageId: cleanPackageId,
        id: cleanId,
        data: dataBytes,
      });

    // Parse the encrypted object for metadata
    const encryptedObject = EncryptedObject.parse(encryptedBytes);

    console.log("Seal encryption successful:", {
      id: encryptedObject.id,
      threshold: encryptedObject.threshold,
      size: encryptedBytes.length,
    });

    return {
      encryptedData: encryptedBytes,
      encryptedObject,
      backupKey,
    };
  } catch (error) {
    console.error("Seal encryption failed:", error);
    throw new Error(
      `Failed to encrypt data with Seal: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Create a session key for decryption
 * @param userAddress - User's Sui address
 * @param packageId - Access policy package ID
 * @param suiClient - Sui client instance
 * @param ttlMin - Time-to-live in minutes (default: 10)
 * @returns Initialized session key (requires signature)
 */
export async function createSessionKey(
  userAddress: string,
  packageId: string,
  suiClient: SuiClient,
  ttlMin: number = 10
): Promise<SessionKey> {
  // Seal SDK expects packageId as hex string without 0x prefix
  const cleanPackageId = packageId.startsWith("0x")
    ? packageId.slice(2)
    : packageId;

  const sessionKey = await SessionKey.create({
    address: userAddress,
    packageId: cleanPackageId,
    ttlMin,
    suiClient,
  });

  return sessionKey;
}

/**
 * Decrypt data using Seal protocol
 * @param options - Decryption options
 * @param suiClient - Sui client instance
 * @returns Decrypted data
 */
export async function decryptWithSeal(
  options: SealDecryptionOptions,
  suiClient: SuiClient
): Promise<Uint8Array> {
  try {
    const { encryptedData, sessionKey, packageId, id } = options;

    // Create Seal client
    const client = createSealClient(suiClient);

    // Create a transaction that calls the seal_approve function
    // This transaction checks if the user has access to decrypt
    const cleanId = id.startsWith("0x") ? id.slice(2) : id;

    const tx = new Transaction();
    tx.moveCall({
      target: `${packageId}::access_policy::seal_approve`,
      arguments: [
        tx.pure.vector("u8", Array.from(Buffer.from(cleanId, "hex"))),
      ],
    });

    // Build transaction bytes
    const txBytes = await tx.build({
      client: suiClient,
      onlyTransactionKind: true,
    });

    // Decrypt the data
    const decryptedBytes = await client.decrypt({
      data: encryptedData,
      sessionKey,
      txBytes,
    });

    console.log("Seal decryption successful:", {
      size: decryptedBytes.length,
    });

    return decryptedBytes;
  } catch (error) {
    console.error("Seal decryption failed:", error);
    throw new Error(
      `Failed to decrypt data with Seal: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Encrypt a file before uploading to Walrus
 * @param file - File to encrypt
 * @param packageId - Access policy package ID
 * @param id - Unique identifier
 * @param suiClient - Sui client instance
 * @returns Encrypted file as Blob
 */
export async function encryptFileForWalrus(
  file: File,
  packageId: string,
  id: string,
  suiClient: SuiClient
): Promise<Blob> {
  const { encryptedData } = await encryptWithSeal(
    file,
    packageId,
    id,
    suiClient
  );

  return new Blob([encryptedData as any], {
    type: "application/octet-stream",
  });
}

/**
 * Decrypt data downloaded from Walrus
 * @param encryptedData - Encrypted data from Walrus
 * @param sessionKey - Initialized session key
 * @param packageId - Access policy package ID
 * @param id - Unique identifier
 * @param suiClient - Sui client instance
 * @returns Decrypted data as Blob
 */
export async function decryptWalrusData(
  encryptedData: Uint8Array,
  sessionKey: SessionKey,
  packageId: string,
  id: string,
  suiClient: SuiClient
): Promise<Blob> {
  const decryptedBytes = await decryptWithSeal(
    {
      encryptedData,
      sessionKey,
      packageId,
      id,
    },
    suiClient
  );

  return new Blob([decryptedBytes as any]);
}

/**
 * Generate a unique ID for Seal encryption
 * Can be based on task ID, submission ID, or other unique identifier
 * @param prefix - Prefix for the ID (e.g., "task", "submission")
 * @param identifier - Unique identifier (e.g., task ID, user address)
 * @returns Hex string ID
 */
export function generateSealId(prefix: string, identifier: string): string {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${prefix}:${identifier}`);

  // Convert to hex string
  return Array.from(data)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Check if encryption is enabled
 * Returns true if PACKAGE_ID environment variable is set
 */
export function isEncryptionEnabled(): boolean {
  return !!process.env.NEXT_PUBLIC_SEAL_PACKAGE_ID;
}

/**
 * Get the Seal package ID from environment
 */
export function getSealPackageId(): string {
  const packageId = process.env.NEXT_PUBLIC_SEAL_PACKAGE_ID;
  if (!packageId) {
    throw new Error(
      "NEXT_PUBLIC_SEAL_PACKAGE_ID not configured. Please deploy an access policy contract."
    );
  }
  return packageId;
}

/**
 * Envelope encryption: Encrypt large files by encrypting a symmetric key with Seal
 * This is more efficient for large files (>1MB)
 * @param file - File to encrypt
 * @param packageId - Access policy package ID
 * @param id - Unique identifier
 * @param suiClient - Sui client instance
 * @returns Encrypted data and encrypted key
 */
export async function envelopeEncrypt(
  file: File,
  packageId: string,
  id: string,
  suiClient: SuiClient
): Promise<{
  encryptedData: Uint8Array;
  encryptedKey: Uint8Array;
}> {
  // Generate a random symmetric key (32 bytes for AES-256)
  const symmetricKey = crypto.getRandomValues(new Uint8Array(32));

  // Encrypt the file with the symmetric key using Web Crypto API
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 12 bytes for GCM
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    symmetricKey,
    { name: "AES-GCM" },
    false,
    ["encrypt"]
  );

  const fileData = await file.arrayBuffer();
  const encryptedFileData = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    cryptoKey,
    fileData
  );

  // Combine IV and encrypted data
  const encryptedDataWithIv = new Uint8Array(
    iv.length + encryptedFileData.byteLength
  );
  encryptedDataWithIv.set(iv, 0);
  encryptedDataWithIv.set(new Uint8Array(encryptedFileData), iv.length);

  // Encrypt the symmetric key with Seal
  const { encryptedData: encryptedKey } = await encryptWithSeal(
    symmetricKey,
    packageId,
    id,
    suiClient
  );

  return {
    encryptedData: encryptedDataWithIv,
    encryptedKey,
  };
}

/**
 * Envelope decryption: Decrypt large files by decrypting the symmetric key with Seal
 * @param encryptedData - Encrypted file data (with IV prepended)
 * @param encryptedKey - Seal-encrypted symmetric key
 * @param sessionKey - Initialized session key
 * @param packageId - Access policy package ID
 * @param id - Unique identifier
 * @param suiClient - Sui client instance
 * @returns Decrypted file data
 */
export async function envelopeDecrypt(
  encryptedData: Uint8Array,
  encryptedKey: Uint8Array,
  sessionKey: SessionKey,
  packageId: string,
  id: string,
  suiClient: SuiClient
): Promise<Uint8Array> {
  // Decrypt the symmetric key with Seal
  const symmetricKey = await decryptWithSeal(
    {
      encryptedData: encryptedKey,
      sessionKey,
      packageId,
      id,
    },
    suiClient
  );

  // Extract IV and encrypted data
  const iv = encryptedData.slice(0, 12);
  const encryptedFileData = encryptedData.slice(12);

  // Decrypt the file with the symmetric key
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    symmetricKey as any,
    { name: "AES-GCM" },
    false,
    ["decrypt"]
  );

  const decryptedData = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    cryptoKey,
    encryptedFileData
  );

  return new Uint8Array(decryptedData);
}
