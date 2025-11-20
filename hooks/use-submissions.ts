/**
 * React Query hooks for submission management
 */

import { useQuery } from "@tanstack/react-query";
import { useSuiClient, useCurrentAccount } from "@mysten/dapp-kit";
import { TASK_REGISTRY_ID, decodeVectorU8 } from "@/lib/contracts/songsim";

export interface ProcessedSubmission {
  submissionId: string;
  objectId: string; // Sui object ID as unique identifier
  taskId: string; // Numeric task ID from contract
  labeler: string;
  resultUrl: string;
  resultFilename: string;
  resultContentType: string;
  status: string;
  submittedAt: string;
}

/**
 * Process raw submission data from blockchain
 */
function processSubmissionData(submission: any): ProcessedSubmission {
  // Decode Move String (vector<u8>) fields
  const resultUrl = decodeVectorU8(submission.result_url);
  const resultFilename = decodeVectorU8(submission.result_filename);
  const resultContentType = decodeVectorU8(submission.result_content_type);

  return {
    submissionId: submission.submission_id?.toString() || "0",
    objectId: submission.object_id || "", // Use object ID as unique identifier
    taskId: submission.task_id?.toString() || "0", // Numeric task ID
    labeler: submission.labeler,
    resultUrl,
    resultFilename,
    resultContentType,
    status:
      typeof submission.status === "number"
        ? submission.status.toString()
        : submission.status,
    submittedAt: submission.submitted_at,
  };
}

/**
 * Hook to fetch all submissions from the registry
 */
export function useAllSubmissions() {
  const client = useSuiClient();

  return useQuery({
    queryKey: ["allSubmissions"],
    queryFn: async () => {
      if (!TASK_REGISTRY_ID) {
        return [];
      }

      try {
        // Fetch the TaskRegistry object
        const registryObject = await client.getObject({
          id: TASK_REGISTRY_ID,
          options: { showContent: true },
        });

        if (
          registryObject.data?.content &&
          "fields" in registryObject.data.content
        ) {
          const fields = registryObject.data.content.fields as any;

          // Get submissions table
          const submissionsTableId = fields.submissions?.fields?.id?.id;

          if (!submissionsTableId) {
            return [];
          }

          // Fetch all submissions from the table
          const submissionsTable = await client.getDynamicFields({
            parentId: submissionsTableId,
          });

          const submissions = await Promise.all(
            submissionsTable.data.map(async (field) => {
              try {
                // The field.name.value is the ACTUAL submission_id from registry
                const registrySubmissionId = field.name.value as string;
                
                // Get the dynamic field object which contains the submission address
                const dynamicFieldObject = await client.getDynamicFieldObject({
                  parentId: submissionsTableId,
                  name: {
                    type: "u64",
                    value: registrySubmissionId,
                  },
                });

                if (
                  dynamicFieldObject.data?.content &&
                  "fields" in dynamicFieldObject.data.content
                ) {
                  const fieldContent = dynamicFieldObject.data.content
                    .fields as any;
                  const submissionObjectId = fieldContent.value as string;

                  // Fetch the actual Submission object
                  const submissionObject = await client.getObject({
                    id: submissionObjectId,
                    options: { showContent: true },
                  });

                  if (
                    submissionObject.data?.content &&
                    "fields" in submissionObject.data.content
                  ) {
                    const submissionFields = submissionObject.data.content.fields as any;
                    
                    // Extract bytes from Move String fields
                    const extractStringBytes = (field: any) => field?.bytes || [];
                    
                    return {
                      // CRITICAL: Use registry key as submission_id, not the Submission object's field
                      // The Submission object has submission_id: 0 due to contract bug
                      submission_id: registrySubmissionId,
                      object_id: submissionObjectId, // Store the Sui object ID
                      task_id: submissionFields.task_id,
                      labeler: submissionFields.labeler,
                      result_url: extractStringBytes(submissionFields.result_url),
                      result_filename: extractStringBytes(submissionFields.result_filename),
                      result_content_type: extractStringBytes(submissionFields.result_content_type),
                      status: submissionFields.status,
                      submitted_at: submissionFields.submitted_at,
                    };
                  }
                }
                return null;
              } catch (error) {
                console.error(
                  `Error fetching submission ${field.name.value}:`,
                  error
                );
                return null;
              }
            })
          );

          return submissions
            .filter((s) => s !== null)
            .map(processSubmissionData);
        }

        return [];
      } catch (error) {
        console.error("Error fetching submissions:", error);
        return [];
      }
    },
    enabled: !!TASK_REGISTRY_ID,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  });
}

/**
 * Hook to fetch submissions for a specific task
 */
export function useTaskSubmissions(taskId: string | null) {
  const { data: allSubmissions, ...rest } = useAllSubmissions();

  return {
    ...rest,
    data:
      allSubmissions?.filter(
        (submission) => submission.taskId === taskId
      ) || [],
  };
}

/**
 * Hook to fetch submissions by current user
 */
export function useMySubmissions() {
  const account = useCurrentAccount();
  const { data: allSubmissions, ...rest } = useAllSubmissions();

  return {
    ...rest,
    data: account?.address
      ? allSubmissions?.filter(
          (submission) =>
            submission.labeler?.toLowerCase() === account.address.toLowerCase()
        ) || []
      : [],
  };
}

/**
 * Hook to fetch submissions by status
 */
export function useSubmissionsByStatus(status: string) {
  const { data: allSubmissions, ...rest } = useAllSubmissions();

  return {
    ...rest,
    data:
      allSubmissions?.filter((submission) => submission.status === status) ||
      [],
  };
}
