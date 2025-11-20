"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Loader2,
  Upload,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
} from "@mysten/dapp-kit";
import { useQueryClient } from "@tanstack/react-query";
import { uploadToWalrus } from "@/lib/walrus";
import { createTaskTransaction, PACKAGE_ID } from "@/lib/contracts/songsim";
import { TASK_REGISTRY_ID, PLATFORM_CONFIG_ID } from "@/lib/contracts/songsim";
import { Transaction } from "@mysten/sui/transactions";
import { useUserProfile } from "@/hooks/use-user-profile";

type TaskType =
  | "image-classification"
  | "text-annotation"
  | "audio-transcription"
  | "video-labeling";

interface LabelOption {
  id: string;
  label: string;
}

interface TaskData {
  // Step 1: Dataset Upload
  datasetFiles: File[];
  datasetDescription: string;
  walrusStorageId?: string;

  // Step 2: Task Configuration
  taskType: TaskType;
  title: string;
  description: string;
  instructions: string;
  labelOptions: LabelOption[];

  // Step 3: Bounty Settings
  rewardPerTask: string;
  totalBudget: string;
  deadline: string;
  minQualityScore: string;
  requiredLabelers: string;
}

export default function CreateTaskPage() {
  const router = useRouter();
  const account = useCurrentAccount();
  const { data: profile } = useUserProfile();
  const queryClient = useQueryClient();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();

  const [currentStep, setCurrentStep] = useState(1);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isCreating, setIsCreating] = useState(false);

  const [taskData, setTaskData] = useState<TaskData>({
    datasetFiles: [],
    datasetDescription: "",
    taskType: "image-classification",
    title: "",
    description: "",
    instructions: "",
    labelOptions: [
      { id: "1", label: "" },
      { id: "2", label: "" },
    ],
    rewardPerTask: "",
    totalBudget: "",
    deadline: "",
    minQualityScore: "85",
    requiredLabelers: "3",
  });

  // Check wallet connection
  if (!account) {
    return (
      <div className="container max-w-4xl py-8">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">
              Please connect your wallet to create a task
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setTaskData({ ...taskData, datasetFiles: Array.from(files) });
  };

  const addLabelOption = () => {
    const newId = (taskData.labelOptions.length + 1).toString();
    setTaskData({
      ...taskData,
      labelOptions: [...taskData.labelOptions, { id: newId, label: "" }],
    });
  };

  const removeLabelOption = (id: string) => {
    if (taskData.labelOptions.length <= 2) return; // Keep at least 2 options
    setTaskData({
      ...taskData,
      labelOptions: taskData.labelOptions.filter((opt) => opt.id !== id),
    });
  };

  const updateLabelOption = (id: string, label: string) => {
    setTaskData({
      ...taskData,
      labelOptions: taskData.labelOptions.map((opt) =>
        opt.id === id ? { ...opt, label } : opt
      ),
    });
  };

  const handleSubmit = async () => {
    if (!account?.address) {
      toast.error("Wallet not connected", {
        description: "Please connect your wallet to create a task",
      });
      return;
    }

    if (!profile?.objectId) {
      toast.error("Profile not found", {
        description: "Please create a profile first",
      });
      return;
    }

    // Validation
    if (!taskData.title || !taskData.description || !taskData.instructions) {
      toast.error("Missing information", {
        description: "Please fill in all required fields",
      });
      return;
    }

    if (
      !taskData.rewardPerTask ||
      !taskData.totalBudget ||
      !taskData.deadline
    ) {
      toast.error("Missing bounty settings", {
        description: "Please fill in all bounty settings",
      });
      return;
    }

    if (taskData.datasetFiles.length === 0) {
      toast.error("No dataset files", {
        description: "Please select dataset files to upload",
      });
      return;
    }

    setIsCreating(true);
    setUploadProgress(0);

    try {
      // Step 1: Upload dataset to Walrus
      setUploadProgress(10);
      const file = taskData.datasetFiles[0];

      const uploadResult = await uploadToWalrus(file, {
        epochs: 5,
        onProgress: (progress) => {
          setUploadProgress(10 + progress * 0.4); // 10-50%
        },
      });

      const datasetUrl = uploadResult.url;
      const filename = file.name;
      const contentType = file.type || "application/octet-stream";

      setUploadProgress(50);

      // Step 2: Prepare transaction
      setUploadProgress(60);

      // Convert SUI to MIST (1 SUI = 1,000,000,000 MIST)
      const bountyInMist = Math.floor(
        parseFloat(taskData.totalBudget) * 1_000_000_000
      );

      // Convert deadline to Unix timestamp in milliseconds
      const deadlineTimestamp = new Date(taskData.deadline).getTime();

      setUploadProgress(70);

      // Create a coin split transaction for the bounty
      const tx = new Transaction();

      // Split coin for bounty
      const [bountyCoin] = tx.splitCoins(tx.gas, [bountyInMist]);

      // Use the actual profile object ID from the user's profile
      const profileObjectId = profile.objectId;

      // Add the create task call
      tx.moveCall({
        target: `${PACKAGE_ID}::songsim::create_task`,
        arguments: [
          tx.object(TASK_REGISTRY_ID || ""),
          tx.object(PLATFORM_CONFIG_ID || ""),
          tx.object(profileObjectId),
          tx.pure.vector(
            "u8",
            Array.from(new TextEncoder().encode(datasetUrl))
          ),
          tx.pure.vector("u8", Array.from(new TextEncoder().encode(filename))),
          tx.pure.vector(
            "u8",
            Array.from(new TextEncoder().encode(contentType))
          ),
          tx.pure.vector(
            "u8",
            Array.from(new TextEncoder().encode(taskData.title))
          ),
          tx.pure.vector(
            "u8",
            Array.from(new TextEncoder().encode(taskData.description))
          ),
          tx.pure.vector(
            "u8",
            Array.from(new TextEncoder().encode(taskData.instructions))
          ),
          tx.pure.u64(parseInt(taskData.requiredLabelers)),
          tx.pure.u64(deadlineTimestamp),
          bountyCoin,
        ],
      });

      // Sign and execute transaction
      signAndExecute(
        {
          transaction: tx,
        },
        {
          onSuccess: async (result) => {
            console.log("Task created successfully:", result);
            setUploadProgress(100);

            toast.success("Task created!", {
              description: "Your task has been published on the blockchain",
            });

            // Wait a bit for blockchain to finalize before invalidating cache
            await new Promise((resolve) => setTimeout(resolve, 2000));

            // Invalidate queries to refresh task list
            await queryClient.invalidateQueries({ queryKey: ["allTasks"] });
            await queryClient.invalidateQueries({ queryKey: ["myTasks"] });

            // Redirect to dashboard
            setTimeout(() => {
              router.push("/dashboard/tasks");
            }, 500);
          },
          onError: (error) => {
            console.error("Transaction error:", error);
            toast.error("Transaction failed", {
              description:
                error.message || "Failed to create task on blockchain",
            });
            setIsCreating(false);
            setUploadProgress(0);
          },
        }
      );
    } catch (error) {
      console.error("Error creating task:", error);
      toast.error("Error", {
        description:
          error instanceof Error ? error.message : "Failed to create task",
      });
      setIsCreating(false);
      setUploadProgress(0);
    }
  };

  const renderStep1 = () => (
    <Card>
      <CardHeader>
        <CardTitle>Upload Dataset</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="dataset">Dataset Files *</Label>
          <div className="mt-2 border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors">
            <input
              id="dataset"
              type="file"
              multiple
              onChange={(e) => handleFileUpload(e.target.files)}
              className="hidden"
            />
            <label htmlFor="dataset" className="cursor-pointer">
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm font-medium">Click to upload files</p>
              <p className="text-xs text-muted-foreground mt-1">
                or drag and drop your dataset
              </p>
            </label>
          </div>
          {taskData.datasetFiles.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium">Selected files:</p>
              {taskData.datasetFiles.map((file, index) => (
                <div
                  key={index}
                  className="text-sm text-muted-foreground flex items-center gap-2"
                >
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <Label htmlFor="description">Dataset Description *</Label>
          <Textarea
            id="description"
            placeholder="Describe your dataset..."
            value={taskData.datasetDescription}
            onChange={(e) =>
              setTaskData({ ...taskData, datasetDescription: e.target.value })
            }
            rows={4}
          />
        </div>

        <div className="flex justify-end">
          <Button
            onClick={() => setCurrentStep(2)}
            disabled={
              taskData.datasetFiles.length === 0 || !taskData.datasetDescription
            }
          >
            Next <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderStep2 = () => (
    <Card>
      <CardHeader>
        <CardTitle>Task Configuration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="title">Task Title *</Label>
          <Input
            id="title"
            placeholder="e.g., Label cats and dogs in images"
            value={taskData.title}
            onChange={(e) =>
              setTaskData({ ...taskData, title: e.target.value })
            }
          />
        </div>

        <div>
          <Label htmlFor="task-description">Description *</Label>
          <Textarea
            id="task-description"
            placeholder="Describe what labelers need to do..."
            value={taskData.description}
            onChange={(e) =>
              setTaskData({ ...taskData, description: e.target.value })
            }
            rows={4}
          />
        </div>

        <div>
          <Label htmlFor="instructions">Instructions *</Label>
          <Textarea
            id="instructions"
            placeholder="Detailed instructions for labelers..."
            value={taskData.instructions}
            onChange={(e) =>
              setTaskData({ ...taskData, instructions: e.target.value })
            }
            rows={6}
          />
        </div>

        <div className="flex justify-between gap-3">
          <Button variant="outline" onClick={() => setCurrentStep(1)}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <Button
            onClick={() => setCurrentStep(3)}
            disabled={
              !taskData.title || !taskData.description || !taskData.instructions
            }
          >
            Next <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderStep3 = () => (
    <Card>
      <CardHeader>
        <CardTitle>Bounty Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="reward">Reward per Item (SUI) *</Label>
            <Input
              id="reward"
              type="number"
              step="0.01"
              placeholder="0.1"
              value={taskData.rewardPerTask}
              onChange={(e) =>
                setTaskData({ ...taskData, rewardPerTask: e.target.value })
              }
            />
          </div>
          <div>
            <Label htmlFor="budget">Total Budget (SUI) *</Label>
            <Input
              id="budget"
              type="number"
              step="0.1"
              placeholder="10.0"
              value={taskData.totalBudget}
              onChange={(e) =>
                setTaskData({ ...taskData, totalBudget: e.target.value })
              }
            />
          </div>
        </div>

        <div>
          <Label htmlFor="deadline">Deadline *</Label>
          <Input
            id="deadline"
            type="date"
            value={taskData.deadline}
            onChange={(e) =>
              setTaskData({ ...taskData, deadline: e.target.value })
            }
            min={new Date().toISOString().split("T")[0]}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="quality">Minimum Quality Score (%)</Label>
            <Input
              id="quality"
              type="number"
              min="0"
              max="100"
              value={taskData.minQualityScore}
              onChange={(e) =>
                setTaskData({ ...taskData, minQualityScore: e.target.value })
              }
            />
          </div>
          <div>
            <Label htmlFor="labelers">Required Labelers *</Label>
            <Input
              id="labelers"
              type="number"
              min="1"
              value={taskData.requiredLabelers}
              onChange={(e) =>
                setTaskData({ ...taskData, requiredLabelers: e.target.value })
              }
            />
          </div>
        </div>

        <div className="flex justify-between gap-3">
          <Button variant="outline" onClick={() => setCurrentStep(2)}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <Button
            onClick={() => setCurrentStep(4)}
            disabled={
              !taskData.rewardPerTask ||
              !taskData.totalBudget ||
              !taskData.deadline
            }
          >
            Review <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderStep4 = () => (
    <Card>
      <CardHeader>
        <CardTitle>Review & Create</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Dataset</h3>
            <p className="text-sm text-muted-foreground">
              {taskData.datasetFiles.length} file(s) ready to upload
            </p>
            {taskData.datasetFiles.length > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {taskData.datasetFiles[0].name} (
                {(taskData.datasetFiles[0].size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {taskData.datasetDescription}
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Task Details</h3>
            <p className="text-sm">
              <strong>Title:</strong> {taskData.title}
            </p>
            <p className="text-sm">
              <strong>Description:</strong> {taskData.description}
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Bounty</h3>
            <p className="text-sm">
              <strong>Total Budget:</strong> {taskData.totalBudget} SUI
            </p>
            <p className="text-sm">
              <strong>Per Item:</strong> {taskData.rewardPerTask} SUI
            </p>
            <p className="text-sm">
              <strong>Required Labelers:</strong> {taskData.requiredLabelers}
            </p>
            <p className="text-sm">
              <strong>Deadline:</strong>{" "}
              {new Date(taskData.deadline).toLocaleDateString()}
            </p>
          </div>
        </div>

        {isCreating && uploadProgress > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>
                {uploadProgress < 50
                  ? "Uploading dataset to Walrus..."
                  : uploadProgress < 70
                  ? "Preparing transaction..."
                  : "Creating task on blockchain..."}
              </span>
              <span>{Math.round(uploadProgress)}%</span>
            </div>
            <Progress value={uploadProgress} />
          </div>
        )}

        <div className="flex justify-between gap-3">
          <Button variant="outline" onClick={() => setCurrentStep(3)}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <Button onClick={handleSubmit} disabled={isCreating}>
            {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Task on Blockchain
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Create New Task</h1>
        <p className="text-muted-foreground">
          Upload your dataset and configure labeling requirements
        </p>
      </div>

      {/* Progress Indicator */}
      <div className="flex items-center justify-between">
        {[1, 2, 3, 4].map((step) => (
          <div key={step} className="flex items-center">
            <div
              className={`h-10 w-10 rounded-full flex items-center justify-center font-semibold ${
                currentStep >= step
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {step}
            </div>
            {step < 4 && (
              <div
                className={`h-1 w-16 mx-2 ${
                  currentStep > step ? "bg-primary" : "bg-muted"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step Labels */}
      <div className="flex justify-between text-xs text-muted-foreground -mt-4">
        <span className="w-24 text-center">Dataset</span>
        <span className="w-24 text-center">Configure</span>
        <span className="w-24 text-center">Bounty</span>
        <span className="w-24 text-center">Review</span>
      </div>

      {/* Step Content */}
      {currentStep === 1 && renderStep1()}
      {currentStep === 2 && renderStep2()}
      {currentStep === 3 && renderStep3()}
      {currentStep === 4 && renderStep4()}
    </div>
  );
}
