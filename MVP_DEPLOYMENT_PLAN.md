# SORTS MVP Deployment Plan

Last audited: 2026-05-01

This file is a practical deployment checklist for the current SORTS monorepo. It is written for a beginner: when it says "resource", it means an account, key, URL, hosted service, or contract address you must create outside the code.

## 1. Current Repo Structure

```text
SORTS/
├── contracts/          Solidity contracts, Hardhat config, deploy script, tests
├── backend/            Express API, grammy Telegram bot, SQLite database services
├── frontend/           Next.js 14 App Router app, Privy, wagmi, Arbitrum Sepolia UI
├── packages/shared/    Shared TypeScript interfaces and types
├── handoff/            Earlier static/demo handoff assets
├── package.json        Root workspace scripts
├── pnpm-workspace.yaml Workspace package list
├── pnpm-lock.yaml      Locked dependency versions
└── turbo.json          Turborepo build pipeline
```

Important note: `/Users/rejoelm/Desktop/AI/SORTS` is currently not a Git repository from this folder. `git status --short` returns `fatal: not a git repository`. That means the suggested commit cannot be made here until this folder is initialized as Git or replaced by a cloned GitHub repository.

## 2. Exact Package Names

These are the package names from each `package.json`:

| Workspace | Package name |
| --- | --- |
| Root | `sorts` |
| Frontend | `@sorts/frontend` |
| Backend | `@sorts/backend` |
| Contracts | `@sorts/contracts` |
| Shared package | `@sorts/shared` |

## 3. Exact Commands That Work In This Repo

Run commands from the repo root unless the command says `cd`.

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm --filter @sorts/contracts compile
pnpm --filter @sorts/frontend build
pnpm --filter @sorts/backend build
pnpm --filter @sorts/shared build
```

Workspace dev commands available:

```bash
pnpm dev
cd frontend && pnpm dev
cd backend && pnpm dev
```

Contracts commands available:

```bash
cd contracts && pnpm compile
cd contracts && pnpm test
cd contracts && pnpm deploy:local
cd contracts && pnpm deploy:sepolia
```

Deployment commands are available, but `deploy:sepolia` needs a funded deployer wallet private key and Arbitrum Sepolia RPC configuration in `contracts/.env`. Do not commit that file.

## 4. Current Route Status

These are the current Next.js routes found in `frontend/src/app`.

| Route | Status | Notes |
| --- | --- | --- |
| `/` | Done visually, not fully wired | Landing page exists, but several CTA links point to missing routes: `/studio/create`, `/studio`, and `/role`. Current real routes are `/create`, `/dashboard`, `/discover`, `/join/[communityId]`, `/community/[communityId]`, `/link`, and `/account`. |
| `/create` | Partially functional, blocked by config/resources | Connects wallet through Privy, calls `SortsFactory.createCommunity()`, reads the emitted contract address, then POSTs metadata to backend. Current blocker: frontend sends category `trading`, but backend rejects it. |
| `/dashboard` | Partial Creator Studio | Uses Privy auth, fetches communities and aggregate dashboard analytics, filters communities by creator wallet. |
| `/dashboard/[communityId]` | Partial Creator Studio | Fetches community, aggregate analytics, and creator content. Can create content through backend. Must continue preserving aggregate-only privacy. |
| `/discover` | Partial | Lists communities from backend and links to join pages. |
| `/join/[communityId]` | Partial but close to MVP | Fetches community metadata, lets subscriber call `subscribe(uint8 tier)` or `renewSubscription()` on the community contract, checks `checkAccess(address)`, and links to feed. |
| `/community/[communityId]` | Partial gated feed | Fetches community/content, checks wallet access with `checkAccess`, signs content-read message, and asks backend for gated content. |
| `/link` | Partial Telegram wallet link | Signs wallet ownership and POSTs to `/api/link/verify`. Needs Telegram challenge flow to be tested end-to-end. |
| `/account` | Partial | Shows Privy user/wallet information to the signed-in user only. |

## 5. Current Backend Endpoint Status

Base URL locally: `http://localhost:3001`

| Endpoint | Status | Privacy notes |
| --- | --- | --- |
| `GET /health` | Works | Basic health check only. |
| `GET /api/communities` | Works | Lists community metadata and tier config. Does not expose subscriber wallets. |
| `GET /api/communities?category=...` | Works | Category filter exists. |
| `GET /api/communities/:id` | Works | Returns one community and tier config. |
| `GET /api/communities/creator/:wallet` | Works | Returns communities created by wallet. This exposes creator-owned community metadata, not subscriber lists. |
| `POST /api/communities` | Works if body validates | Saves community after on-chain deployment. Current frontend can fail validation because it sends `category: "trading"`. |
| `GET /api/content/:communityId` | Partial | Public users get locked metadata. Members can provide wallet + signature to unlock posts they can access. |
| `GET /api/content/:communityId/:postId` | Partial | Verifies signature and on-chain tier access before returning body. |
| `POST /api/content/:communityId` | Partial | Creator can create posts. iExec-protected posts require DataProtector env vars. |
| `PATCH /api/content/:communityId/:postId` | Partial | Creator-owned edit route exists. |
| `DELETE /api/content/:communityId/:postId` | Partial | Creator-owned delete route exists. |
| `POST /api/link/verify` | Partial | Verifies wallet proof and stores wallet-to-Telegram delivery link. This must never be shown in Creator Studio. |
| `GET /api/analytics/community/:communityId` | Works in shape, depends on chain | Returns aggregate-only stats from `getAggregateStats()`. No member list. |
| `GET /api/analytics/dashboard/:wallet` | Works in shape | Aggregates creator dashboard stats. No subscriber wallets/tier lists. |

Missing or not explicit yet:

- No dedicated backend endpoint like `GET /api/membership/status`. Current membership status is checked by frontend contract reads.
- No backend endpoint records a completed subscribe transaction. That may be okay for MVP because the chain is the source of truth.
- No creator-facing endpoint should ever return `membership_cache.wallet_address`, `wallet_links.wallet_address`, or exact tier ownership lists.

## 6. Current Contract Deployment Status

Contracts compile successfully.

Current contract files:

| File | Purpose |
| --- | --- |
| `contracts/contracts/SortsMembership.sol` | Non-transferable ERC-7984-style membership contract for one community. |
| `contracts/contracts/SortsFactory.sol` | Deploys membership contracts and receives the 5% protocol fee. |
| `contracts/scripts/deploy.ts` | Deploys `SortsFactory`, creates a demo `Alpha Traders` community, and writes `contracts/deployments/arbitrum-sepolia.json`. |
| `contracts/hardhat.config.ts` | Configures Solidity `0.8.24`, optimizer, Arbitrum Sepolia chain ID `421614`, and RPC env var. |

Current deployment record:

- No `contracts/deployments/arbitrum-sepolia.json` exists right now.
- `NEXT_PUBLIC_SORTS_FACTORY_ADDRESS` and `SORTS_FACTORY_ADDRESS` are empty in example env files.
- So the repo currently has compiled contracts, but no recorded Arbitrum Sepolia deployment address.

Protocol fee invariant:

- `SortsMembership.PROTOCOL_FEE_BPS` is `500`.
- This means 5% of each subscription payment goes to the protocol treasury.
- Do not change this without updating related factory/platform assumptions.

## 7. Environment Variables Needed

Never commit real `.env` files. Never paste private keys into chat.

Root `.env.example` lists the combined variables:

```bash
PRIVATE_KEY=
ARBITRUM_SEPOLIA_RPC=https://sepolia-rollup.arbitrum.io/rpc
ETHERSCAN_API_KEY=

PORT=3001
FRONTEND_URL=http://localhost:3000
DATABASE_PATH=./data/sorts.db
TELEGRAM_BOT_TOKEN=
SORTS_FACTORY_ADDRESS=
PROTOCOL_FEE_BPS=500
IEXEC_PRIVATE_KEY=
IEXEC_SORTS_IAPP_ADDRESS=

NEXT_PUBLIC_ARBITRUM_SEPOLIA_RPC=https://sepolia-rollup.arbitrum.io/rpc
NEXT_PUBLIC_SORTS_FACTORY_ADDRESS=
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_PRIVY_APP_ID=
```

Frontend needs:

```bash
NEXT_PUBLIC_PRIVY_APP_ID=
NEXT_PUBLIC_SORTS_FACTORY_ADDRESS=
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_ARBITRUM_SEPOLIA_RPC=
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=
```

Backend needs:

```bash
PORT=
FRONTEND_URL=
DATABASE_PATH=
TELEGRAM_BOT_TOKEN=
SORTS_FACTORY_ADDRESS=
ARBITRUM_SEPOLIA_RPC=
PRIVATE_KEY=
IEXEC_PRIVATE_KEY=
IEXEC_SORTS_IAPP_ADDRESS=
```

Contracts need:

```bash
PRIVATE_KEY=
ARBITRUM_SEPOLIA_RPC=
ETHERSCAN_API_KEY=
```

Beginner note: variables starting with `NEXT_PUBLIC_` are visible to the browser. Do not put secrets in them.

## 8. External Resources And Where They Come From

| Resource | Where it comes from | Required now or later? | What it is used for |
| --- | --- | --- | --- |
| GitHub repo | Create or connect a repository on [GitHub](https://docs.github.com/articles/create-a-repo). For existing local code, GitHub documents adding local code with `gh repo create`. | Required now | Vercel and Render both work best when connected to a GitHub repo. Also needed for the suggested commit. |
| Privy App ID | Create an app in the [Privy Dashboard](https://docs.privy.io/basics/get-started/dashboard/create-new-app). | Required now | Enables login, embedded wallets, wallet signatures, and wallet transactions. Without it the app runs in demo auth mode and cannot transact. |
| Arbitrum Sepolia RPC | Current code defaults to `https://sepolia-rollup.arbitrum.io/rpc`. Chain ID is `421614`. Chainlist also lists Arbitrum Sepolia network data at [chainid.network/chain/421614](https://chainid.network/chain/421614/). | Required now | Hardhat deploys contracts through it; backend reads membership status/stats; frontend wallet clients should target Arbitrum Sepolia. |
| Arbitrum Sepolia test ETH | Use a faucet such as [ETHGlobal Arbitrum Sepolia Faucet](https://ethglobal.com/faucet/arbitrum-sepolia-421614), or get Sepolia ETH and bridge with the [official Arbitrum bridge](https://bridge.arbitrum.io/). | Required now | Pays gas for deploying `SortsFactory`, creating communities, and subscriber test transactions. |
| Vercel frontend hosting | Deploy the Next.js app with [Vercel Next.js hosting](https://vercel.com/docs/frameworks/nextjs) or Vercel Git integration. | Required now for public demo | Hosts `frontend/`. Needs frontend env vars. |
| Render backend hosting | Deploy Express/Node with [Render Node Express docs](https://render.com/docs/deploy-node-express-app). Configure env vars using [Render environment variables](https://render.com/docs/environment-variables). | Required now for public demo | Hosts `backend/`. Needs backend env vars and persistent SQLite strategy or a managed database decision. |
| Domain/DNS | Use Vercel's custom domain flow or an external registrar/DNS provider. Vercel docs: [custom domain setup](https://vercel.com/docs/domains/set-up-custom-domain). | Later | Nice for production/demo polish. Not required for local or first hosted MVP if using `.vercel.app` and Render URLs. |
| iExec/DataProtector keys | From iExec tooling/docs for [DataProtector](https://docs.iex.ec/tools/dataProtector/dataProtectorCore/getProtectedData) and iApp setup. | Later for full protected content; optional for first MVP | Needed when `protectWithDataProtector` is enabled. Plain gated content can be tested first without these. |
| Telegram bot token | Create via Telegram `@BotFather`. | Required when testing Telegram delivery | Powers the grammy bot. Web app subscription flow can be tested before this. |
| Arbiscan/Etherscan API key | From Arbiscan/Etherscan account. | Later | Contract verification. Deployment can happen before verification. |

## 9. Required Now vs Later

Required now for the MVP flow:

- GitHub repo connected to this code.
- Privy App ID.
- Arbitrum Sepolia RPC URL.
- Funded deployer wallet with Arbitrum Sepolia test ETH.
- Deployed `SortsFactory` address.
- Frontend env vars on Vercel/local.
- Backend env vars on Render/local.
- Hosted backend URL for `NEXT_PUBLIC_API_URL`.

Required soon, but can wait until after basic web app flow works:

- Telegram bot token and end-to-end `/link` challenge testing.
- Persistent production database decision for Render. SQLite can work for early demos only if storage persistence is configured; otherwise data can disappear on redeploy.
- Arbiscan/Etherscan API key for contract verification.

Can wait until later:

- Custom domain and DNS.
- iExec/DataProtector private key and iApp address for protected content encryption/decryption.
- Platform plan billing.

## 10. Exact Next Implementation Step

Do this before deploying the MVP flow:

Fix the creator create flow so `/create` can save the community metadata after the contract transaction succeeds.

The exact bug:

- Frontend default category is `trading` in `frontend/src/app/create/page.tsx`.
- Backend schema only accepts `alpha`, `research`, `education`, `institution`, `protocol`, or `other` in `backend/src/services/community.ts`.
- Result: a creator could successfully deploy a community contract, then the backend metadata save can fail validation. That breaks MVP step 3: "Community deploys or records correctly."

Recommended small fix:

- Change the frontend category value `trading` to `alpha`.
- Change the select option value from `trading` to `alpha`.
- Update landing page CTAs from missing routes (`/studio/create`, `/studio`, `/role`) to real routes (`/create`, `/dashboard`, `/discover`).
- Then test one local create flow against a deployed Arbitrum Sepolia factory.

Do not add subscriber lists, exact tier-owner lists, or wallet/name exposure to Creator Studio while doing this.

## 11. Audit Commands Run

Worked:

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm --filter @sorts/contracts compile
```

Results:

- `pnpm install --frozen-lockfile` worked. Lockfile was up to date.
- `pnpm --filter @sorts/contracts compile` worked. Hardhat reported nothing new to compile.
- `pnpm build` worked. Turbo built all 4 workspaces successfully.

Warnings:

- `pnpm build` showed a frontend warning from MetaMask SDK: `Can't resolve '@react-native-async-storage/async-storage'`. The build still completed successfully. This warning comes through wagmi/Privy dependency imports.

Failed:

```bash
git status --short
```

Reason:

- This folder is not currently a Git repository.

## 12. Missing Resources To Create Manually

Create these manually; do not paste private values into chat:

- GitHub repository for this project, or clone/move this folder into the real Git repo.
- Privy app and `NEXT_PUBLIC_PRIVY_APP_ID`.
- Arbitrum Sepolia deployer wallet with test ETH.
- Production-ready Arbitrum Sepolia RPC URL if you do not want to rely on the public default RPC.
- Deployed `SortsFactory` address on Arbitrum Sepolia.
- Vercel project for `frontend/`.
- Render service for `backend/`.
- Telegram bot token from `@BotFather` when ready to test Telegram delivery.
- Persistent database/storage plan for the backend.
- Optional later: Arbiscan/Etherscan API key, custom domain/DNS, iExec/DataProtector keys and iApp address.

## 13. Suggested Commit

Once this folder is inside a Git repository:

```bash
git add MVP_DEPLOYMENT_PLAN.md
git commit -m "docs: audit SORTS MVP deployment resources"
```
