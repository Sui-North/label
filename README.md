# Songsim Label - Decentralized Data Labeling Marketplace

A decentralized data labeling platform built on the Sui blockchain, integrating Walrus storage for datasets and label submissions.

## Overview

Songsim Label connects data requesters with labelers in a trustless marketplace. Requesters post tasks with bounties, labelers submit labels, and smart contracts handle consensus and payouts automatically.

**Key Features:**

- 🔐 Wallet-based authentication (Sui wallets)
- 👤 User profiles with avatar storage on Walrus
- 📊 Task creation and management
- 🏆 Reputation system for labelers
- 💰 Automated bounty distribution
- 🌐 Decentralized storage via Walrus

---

## Quick Start

### Prerequisites

- Node.js 18+ and pnpm
- Sui wallet (e.g., Sui Wallet browser extension)
- Testnet SUI tokens (from faucet)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd songsim-label

# Install dependencies
pnpm install

# Copy environment variables
cp .env.local.example .env.local

# Update .env.local with your contract IDs
# See DEPLOYMENT_TESTNET.md for current testnet deployment
```

### Environment Configuration

Update `.env.local` with the deployed contract addresses:

```bash
# Sui Network Configuration
NEXT_PUBLIC_SUI_NETWORK=<YOUR_SUI_NETWORK>
NEXT_PUBLIC_SUI_RPC_URL=<YOUR_SUI_RPC_URL>

# Smart Contract Configuration
# Deployed January 2025 (v3.0.0 - Shared Object Architecture)
NEXT_PUBLIC_PACKAGE_ID=<YOUR_PACKAGE_ID>
NEXT_PUBLIC_PLATFORM_CONFIG_ID=<YOUR_PLATFORM_CONFIG_ID>
NEXT_PUBLIC_TASK_REGISTRY_ID=<YOUR_TASK_REGISTRY_ID>
NEXT_PUBLIC_MIGRATION_STATE_ID=<YOUR_MIGRATION_STATE_ID>

# Walrus Configuration (Testnet)
NEXT_PUBLIC_WALRUS_PUBLISHER_URL=<YOUR_WALRUS_PUBLISHER_URL>
NEXT_PUBLIC_WALRUS_AGGREGATOR_URL=<YOUR_WALRUS_AGGREGATOR_URL>
NEXT_PUBLIC_WALRUS_DEFAULT_EPOCHS=<YOUR_WALRUS_DEFAULT_EPOCHS>

# Application Configuration
NEXT_PUBLIC_APP_NAME=<YOUR_APP_NAME>
NEXT_PUBLIC_APP_DESCRIPTION=<YOUR_APP_DESCRIPTION>

# Seal Encryption Configuration (Optional - for E2E encryption)
NEXT_PUBLIC_SEAL_PACKAGE_ID=<YOUR_SEAL_PACKAGE_ID>
NEXT_PUBLIC_ACCESS_REGISTRY_ID=<YOUR_ACCESS_REGISTRY_ID>

NEXT_PUBLIC_ADMIN_CAP_ID=<YOUR_ADMIN_CAP_ID>
NEXT_PUBLIC_UPGRADE_CAP_ID=<YOUR_UPGRADE_CAP_ID>
```

### Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

---

## Architecture

### Tech Stack

**Frontend:**

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui components
- TanStack React Query (state management)
- Three.js (3D hero section)

**Blockchain:**

- Sui Move smart contracts
- @mysten/dapp-kit (wallet integration)
- @mysten/sui (blockchain interaction)

**Storage:**

- Walrus decentralized storage
- Stores avatars, datasets, and submission results

### Smart Contract

See `../songsim/` for Move contract source code.

**Key Functions:**

- `create_profile()` - Create user profile with avatar URL
- `update_profile()` - Update profile information
- `create_task()` - Create labeling task with dataset URL
- `submit_labels()` - Submit labels with result URL
- `finalize_consensus()` - Execute consensus and distribute payouts

**Key Changes (Latest Version):**

- ✅ Stores full Walrus URLs instead of blob IDs
- ✅ No client-side URL construction needed
- ✅ Avatar URLs: `avatar_url` field (was `avatar_blob_id`)
- ✅ Dataset URLs: `dataset_url` field (was `dataset_blob_id`)
- ✅ Result URLs: `result_url` field (was `result_blob_id`)

---

## User Flow

### 1. Authentication

- Connect Sui wallet (Sui Wallet, Suiet, Ethos, etc.)
- Create profile with display name, bio, and avatar
- Select user type: Requester, Labeler, or Both

### 2. For Requesters

1. Upload dataset to Walrus (automatic)
2. Create task with title, description, and instructions
3. Set bounty amount and required labeler count
4. Wait for submissions
5. Review submissions and finalize consensus
6. Platform distributes payouts automatically

### 3. For Labelers

1. Browse available tasks
2. View task details and dataset
3. Download dataset, perform labeling
4. Upload results to Walrus (automatic)
5. Submit labels on-chain
6. Receive payout when consensus reached

---

## Project Structure

```
songsim-label/
├── app/                    # Next.js app directory
│   ├── auth/              # Authentication page
│   ├── dashboard/         # Dashboard (requester/labeler)
│   ├── tasks/             # Task browsing and creation
│   ├── leaderboard/       # Leaderboard page
│   └── profile/           # Profile management
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── navbar.tsx        # Navigation bar
│   └── providers.tsx     # App providers (React Query, Sui)
├── hooks/                # Custom React hooks
│   └── use-user-profile.ts  # Profile query hooks
├── lib/                  # Utility libraries
│   ├── contracts/        # Smart contract integration
│   │   └── songsim.ts   # Contract functions
│   ├── walrus.ts        # Walrus storage integration
│   └── utils.ts         # General utilities
├── public/              # Static assets
└── .env.local          # Environment configuration
```

---

## Key Files

### Contract Integration

**`lib/contracts/songsim.ts`**

- Transaction builders for all contract functions
- Query functions for profiles and tasks
- Type definitions for contract data

**`lib/walrus.ts`**

- `uploadToWalrus()` - Upload files, returns `{ blobId, url, endEpoch, cost }`
- `getWalrusReadUrl()` - Generate read URL for blob ID
- Blob URLs: `https://aggregator.../v1/blobs/<blob-id>`

### State Management

**`hooks/use-user-profile.ts`**

- `useUserProfile()` - Current user's profile
- `useHasProfile()` - Check if user has profile
- `useProfileByAddress()` - Query any user's profile
- `useInvalidateProfile()` - Refresh profile cache

Uses TanStack React Query for caching with 1-minute stale time.

---

## Features

### ✅ Implemented

- **Landing Page**: Modern hero section with 3D animations
- **Authentication**: Wallet connection with profile creation
- **Profile Management**: Create/edit profile with avatar upload
- **Task Creation**: Create tasks with dataset upload
- **Task Browsing**: Search, filter, and sort tasks
- **Leaderboard**: Top labelers and requesters
- **Dashboard**: Role-based view (requester/labeler/both)
- **Walrus Integration**: Automatic file uploads
- **Reputation System**: Track labeler performance
- **React Query**: Global state management with caching

### 🚧 In Progress

- End-to-end testing with real contract
- Submission workflow testing
- Payout distribution testing

### 📋 Planned

- Task progress tracking
- Submission review interface
- Dispute resolution (future)
- Advanced reputation scoring (future)

---

## Testing

### Contract Testing

```bash
cd ../songsim
sui move test
```

### Frontend Testing

```bash
pnpm test       # Run tests
pnpm lint       # Check linting
pnpm build      # Production build
```

---

## Deployment

### Testnet

Contract is deployed to Sui testnet. See `../songsim/DEPLOYMENT_TESTNET.md` for details.

**Current Deployment:**

- Package: `0x0ae02aaad38a9e51fac88128b947a3d7ea9ea662b00aa9dabc057c337f31f677`
- Config: `0xfe0e07e579a861eb07cfb9fca7f341fb76c44001f20ebf2a733e594abbaa90a1`
- Registry: `0xab8ef92385de74efb7527c2c7ff230eb7331bca08a785711d0093209ee70d7ed`

### Frontend Deployment

Deploy to Vercel, Netlify, or any Next.js hosting platform:

```bash
pnpm build
pnpm start
```

**Environment Variables:**

- Configure in hosting platform dashboard
- Use production RPC URL for mainnet
- Update contract IDs for mainnet deployment

---

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## Resources

**Documentation:**

- [Sui Documentation](https://docs.sui.io)
- [Walrus Documentation](https://docs.walrus.site)
- [Next.js Documentation](https://nextjs.org/docs)
- [shadcn/ui](https://ui.shadcn.com)

**Project Files:**

- Task Tracking: `TASKS.md`
- Setup Guide: `SETUP.md`
- Contract Deployment: `../songsim/DEPLOYMENT_TESTNET.md`

---

## License

MIT License - see LICENSE file for details

---

## Support

For issues or questions:

- Create an issue in the repository
- Check documentation files
- Review testnet deployment guide

---

**Status:** ✅ Testnet Deployed | 🚧 Active Development
