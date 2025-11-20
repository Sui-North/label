# Songsim Label - Frontend Development Tasks

## Overview

This document tracks the development of the Next.js frontend for the Songsim Label decentralized data labeling marketplace.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Blockchain**: Sui Wallet Kit (@mysten/dapp-kit) with gRPC API
- **Data Access**: Sui gRPC API (@mysten/sui) - High-performance Protocol Buffers over HTTP/2
- **Storage**: Walrus HTTP API (client-side uploads via Publisher, downloads via Aggregator)
- **Encryption**: Seal SDK (client-side E2E encryption)
- **Styling**: TailwindCSS
- **State Management**: TanStack React Query (formerly React Query)
- **UI Components**: shadcn/ui

---

## M0 - Foundation & Setup ✅

- [x] Scaffold Next.js project
- [x] Install and configure dependencies
  - [x] @mysten/dapp-kit (wallet integration)
  - [x] @mysten/sui (gRPC client included)
  - [x] @tanstack/react-query (data fetching/caching)
  - [x] @tanstack/react-query-devtools (development tools)
- [x] Set up project structure
- [x] Create providers (React Query + Sui wallet)
- [x] Configure environment variables (.env.local)
- [x] Create contract constants file

---

## M1 - Functional MVP

### Infrastructure & Configuration

- [x] Install and configure Sui dApp Kit

  - [x] Set up wallet providers (Sui Wallet, Ethos, etc.)
  - [x] Configure network settings (testnet)
  - [x] Create wallet connection context
  - [x] Create WalletConnection component with dropdown UI

- [x] Configure Walrus HTTP API integration (COMPLETED - lib/walrus.ts)

  - [x] Set up Publisher endpoint for uploads (PUT /v1/blobs)
  - [x] Set up Aggregator endpoint for downloads (GET /v1/blobs/<blob-id>)
  - [x] Create Walrus service wrapper class
  - [x] Implement blob upload function with fetch/axios
  - [x] Implement blob download function
  - [x] Handle multipart form uploads for files
  - [x] Parse JSON responses (blobId, storage info)
  - [x] Implement blob ID validation
  - [x] Handle upload errors and retries
  - [x] Configure storage epochs parameter (default to 5)
  - [x] Set deletable flag for blobs

- [x] Install and configure Seal SDK (COMPLETED - lib/seal.ts)

  - [x] Install @mysten/seal package
  - [x] Set up encryption utilities (encryptWithSeal, encryptFileForWalrus)
  - [x] Set up decryption utilities (decryptWithSeal, decryptWalrusData)
  - [x] Implement session key management (createSessionKey)
  - [x] Create encryption/decryption service wrapper
  - [x] Implement envelope encryption for large files
  - [x] Create access policy Move contract (access_policy.move)
  - [x] Configure key servers for testnet
  - [x] Add helper functions (generateSealId, isEncryptionEnabled)

- [x] Set up environment configuration

  - [x] Sui network RPC endpoints
  - [x] Contract package IDs
  - [x] Walrus Publisher URL (e.g., https://publisher.walrus-testnet.walrus.space)
  - [x] Walrus Aggregator URL (e.g., https://aggregator.walrus-testnet.walrus.space)
  - [x] Seal configuration (NEXT_PUBLIC_SEAL_PACKAGE_ID - optional)

- [x] Configure TailwindCSS and UI library

  - [x] Install shadcn/ui components
  - [x] Set up design tokens (colors, spacing)
  - [x] Create base layout components (Navbar, Footer)

- [x] Install and configure TanStack React Query
  - [x] Install @tanstack/react-query package
  - [x] Set up QueryClient with default options
  - [x] Create QueryClientProvider wrapper
  - [x] Configure stale time and cache time defaults
  - [x] Set up React Query DevTools (development only)
  - [x] Create custom hooks directory structure

### Sui Data Access Layer (Using @mysten/dapp-kit)

- [x] Create React Query hooks for blockchain data (`hooks/`)

  - [x] `useUserProfile()` - Fetch current user's profile
  - [x] `useProfileByAddress(address)` - Fetch any user's profile
  - [x] `useTask(taskId)` - Fetch single task details
  - [x] `useAllTasks()` - Fetch all tasks from registry
  - [x] `useMyTasks()` - Fetch user's created tasks
  - [x] `useMySubmissions()` - Fetch user's submissions
  - [x] `useAllSubmissions()` - Fetch all submissions
  - [x] `useTaskSubmissions(taskId)` - Fetch submissions for a task
  - [x] Configure refetch intervals and caching strategies
  - [x] Implement error handling and retry logic

- [x] Create transaction mutation hooks (`lib/contracts/songsim.ts`)

  - [x] `createProfileTransaction()` - Profile creation
  - [x] `updateProfileTransaction()` - Profile update
  - [x] `createTaskTransaction()` - Task creation
  - [x] `submitLabelsTransaction()` - Label submission
  - [x] `cancelTaskTransaction()` - Task cancellation
  - [x] Implement optimistic updates
  - [x] Set up query invalidation after mutations

### Wallet & Authentication

- [x] Create wallet connection component

  - [x] Connect/disconnect wallet button with Sui dApp Kit
  - [x] Display connected address with formatted display
  - [x] Network selector (testnet/mainnet)
  - [x] Account balance display using Sui client

- [x] Create authentication flow
  - [x] Check if user has profile
  - [x] Redirect to profile creation if needed
  - [x] Store wallet state globally (handled by dApp Kit)
  - [x] Handle wallet disconnection events

### User Profile Management

- [x] Create profile creation page (app/auth/page.tsx)

  - [x] Display name input
  - [x] Bio/description textarea
  - [x] Avatar upload (Walrus)
  - [x] User type selection (requester/labeler/both)
  - [x] Submit transaction to create profile

- [x] Create profile view component (app/dashboard/profile/page.tsx)

  - [x] Display profile information
  - [x] Show avatar from Walrus
  - [x] Display statistics (tasks/submissions)
  - [x] Show reputation score
  - [x] Link to edit profile

- [x] Create profile edit page (integrated in profile page)

  - [x] Pre-populate existing data
  - [x] Update profile fields
  - [x] Upload new avatar to Walrus
  - [x] Submit transaction to update profile

- [x] Implement profile data fetching

  - [x] Create `useUserProfile` React Query hook
  - [x] Create `useProfileByAddress` React Query hook
  - [x] Query user profile from contract with caching
  - [x] Download avatar from Walrus with query
  - [x] Implement optimistic updates for profile edits
  - [x] Set up query invalidation on profile updates

- [x] Create UserDisplay component (components/user-display.tsx)
  - [x] Display user with avatar and name
  - [x] Clickable avatars to open profile dialog
  - [x] Show user badges and stats
  - [x] Fallback to address when no profile

### Task Creation (Requester Flow)

- [x] Create task creation page/form (app/dashboard/create-task/page.tsx)

  - [x] Task title and description inputs
  - [x] Task type selector (classification, bounding box, etc.)
  - [x] Instruction text editor
  - [x] Dataset file upload to Walrus
  - [x] Bounty amount input (SUI)
  - [x] Number of required labelers input
  - [x] Deadline date picker
  - [x] Preview task before submission

- [x] Implement dataset upload flow

  - [x] File selection and validation (max size, format checks)
  - [x] Show upload progress bar with percentage
  - [x] Upload to Walrus via HTTP PUT to Publisher endpoint
  - [x] Parse response and extract blobId from Walrus
  - [x] Store blob ID locally in form state
  - [x] Handle upload errors (network failures, size limits exceeded)
  - [x] Display uploaded file confirmation with preview
  - [x] Allow file replacement before final submission

- [x] Implement task creation transaction

  - [x] Prepare transaction payload with Move call
  - [x] Include bounty stake (SUI coins)
  - [x] Submit to smart contract
  - [x] Poll transaction status
  - [x] Show success/error messages with transaction digest
  - [x] Redirect to task detail page on success

- [x] Create task list view (requester) (app/dashboard/tasks/page.tsx)
  - [x] Display user's created tasks (filter by creator address)
  - [x] Filter by status (open, in_progress, completed)
  - [x] Show task summary cards (title, bounty, status, progress)
  - [x] Click to view full task details
  - [x] Cancel task functionality

### Task Discovery (Labeler Flow)

- [x] Create task marketplace/browse page (app/tasks/page.tsx)

  - [x] Display all open tasks (query TaskRegistry)
  - [x] Task cards with key information (title, bounty, deadline, type)
  - [x] Filter by task type (classification, bounding box, etc.)
  - [x] Sort by bounty, deadline, created date
  - [x] Search functionality (client-side filtering)
  - [x] Show requester information with UserDisplay

- [x] Create task detail view (labeler) (app/tasks/[id]/page.tsx)
  - [x] Display full task information
  - [x] Download dataset from Walrus via HTTP GET to Aggregator
  - [x] Display task instructions with formatted markdown
  - [x] Show bounty and deadline prominently
  - [x] Show number of submissions
  - [x] "Start Labeling" button with submission form

### Labeling Workspace

- [x] Create annotation interface (app/tasks/[id]/page.tsx)

  - [x] Display dataset (images, text, etc.) from Walrus
  - [x] File upload for results
  - [x] Save progress locally

- [ ] Implement advanced annotation tools (FUTURE - based on task type)

  - [ ] **Classification**: Category selector, confidence slider
  - [ ] **Bounding Box**: Drawing tool with canvas, label selector dropdown
  - [ ] **Text Classification**: Category buttons, text highlighting
  - [ ] **Segmentation**: Polygon/brush tools (future enhancement)

- [x] Implement label submission flow

  - [x] Validate submission file
  - [x] Upload labels to Walrus via HTTP PUT
  - [x] Receive blob ID from Walrus response
  - [x] Submit blob ID to contract
  - [x] Show confirmation with transaction digest

- [x] Create submission tracking (app/dashboard/submissions/page.tsx)
  - [x] Display user's submissions (filter by labeler address)
  - [x] Show submission status (pending, accepted, rejected)
  - [x] Link to original task details via dialog
  - [x] Show submission file download

### Task Management (Requester)

- [x] Create task detail view (requester) (app/dashboard/tasks/[id]/page.tsx)

  - [x] Display task information
  - [x] Show all submissions
  - [x] Download submitted labels from Walrus via HTTP GET
  - [x] View submission details with labeler profiles (UserDisplay)
  - [x] Cancel task button (if no submissions)
  - [x] Finalize consensus dialog with review interface
  - [x] Review/Accept/Reject individual submissions

- [x] Create consensus trigger interface (components/consensus-dialog.tsx)

  - [x] Button to trigger consensus calculation
  - [x] Submit transaction with accepted/rejected submission IDs
  - [x] Show payout preview and submission count
  - [x] Display submission review interface
  - [x] Accept/Reject buttons for each submission
  - [x] Payout distribution preview
  - [x] Transaction confirmation with success/error handling

- [ ] Create payout interface (FUTURE - when payout is ready)
  - [ ] Display consensus results
  - [ ] Show accepted/rejected submissions list
  - [ ] Display payout distribution breakdown
  - [ ] Execute payout transaction
  - [ ] Show transaction confirmation with explorer link

### Rewards & Reputation

- [x] Create user dashboard (app/dashboard/page.tsx)

  - [x] Display total earnings (SUI)
  - [x] Show reputation score and level from UserProfile object
  - [x] List recent activity
  - [x] Show completed tasks count from UserProfile statistics
  - [x] Acceptance rate percentage calculation

- [x] Create reputation display component (integrated in dashboard)

  - [x] Visual representation (stars, badges, progress bars)
  - [x] Detailed statistics (total submissions, acceptance rate, tasks completed)

- [ ] Create earnings/payout history (FUTURE)
  - [ ] List all payouts received
  - [ ] Show payout amounts and dates
  - [ ] Link to related tasks
  - [ ] Export to CSV functionality

### Notifications & Activity Feed

- [ ] Create notification system (FUTURE)

  - [ ] New task notifications (for labelers)
  - [ ] Submission received (for requesters)
  - [ ] Consensus completed notifications
  - [ ] Payout received notifications
  - [ ] Task deadline approaching

- [ ] Create activity feed component (FUTURE)
  - [ ] Recent platform activity
  - [ ] User-specific activity feed
  - [ ] Real-time updates

### Common Components

- [x] Create loading states

  - [x] Skeleton loaders
  - [x] Spinner components
  - [x] Progress bars

- [x] Create error handling

  - [x] Error boundary components
  - [x] Toast notifications (sonner)
  - [x] Error pages (404, 500)
  - [x] Transaction error messages

- [x] Create wallet transaction UI

  - [x] Transaction pending modal with spinner
  - [x] Transaction success confirmation with digest
  - [x] Transaction failure handling with error details
  - [x] Gas fee display

- [x] Create data display components
  - [x] Address formatter (truncate)
  - [x] SUI amount formatter
  - [x] Date/time formatter
  - [x] Status badges
  - [x] UserDisplay with avatar and profile dialog

### Testing

- [ ] Unit tests for utility functions

  - [ ] Walrus HTTP upload/download functions
  - [ ] Blob ID validation
  - [ ] Progress tracking calculations
  - [ ] Seal encryption/decryption
  - [ ] Data formatters
  - [ ] Validation functions

- [ ] Component tests

  - [ ] Profile components
  - [ ] Task creation form
  - [ ] Annotation tools
  - [ ] Wallet connection

- [ ] Integration tests

  - [ ] End-to-end task creation flow (wallet → form → Walrus → gRPC transaction → confirmation)
  - [ ] End-to-end labeling flow (browse → download → label → upload → gRPC submission)
  - [ ] Wallet connection flow (connect → sign → disconnect)
  - [ ] Profile management flow (create → update → fetch via gRPC)

- [ ] E2E tests with Playwright
  - [ ] Complete requester journey
  - [ ] Complete labeler journey
  - [ ] Error scenarios

### Documentation

- [ ] User documentation

  - [ ] Getting started guide
  - [ ] Requester guide (creating tasks)
  - [ ] Labeler guide (completing tasks)
  - [ ] Wallet setup instructions

- [ ] Developer documentation
  - [ ] Project structure overview
  - [ ] Component documentation with props
  - [ ] gRPC integration guides (LedgerService, StateService, etc.)
  - [ ] Walrus HTTP API integration guide
  - [ ] Deployment instructions (Vercel, Netlify, or self-hosted)

---

## M2 - Quality & Advanced Features

### Enhanced UI/UX

- [x] Implement dark mode
- [x] Add animations and transitions
- [x] Improve mobile responsiveness
- [ ] Add keyboard shortcuts
- [ ] Improve accessibility (WCAG compliance)

### Advanced Annotation Tools

- [ ] Implement segmentation tools
- [ ] Add polygon annotation
- [ ] Implement brush/eraser tools
- [ ] Add zoom and pan controls
- [ ] Implement undo/redo functionality

### Analytics & Insights

- [x] Create requester analytics dashboard (app/dashboard/analytics/page.tsx)

  - [x] Task completion rates
  - [x] Average completion time calculation
  - [x] Spending analysis

- [x] Create labeler analytics (integrated in dashboard)
  - [x] Tasks completed trends
  - [x] Time spent per task tracking

### Gamification

- [x] Create leaderboard page (app/leaderboard/page.tsx)

  - [x] Top labelers by reputation
  - [x] Top earners from aggregated payouts
  - [x] Most active users by submission count
  - [x] Filter by time period

- [ ] Implement badge system (FUTURE)

  - [ ] Display earned badges
  - [ ] Badge requirements
  - [ ] Achievement notifications

- [ ] Create prize pool interface (FUTURE)
  - [ ] Display active prize pools
  - [ ] Show user's rank
  - [ ] Prize distribution preview

### Search & Discovery

- [x] Advanced task search (app/tasks/page.tsx)

  - [x] Full-text search
  - [x] Multiple filters
  - [x] Task type filtering
  - [x] Sort options

- [x] Task recommendations (app/dashboard/available/page.tsx)
  - [x] Available tasks for labelers
  - [x] Filter by status
  - [x] Sort by various criteria

### Batch Operations

- [ ] Bulk task creation

  - [ ] CSV upload for multiple tasks
  - [ ] Template-based creation
  - [ ] Batch Walrus uploads

- [ ] Bulk label submission
  - [ ] Submit multiple tasks at once
  - [ ] Progress tracking

---

## M3 - Tokenomics & DAO

### $SLT Token Integration

- [ ] Display token balance
- [ ] Token payment interface
- [ ] Token staking UI
- [ ] Token swap integration

### Governance Interface

- [ ] Create proposal browsing page
- [ ] Proposal creation form
- [ ] Voting interface
- [ ] Governance dashboard
- [ ] Treasury view

---

## Notes

### Current Priorities

1. Set up wallet and blockchain integration
2. Implement core user flows (profile, task creation, labeling)
3. Client-side storage (Walrus + Seal)
4. Deploy testnet version

### Dependencies

- Sui dApp Kit
- Walrus HTTP API (Publisher & Aggregator endpoints)
- Seal SDK
- Smart contract deployment
- Public Walrus testnet endpoints

### Performance Considerations

- Optimize Walrus HTTP uploads for large files (chunking if needed, multipart)
- Implement React Query caching strategies (staleTime: 1 min for objects, 30s for balances)
- Use gRPC field masks to fetch only required fields (bandwidth optimization)
- Debounce search inputs and filters (300ms delay)
- Lazy load annotation interface components (React.lazy + Suspense)
- Virtualize long task lists (react-window or react-virtual)
- Optimize gRPC SubscriptionService connections (reuse streams, close on unmount)
- Use IndexedDB for offline annotation progress (Dexie.js)
- Implement pagination with cursor-based navigation (gRPC supports this natively)
- Cache blockchain queries with React Query (default 5 min staleTime for static data)
- Progressive image loading from Walrus Aggregator URLs (blur placeholder → full quality)
- Optimize bundle size with dynamic imports and tree shaking
- Use direct Aggregator URLs for image src attributes (no proxy needed)
- Implement request timeout handling (30s default for Walrus, 10s for gRPC)
- Rate limit Walrus API calls if needed (client-side throttling)

### Security Considerations

- Never expose private keys (handled by Sui wallet extensions)
- Validate all user inputs (client-side + smart contract validation)
- Sanitize file uploads before Walrus (check MIME types, size limits, virus scanning)
- Implement rate limiting on transaction submissions (prevent spam)
- Verify gRPC responses (validate signatures, check data integrity)
- Use HTTPS for all API calls (Walrus aggregators, gRPC endpoints)
- Implement CSRF protection for sensitive actions
- Secure local storage encryption for draft data (IndexedDB with encryption)
- Validate smart contract addresses before transactions (checksum validation)
- Secure encryption key handling for Seal (never log or expose keys)
- HTTPS only in production (enforce via Next.js middleware)
