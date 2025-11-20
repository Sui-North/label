# Songsim Contract Integration Setup

## Prerequisites

1. Deploy the Songsim smart contract to Sui testnet
2. Note the Package ID, Platform Config ID, and Task Registry ID from deployment

## Configuration Steps

### 1. Set Environment Variables

Copy `.env.local.example` to `.env.local` and update the contract addresses:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your contract addresses:

```env
# Update these with your deployed contract addresses
NEXT_PUBLIC_PACKAGE_ID=0x<your_package_id>
NEXT_PUBLIC_PLATFORM_CONFIG_ID=0x<your_platform_config_id>
NEXT_PUBLIC_TASK_REGISTRY_ID=0x<your_task_registry_id>
```

### 2. Find Contract Addresses

After deploying the contract using `sui move build && sui client publish`, you'll see output like:

```
----- Transaction Effects ----
...
Created Objects:
  - ID: 0xabc123... (This is your PACKAGE_ID)
  - ID: 0xdef456... (PlatformConfig - shared object)
  - ID: 0xghi789... (TaskRegistry - shared object)
```

**How to identify each object:**

1. **PACKAGE_ID**: Listed in the "Published Objects" section
2. **PLATFORM_CONFIG_ID**: The shared object of type `PlatformConfig`
3. **TASK_REGISTRY_ID**: The shared object of type `TaskRegistry`

### 3. Verify Configuration

You can verify your configuration by running:

```typescript
import {
  PACKAGE_ID,
  PLATFORM_CONFIG_ID,
  TASK_REGISTRY_ID,
} from "@/lib/contracts/songsim";

console.log("Package ID:", PACKAGE_ID);
console.log("Platform Config ID:", PLATFORM_CONFIG_ID);
console.log("Task Registry ID:", TASK_REGISTRY_ID);
```

## Smart Contract Functions Available

### Profile Management

- `createProfileTransaction()` - Create new user profile
- `updateProfileTransaction()` - Update existing profile
- `updateUserTypeTransaction()` - Change user role
- `hasUserProfile()` - Check if user has a profile
- `getUserProfile()` - Fetch user profile data

### Task Management

- `createTaskTransaction()` - Create new labeling task
- `submitLabelsTransaction()` - Submit labels for a task
- `getAllTasks()` - Fetch all tasks from registry

### Utility Functions

- `decodeVectorU8()` - Decode Move vector<u8> to string
- `formatSuiAmount()` - Format MIST to SUI

## Walrus Storage Integration

Walrus is used for storing:

- User avatar images
- Task dataset files
- Submission result files

Configuration in `.env.local`:

```env
NEXT_PUBLIC_WALRUS_PUBLISHER_URL=https://publisher.walrus-testnet.walrus.space
NEXT_PUBLIC_WALRUS_AGGREGATOR_URL=https://aggregator.walrus-testnet.walrus.space
```

### Walrus Functions Available

- `uploadToWalrus()` - Upload single file
- `uploadMultipleToWalrus()` - Upload multiple files
- `getWalrusReadUrl()` - Get URL to read blob
- `checkBlobExists()` - Verify blob exists
- `estimateStorageCost()` - Estimate storage cost

## Testing

### 1. Test Profile Creation

1. Navigate to `/auth`
2. Connect your wallet
3. Fill in the profile form
4. Upload an avatar (optional)
5. Select your role
6. Click "Create Profile"
7. Approve the transaction in your wallet

### 2. Test Task Creation

1. Navigate to `/tasks/create`
2. Upload dataset files
3. Configure task settings
4. Set bounty and deadline
5. Submit the transaction

### 3. Test Task Browsing

1. Navigate to `/tasks`
2. Browse available tasks
3. Use filters and search
4. Click on a task to view details

## Troubleshooting

### "Contract not properly configured" error

- Verify that `TASK_REGISTRY_ID` and `PLATFORM_CONFIG_ID` are set in `.env.local`
- Restart the Next.js dev server after updating `.env.local`

### Transaction fails

- Check that you have enough SUI for gas fees
- Verify the contract is deployed on the correct network (testnet/mainnet)
- Check browser console for detailed error messages

### Walrus upload fails

- Verify Walrus endpoints are accessible
- Check file size limits (5MB for avatars)
- Ensure correct file types are being uploaded

## Contract Structure Reference

```move
// User Types
const USER_TYPE_REQUESTER: u8 = 1;  // Can create tasks
const USER_TYPE_LABELER: u8 = 2;    // Can label tasks
const USER_TYPE_BOTH: u8 = 3;       // Both roles

// Task Status
const STATUS_OPEN: u8 = 0;
const STATUS_IN_PROGRESS: u8 = 1;
const STATUS_COMPLETED: u8 = 2;
const STATUS_CANCELLED: u8 = 3;

// Key Structs
- UserProfile: User account with role and stats
- Reputation: User reputation score and history
- Task: Labeling task with bounty
- Submission: Label submission by labeler
- TaskRegistry: Global registry (shared object)
- PlatformConfig: Platform settings (shared object)
```

## Next Steps

1. Deploy your contract to testnet
2. Update `.env.local` with contract addresses
3. Test profile creation and task workflows
4. Integrate additional features as needed

For more details, see:

- [Sui Documentation](https://docs.sui.io)
- [Walrus Documentation](https://docs.walrus.site)
- [MysteN dApp Kit](https://sdk.mystenlabs.com/dapp-kit)
