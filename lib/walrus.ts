/**
 * Walrus Storage Integration
 * Documentation: https://docs.walrus.site
 */

import axios from "axios";

// Working Walrus testnet endpoints - Updated January 2025
// Publisher: Tudor's endpoint with confirmed CORS support
// Aggregator: Multiple fallback options
const WALRUS_PUBLISHER_URL =
  process.env.NEXT_PUBLIC_WALRUS_PUBLISHER_URL ||
  "https://publisher.walrus-01.tududes.com";
const WALRUS_AGGREGATOR_URL =
  process.env.NEXT_PUBLIC_WALRUS_AGGREGATOR_URL ||
  "https://aggregator.walrus-testnet.walrus.space";

// Backup endpoints in case primary fails
const BACKUP_AGGREGATOR_URL = "https://wal-aggregator-testnet.staketab.org";

export interface WalrusUploadResponse {
  blobId: string;
  url: string; // Full Walrus aggregator URL
  endEpoch: number;
  cost: number;
}

export interface WalrusUploadOptions {
  epochs?: number; // Number of epochs to store the blob (default: 5)
  onProgress?: (progress: number) => void;
}

interface WalrusApiResponse {
  newlyCreated?: {
    blobObject: {
      id: string;
      blobId: string;
      storage: {
        endEpoch: number;
      };
    };
    cost?: number;
  };
  alreadyCertified?: {
    blobId: string;
    endEpoch: number;
  };
}

export interface WalrusBlob {
  blobId: string;
  walrusUrl: string;
  originalUrl?: string;
}

/**
 * Upload a file to Walrus storage
 * @param file - File to upload
 * @param options - Upload options
 * @returns Blob ID and metadata
 */
export async function uploadToWalrus(
  file: File,
  options: WalrusUploadOptions = {}
): Promise<WalrusUploadResponse> {
  const { epochs = 5 } = options;

  try {
    // Convert file to raw binary data
    const fileData = await file.arrayBuffer();

    // Construct upload URL
    const uploadUrl = `${WALRUS_PUBLISHER_URL}/v1/blobs?epochs=${epochs}`;

    const response = await axios.put<WalrusApiResponse>(uploadUrl, fileData, {
      headers: {
        "Content-Type": "application/octet-stream",
      },
      timeout: 60000, // 60 seconds
    });

    // Extract blob ID from response
    const blobId =
      response.data.newlyCreated?.blobObject.blobId ||
      response.data.alreadyCertified?.blobId;

    if (!blobId) {
      throw new Error("Failed to get blob ID from Walrus response");
    }

    // Remove 0x prefix if present
    const cleanBlobId = blobId.startsWith("0x") ? blobId.slice(2) : blobId;

    return {
      blobId: cleanBlobId,
      url: getWalrusReadUrl(cleanBlobId),
      endEpoch:
        response.data.newlyCreated?.blobObject.storage.endEpoch ||
        response.data.alreadyCertified?.endEpoch ||
        0,
      cost: response.data.newlyCreated?.cost || 0,
    };
  } catch (error) {
    console.error("Walrus upload failed:", error);
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 413) {
        throw new Error(
          "File too large for Walrus publisher (HTTP 413). Max ~5 MB. Please compress or choose a smaller file."
        );
      }
      if (error.code === "NETWORK_ERROR" || error.message === "Network Error") {
        throw new Error(
          "Network error: Unable to connect to Walrus. Please check your internet connection and try again."
        );
      }
      if (error.code === "ECONNABORTED" || error.message.includes("timeout")) {
        throw new Error(
          "Upload timeout: The file is too large or the connection is slow. Please try again."
        );
      }
      if (error.response?.status === 403) {
        throw new Error(
          "Access denied: CORS or authentication error. Please contact support."
        );
      }
      if (error.response?.status === 404) {
        throw new Error(
          "Service unavailable: Walrus endpoint not found. The service may be temporarily down."
        );
      }
      if (error.response && error.response.status >= 500) {
        throw new Error(
          "Server error: Walrus service is experiencing issues. Please try again later."
        );
      }

      const message = error.response?.data?.message || error.message;
      throw new Error(`Failed to upload to Walrus: ${message}`);
    }
    throw new Error(
      `Failed to upload to Walrus: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Upload multiple files to Walrus storage
 * @param files - Array of files to upload
 * @param options - Upload options
 * @returns Array of blob IDs
 */
export async function uploadMultipleToWalrus(
  files: File[],
  options: WalrusUploadOptions = {}
): Promise<WalrusUploadResponse[]> {
  const { onProgress } = options;
  const results: WalrusUploadResponse[] = [];

  for (let i = 0; i < files.length; i++) {
    const result = await uploadToWalrus(files[i], {
      ...options,
      onProgress: onProgress
        ? (progress) => {
            const totalProgress = ((i + progress / 100) / files.length) * 100;
            onProgress(totalProgress);
          }
        : undefined,
    });
    results.push(result);
  }

  return results;
}

/**
 * Get the URL to read a blob from Walrus
 * @param blobId - The blob ID to read
 * @returns URL to access the blob
 */
export function getWalrusReadUrl(blobId: string): string {
  // Remove '0x' prefix if present
  const cleanBlobId = blobId.startsWith("0x") ? blobId.slice(2) : blobId;
  return `${WALRUS_AGGREGATOR_URL}/v1/blobs/${cleanBlobId}`;
}

/**
 * Convert blob ID to hex string for contract storage
 * @param blobId - The blob ID from Walrus
 * @returns Blob ID as is (Walrus returns base64-like IDs)
 */
export function blobIdToHex(blobId: string): string {
  // Store the blob ID as-is from Walrus
  // Don't add 0x prefix - it's not a hex value
  return blobId;
}

/**
 * Convert hex string to blob ID for reading
 * @param hex - Hex string from contract (or raw blob ID)
 * @returns Blob ID for Walrus aggregator
 */
export function hexToBlobId(hex: string): string {
  // Remove '0x' prefix if present
  return hex.startsWith("0x") ? hex.slice(2) : hex;
}

/**
 * Check if a blob exists in Walrus storage
 * @param blobId - The blob ID to check
 * @returns true if blob exists, false otherwise
 */
export async function checkBlobExists(blobId: string): Promise<boolean> {
  try {
    const response = await axios.head(getWalrusReadUrl(blobId), {
      timeout: 5000,
    });
    return response.status === 200;
  } catch (error) {
    console.error("Error checking blob existence:", error);
    return false;
  }
}

/**
 * Check if a blob is available (certified) for reading with retry
 */
export async function checkBlobAvailability(
  blobId: string,
  maxRetries: number = 3,
  delayMs: number = 2000
): Promise<boolean> {
  const aggregatorUrls = [WALRUS_AGGREGATOR_URL, BACKUP_AGGREGATOR_URL];

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    // Try both aggregator endpoints
    for (const aggregatorUrl of aggregatorUrls) {
      try {
        const response = await axios.head(
          `${aggregatorUrl}/v1/blobs/${blobId}`,
          {
            timeout: 5000,
          }
        );
        if (response.status === 200) {
          return true;
        }
      } catch (error) {
        // Continue to next aggregator or retry
        console.warn(
          `Failed to check blob availability on ${aggregatorUrl}:`,
          error
        );
      }
    }

    if (attempt < maxRetries - 1) {
      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  return false;
}

/**
 * Wait for blob to become available with progress callback
 */
export async function waitForBlobCertification(
  blobId: string,
  onProgress?: (message: string) => void,
  maxWaitTimeMs: number = 30000
): Promise<boolean> {
  const startTime = Date.now();
  let attempt = 0;

  while (Date.now() - startTime < maxWaitTimeMs) {
    attempt++;

    if (onProgress) {
      onProgress(`Checking blob certification (attempt ${attempt})...`);
    }

    const isAvailable = await checkBlobAvailability(blobId, 1);
    if (isAvailable) {
      if (onProgress) {
        onProgress("Blob is now certified and available!");
      }
      return true;
    }

    // Wait 3 seconds before next check
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }

  if (onProgress) {
    onProgress(
      "Blob certification is taking longer than expected. The blob should become available soon."
    );
  }
  return false;
}

/**
 * Upload JSON metadata to Walrus
 * @param metadata The metadata object to upload
 * @param userAddress The user's Sui address to own the resulting blob object
 */
export async function uploadMetadata(
  metadata: Record<string, any>,
  userAddress?: string
): Promise<WalrusBlob> {
  const jsonData = JSON.stringify(metadata, null, 2);
  const encoder = new TextEncoder();
  const binaryData = encoder.encode(jsonData);

  try {
    // Construct URL with send_object_to parameter if userAddress is provided
    let uploadUrl = `${WALRUS_PUBLISHER_URL}/v1/blobs?epochs=5`;
    if (userAddress) {
      uploadUrl += `&send_object_to=${userAddress}`;
    }

    const response = await axios.put<WalrusApiResponse>(uploadUrl, binaryData, {
      headers: {
        "Content-Type": "application/octet-stream",
      },
      timeout: 60000,
    });

    const blobId =
      response.data.newlyCreated?.blobObject.blobId ||
      response.data.alreadyCertified?.blobId;

    if (!blobId) {
      throw new Error("Failed to get blob ID from Walrus response");
    }

    const cleanBlobId = blobId.startsWith("0x") ? blobId.slice(2) : blobId;

    return {
      blobId: cleanBlobId,
      walrusUrl: getWalrusReadUrl(cleanBlobId),
    };
  } catch (error) {
    console.error("Walrus metadata upload failed:", error);
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message || error.message;
      throw new Error(`Failed to upload metadata to Walrus: ${message}`);
    }
    throw new Error("Failed to upload metadata to Walrus");
  }
}

/**
 * Check if a URL is already a Walrus URL
 */
export function isWalrusUrl(url: string): boolean {
  return url.includes(WALRUS_AGGREGATOR_URL) || url.includes("walrus");
}

/**
 * Validate and provide guidance for URL uploads
 * Returns an object with validation result and suggestions
 */
export function validateUrlForUpload(url: string): {
  isValid: boolean;
  message: string;
  suggestions: string[];
} {
  try {
    const parsedUrl = new URL(url);

    // Check if it's already a Walrus URL
    if (isWalrusUrl(url)) {
      return {
        isValid: false,
        message: "This URL is already stored on Walrus",
        suggestions: ["Use this URL directly without re-uploading to Walrus"],
      };
    }

    // Check for common image CDNs that typically support CORS
    const corsKnownDomains = [
      "imgur.com",
      "i.imgur.com",
      "github.com",
      "githubusercontent.com",
      "unsplash.com",
      "images.unsplash.com",
      "pexels.com",
      "images.pexels.com",
      "wikimedia.org",
      "upload.wikimedia.org",
    ];

    const domain = parsedUrl.hostname.toLowerCase();
    const supportsCors = corsKnownDomains.some((knownDomain) =>
      domain.includes(knownDomain)
    );

    if (supportsCors) {
      return {
        isValid: true,
        message: "This URL should work for Walrus upload",
        suggestions: [],
      };
    }

    // Check for common domains that typically block CORS
    const blockedDomains = [
      "instagram.com",
      "facebook.com",
      "twitter.com",
      "x.com",
      "tiktok.com",
      "linkedin.com",
      "pinterest.com",
    ];

    const isBlocked = blockedDomains.some((blockedDomain) =>
      domain.includes(blockedDomain)
    );

    if (isBlocked) {
      return {
        isValid: false,
        message: "This domain typically blocks cross-origin requests",
        suggestions: [
          'Right-click the image and "Save image as..." to download it',
          "Then upload the downloaded file directly",
          "Or use the URL directly without Walrus storage",
        ],
      };
    }

    // For unknown domains, provide general guidance
    return {
      isValid: true,
      message: "URL upload may work but could fail due to CORS restrictions",
      suggestions: [
        "If upload fails, try downloading the image and uploading as a file",
        "Or use the URL directly without Walrus storage",
      ],
    };
  } catch (error) {
    return {
      isValid: false,
      message: "Invalid URL format",
      suggestions: [
        "Please enter a valid URL starting with http:// or https://",
      ],
    };
  }
}

/**
 * Check if the Walrus service is available
 */
export async function checkServiceHealth(): Promise<boolean> {
  try {
    await axios.head(WALRUS_PUBLISHER_URL, { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Estimate storage cost for a file
 * @param fileSizeBytes - Size of the file in bytes
 * @param epochs - Number of epochs to store
 * @returns Estimated cost in SUI (approximate)
 */
export function estimateStorageCost(
  fileSizeBytes: number,
  epochs: number = 5
): number {
  // Approximate cost calculation (update based on actual Walrus pricing)
  // This is a rough estimate and should be updated with real pricing
  const costPerMBPerEpoch = 0.001; // 0.001 SUI per MB per epoch
  const fileSizeMB = fileSizeBytes / (1024 * 1024);
  return fileSizeMB * costPerMBPerEpoch * epochs;
}

/**
 * Helper function to download file from Walrus with proper filename
 */
export const downloadFromWalrus = async (
  url: string,
  defaultFilename: string = "download.file"
) => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = defaultFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    console.error("Download failed:", error);
    // Fallback to opening in new tab if download fails
    window.open(url, "_blank");
  }
};
