/**
 * React Query hooks for task management
 */

import { useQuery } from "@tanstack/react-query";
import { useSuiClient, useCurrentAccount } from "@mysten/dapp-kit";
import {
  getAllTasks,
  TASK_REGISTRY_ID,
  decodeVectorU8,
} from "@/lib/contracts/songsim";

export interface ProcessedTask {
  objectId: string;
  taskId: string;
  requester: string;
  title: string;
  description: string;
  instructions: string;
  datasetUrl: string;
  datasetFilename: string;
  datasetContentType: string;
  deadline: string;
  bounty: string;
  requiredLabelers: string;
  currentLabelers: string;
  status: string;
  createdAt: string;
}

/**
 * Process raw task data from blockchain
 */
function processTaskData(task: any): ProcessedTask {
  // Sui RPC already decodes Move String types to JavaScript strings
  const title = task.title || "";
  const description = task.description || "";
  const instructions = task.instructions || "";
  const datasetUrl = task.dataset_url || "";
  const datasetFilename = task.dataset_filename || "dataset.csv";
  const datasetContentType = task.dataset_content_type || "application/octet-stream";

  return {
    objectId: task.objectId,
    taskId: task.task_id ? task.task_id.toString() : task.taskId,
    requester: task.requester,
    title,
    description,
    instructions,
    datasetUrl,
    datasetFilename,
    datasetContentType,
    deadline: task.deadline,
    bounty: task.bounty_amount || task.bounty,
    requiredLabelers: task.required_labelers,
    currentLabelers: task.submission_count || task.current_labelers || "0",
    status:
      typeof task.status === "number" ? task.status.toString() : task.status,
    createdAt: task.created_at,
  };
}

/**
 * Hook to fetch all tasks
 */
export function useAllTasks() {
  const client = useSuiClient();

  return useQuery({
    queryKey: ["allTasks"],
    queryFn: async () => {
      if (!TASK_REGISTRY_ID) {
        return [];
      }

      const tasks = await getAllTasks(client, TASK_REGISTRY_ID);
      return tasks.map(processTaskData);
    },
    enabled: !!TASK_REGISTRY_ID,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  });
}

/**
 * Hook to fetch tasks created by current user
 */
export function useMyTasks() {
  const client = useSuiClient();
  const account = useCurrentAccount();

  return useQuery({
    queryKey: ["myTasks", account?.address],
    queryFn: async () => {
      if (!account || !TASK_REGISTRY_ID) {
        return [];
      }

      // Since tasks are now shared objects, we get all tasks and filter by requester
      const allTasks = await getAllTasks(client, TASK_REGISTRY_ID);
      const processedTasks = allTasks.map(processTaskData);

      // Filter tasks created by current user
      return processedTasks.filter(
        (task) => task.requester.toLowerCase() === account.address.toLowerCase()
      );
    },
    enabled: !!account && !!TASK_REGISTRY_ID,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
}
/**
 * Hook to fetch available tasks (for labelers)
 */
export function useAvailableTasks() {
  const client = useSuiClient();
  const account = useCurrentAccount();

  return useQuery({
    queryKey: ["availableTasks", account?.address],
    queryFn: async () => {
      if (!TASK_REGISTRY_ID || !account) {
        return [];
      }

      const tasks = await getAllTasks(client, TASK_REGISTRY_ID);
      const processedTasks = tasks.map(processTaskData);

      // Filter active tasks not created by current user
      return processedTasks.filter(
        (task) =>
          task.status === "0" && // Active status
          task.requester.toLowerCase() !== account.address.toLowerCase() &&
          parseInt(task.currentLabelers) < parseInt(task.requiredLabelers)
      );
    },
    enabled: !!TASK_REGISTRY_ID && !!account,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
}

/**
 * Hook to fetch a single task by object ID
 */
export function useTask(taskObjectId: string | null) {
  const client = useSuiClient();

  return useQuery({
    queryKey: ["task", taskObjectId],
    queryFn: async () => {
      if (!TASK_REGISTRY_ID || !taskObjectId) {
        return null;
      }

      const tasks = await getAllTasks(client, TASK_REGISTRY_ID);
      const task = tasks.find((t) => t.objectId === taskObjectId);

      return task ? processTaskData(task) : null;
    },
    enabled: !!TASK_REGISTRY_ID && !!taskObjectId,
    staleTime: 30 * 1000,
  });
}

/**
 * Hook to fetch task by task ID (numeric)
 */
export function useTaskByTaskId(taskId: string | null) {
  const client = useSuiClient();

  return useQuery({
    queryKey: ["taskByTaskId", taskId],
    queryFn: async () => {
      if (!TASK_REGISTRY_ID || !taskId) {
        return null;
      }

      const tasks = await getAllTasks(client, TASK_REGISTRY_ID);
      const task = tasks.find((t) => t.taskId === taskId);

      return task ? processTaskData(task) : null;
    },
    enabled: !!TASK_REGISTRY_ID && !!taskId,
    staleTime: 30 * 1000,
  });
}
