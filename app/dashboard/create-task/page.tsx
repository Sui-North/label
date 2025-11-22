"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
  Briefcase,
  FileText,
  DollarSign,
  Calendar,
  Users,
  AlertCircle,
  Image as ImageIcon,
  Type,
  Mic,
  Video,
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

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
      <div className="container max-w-4xl py-12 flex items-center justify-center min-h-[60vh]">
        <Card className="glass-card w-full max-w-md text-center p-8">
          <CardContent className="pt-6">
            <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Briefcase className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Connect Wallet</h2>
            <p className="text-muted-foreground mb-6">
              Please connect your wallet to create a task on the platform.
            </p>
            {/* Wallet connect button is in navbar, so we just guide them */}
            <div className="p-4 bg-muted/30 rounded-lg border border-dashed">
              <p className="text-sm">
                Use the Connect Button in the top right corner
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setTaskData({ ...taskData, datasetFiles: Array.from(files) });
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

    // Validate deadline is at least 25 hours from now (24h buffer + 1h margin)
    const deadlineTimestamp = new Date(
      taskData.deadline + "T23:59:59"
    ).getTime();
    const minDeadline = Date.now() + 25 * 60 * 60 * 1000; // 25 hours from now
    if (deadlineTimestamp < minDeadline) {
      toast.error("Invalid deadline", {
        description:
          "Deadline must be at least 25 hours from now. Contract requires 24h review buffer.",
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
          tx.object("0x6"), // Clock object required by contract
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
    <Card className="glass-card animate-in fade-in slide-in-from-right-4 duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Upload className="h-5 w-5 text-primary" />
          </div>
          Upload Dataset
        </CardTitle>
        <CardDescription>
          Upload the files you want labeled. We support images, text, audio, and
          video.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="dataset" className="text-base font-medium">
            Dataset Files <span className="text-destructive">*</span>
          </Label>
          <div className="mt-3 border-2 border-dashed border-primary/20 rounded-xl p-6 md:p-10 text-center hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer group relative overflow-hidden">
            <input
              id="dataset"
              type="file"
              multiple
              onChange={(e) => handleFileUpload(e.target.files)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className="relative z-0">
              <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <Upload className="h-8 w-8 text-primary" />
              </div>
              <p className="text-lg font-medium group-hover:text-primary transition-colors">
                Click to upload files
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                or drag and drop your dataset here
              </p>
            </div>
          </div>
          {taskData.datasetFiles.length > 0 && (
            <div className="mt-4 space-y-2 bg-muted/30 p-4 rounded-lg border">
              <p className="text-sm font-medium flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Selected files ({taskData.datasetFiles.length})
              </p>
              <div className="max-h-32 overflow-y-auto space-y-1 pr-2 custom-scrollbar">
                {taskData.datasetFiles.map((file, index) => (
                  <div
                    key={index}
                    className="text-sm text-muted-foreground flex items-center justify-between bg-background/50 p-2 rounded border"
                  >
                    <span className="truncate max-w-[80%]">{file.name}</span>
                    <span className="text-xs font-mono">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          <Label htmlFor="description" className="text-base font-medium">
            Dataset Description <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="description"
            placeholder="Describe your dataset (e.g., 'A collection of 500 street view images for object detection')..."
            value={taskData.datasetDescription}
            onChange={(e) =>
              setTaskData({ ...taskData, datasetDescription: e.target.value })
            }
            rows={4}
            className="mt-2 resize-none focus-visible:ring-primary"
          />
        </div>

        <div className="flex justify-end pt-4">
          <Button
            onClick={() => setCurrentStep(2)}
            disabled={
              taskData.datasetFiles.length === 0 || !taskData.datasetDescription
            }
            className="shadow-lg shadow-primary/20"
          >
            Next Step <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderStep2 = () => (
    <Card className="glass-card animate-in fade-in slide-in-from-right-4 duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          Task Configuration
        </CardTitle>
        <CardDescription>
          Define what labelers need to do with your data.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="title">
              Task Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              placeholder="e.g., Label cats and dogs in images"
              value={taskData.title}
              onChange={(e) =>
                setTaskData({ ...taskData, title: e.target.value })
              }
              className="focus-visible:ring-primary"
            />
          </div>

          <div className="space-y-2">
            <Label>Task Type</Label>
            <div className="grid grid-cols-2 gap-2">
              <div
                className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center gap-2 ${
                  taskData.taskType === "image-classification"
                    ? "border-primary bg-primary/10 text-primary"
                    : "hover:bg-muted/50"
                }`}
                onClick={() =>
                  setTaskData({ ...taskData, taskType: "image-classification" })
                }
              >
                <ImageIcon className="h-4 w-4" />
                <span className="text-sm font-medium">Image</span>
              </div>
              <div
                className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center gap-2 ${
                  taskData.taskType === "text-annotation"
                    ? "border-primary bg-primary/10 text-primary"
                    : "hover:bg-muted/50"
                }`}
                onClick={() =>
                  setTaskData({ ...taskData, taskType: "text-annotation" })
                }
              >
                <Type className="h-4 w-4" />
                <span className="text-sm font-medium">Text</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="task-description">
            Short Description <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="task-description"
            placeholder="Briefly describe the task goal..."
            value={taskData.description}
            onChange={(e) =>
              setTaskData({ ...taskData, description: e.target.value })
            }
            rows={2}
            className="resize-none focus-visible:ring-primary"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="instructions">
            Detailed Instructions <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="instructions"
            placeholder="Provide detailed step-by-step instructions for labelers. Be specific about edge cases."
            value={taskData.instructions}
            onChange={(e) =>
              setTaskData({ ...taskData, instructions: e.target.value })
            }
            rows={6}
            className="resize-none focus-visible:ring-primary font-mono text-sm"
          />
        </div>

        <div className="flex justify-between gap-3 pt-4">
          <Button variant="outline" onClick={() => setCurrentStep(1)}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <Button
            onClick={() => setCurrentStep(3)}
            disabled={
              !taskData.title || !taskData.description || !taskData.instructions
            }
            className="shadow-lg shadow-primary/20"
          >
            Next Step <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderStep3 = () => (
    <Card className="glass-card animate-in fade-in slide-in-from-right-4 duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <DollarSign className="h-5 w-5 text-primary" />
          </div>
          Bounty & Settings
        </CardTitle>
        <CardDescription>
          Set the rewards and requirements for your task.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="reward" className="flex items-center gap-2">
                Reward per Item (SUI){" "}
                <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="reward"
                  type="number"
                  step="0.01"
                  placeholder="0.1"
                  value={taskData.rewardPerTask}
                  onChange={(e) =>
                    setTaskData({ ...taskData, rewardPerTask: e.target.value })
                  }
                  className="pl-9 focus-visible:ring-primary"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Amount paid to each labeler per task item.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="budget" className="flex items-center gap-2">
                Total Budget (SUI) <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="budget"
                  type="number"
                  step="0.1"
                  placeholder="10.0"
                  value={taskData.totalBudget}
                  onChange={(e) =>
                    setTaskData({ ...taskData, totalBudget: e.target.value })
                  }
                  className="pl-9 focus-visible:ring-primary"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Total SUI to lock in the contract for this task.
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="deadline">
                Deadline <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="deadline"
                  type="date"
                  value={taskData.deadline}
                  onChange={(e) =>
                    setTaskData({ ...taskData, deadline: e.target.value })
                  }
                  className="pl-9 focus-visible:ring-primary"
                />
              </div>
              <Alert variant="default" className="mt-2 py-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Submissions close 24h before deadline for review. Set at least
                  25h from now.
                </AlertDescription>
              </Alert>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quality">Min Quality (%)</Label>
                <Input
                  id="quality"
                  type="number"
                  min="0"
                  max="100"
                  value={taskData.minQualityScore}
                  onChange={(e) =>
                    setTaskData({
                      ...taskData,
                      minQualityScore: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="labelers">Labelers/Item</Label>
                <Input
                  id="labelers"
                  type="number"
                  min="1"
                  value={taskData.requiredLabelers}
                  onChange={(e) =>
                    setTaskData({
                      ...taskData,
                      requiredLabelers: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between gap-3 pt-4 border-t">
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
            className="shadow-lg shadow-primary/20"
          >
            Review Task <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderStep4 = () => (
    <Card className="glass-card animate-in fade-in slide-in-from-right-4 duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <CheckCircle className="h-5 w-5 text-primary" />
          </div>
          Review & Create
        </CardTitle>
        <CardDescription>
          Review your task details before publishing to the blockchain.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="bg-muted/30 p-4 rounded-xl border">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Upload className="h-4 w-4 text-primary" /> Dataset
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Files:</span>
                  <span className="font-medium">
                    {taskData.datasetFiles.length} file(s)
                  </span>
                </div>
                {taskData.datasetFiles.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">First file:</span>
                    <span className="font-medium truncate max-w-[150px]">
                      {taskData.datasetFiles[0].name}
                    </span>
                  </div>
                )}
                <div className="pt-2 border-t mt-2">
                  <span className="text-muted-foreground block mb-1">
                    Description:
                  </span>
                  <p className="text-xs italic opacity-80">
                    {taskData.datasetDescription}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-muted/30 p-4 rounded-xl border">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" /> Task Details
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Title:</span>
                  <span className="font-medium">{taskData.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type:</span>
                  <Badge variant="outline" className="capitalize">
                    {taskData.taskType.replace("-", " ")}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-muted/30 p-4 rounded-xl border">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" /> Bounty
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Budget:</span>
                  <span className="font-bold text-primary">
                    {taskData.totalBudget} SUI
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Per Item:</span>
                  <span className="font-medium">
                    {taskData.rewardPerTask} SUI
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Required Labelers:
                  </span>
                  <span className="font-medium">
                    {taskData.requiredLabelers}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Deadline:</span>
                  <span className="font-medium">
                    {new Date(taskData.deadline).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {isCreating && uploadProgress > 0 && (
          <div className="space-y-3 bg-primary/5 p-4 rounded-xl border border-primary/10">
            <div className="flex justify-between text-sm font-medium">
              <span className="text-primary">
                {uploadProgress < 50
                  ? "Uploading dataset to Walrus..."
                  : uploadProgress < 70
                  ? "Preparing transaction..."
                  : "Creating task on blockchain..."}
              </span>
              <span>{Math.round(uploadProgress)}%</span>
            </div>
            <Progress value={uploadProgress} className="h-2" />
          </div>
        )}

        <div className="flex justify-between gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => setCurrentStep(3)}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isCreating}
            className="shadow-lg shadow-primary/20 min-w-[200px]"
          >
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Create Task on Blockchain
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Create New Task
          </h1>
          <p className="text-muted-foreground mt-1">
            Upload your dataset and configure labeling requirements
          </p>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="relative">
        <div className="absolute top-1/2 left-0 w-full h-1 bg-muted -translate-y-1/2 rounded-full z-0" />
        <div
          className="absolute top-1/2 left-0 h-1 bg-primary -translate-y-1/2 rounded-full z-0 transition-all duration-500"
          style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
        />

        <div className="relative z-10 flex justify-between">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className="flex flex-col items-center gap-2">
              <div
                className={`h-10 w-10 rounded-full flex items-center justify-center font-semibold border-4 transition-all duration-300 ${
                  currentStep >= step
                    ? "bg-primary border-background text-primary-foreground shadow-lg shadow-primary/30 scale-110"
                    : "bg-muted border-background text-muted-foreground"
                }`}
              >
                {step >= currentStep ? (
                  step
                ) : (
                  <CheckCircle className="h-5 w-5" />
                )}
              </div>
              <span
                className={`text-xs font-medium transition-colors duration-300 ${
                  currentStep >= step ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {step === 1 && "Dataset"}
                {step === 2 && "Details"}
                {step === 3 && "Bounty"}
                {step === 4 && "Review"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="min-h-[400px]">
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
      </div>
    </div>
  );
}
