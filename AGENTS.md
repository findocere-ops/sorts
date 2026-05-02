# SORTS - Codex Project Instructions

## What this project is

SORTS is a Solana-first private subscription rails platform for paid communities.

Creators launch private subscription communities, mark preview content, and see aggregate-only revenue/member stats. Subscribers join through wallet-confirmed Solana flows and unlock gated content without exposing a public member graph.

Current launch focus:

- Solana devnet MVP for Colosseum/Superteam.
- Privy for account auth and wallet orchestration.
- Umbra Privacy SDK for hidden membership-state experiments.
- IKA dWallet for programmable multichain wallet capability display.
- Telegram/web gated access.
- No public member list, no enumerable member registry, and no raw hidden membership data in API responses.

Existing Arbitrum/Hardhat work remains as legacy adapter/reference work. Do not break it, but do not treat it as the primary product direction.

## Repository layout

```text
SORTS/
├── contracts/          Legacy/adapter Solidity work - SortsMembership + SortsFactory
├── backend/            Express API + grammy Telegram bot + SQLite + chain services
├── frontend/           Next.js 14 app - App Router, Privy, wagmi, Solana-ready UX
├── packages/shared/    TypeScript interfaces - IChainService, IContentService, IWalletService
├── docs/               Colosseum, grant, and launch specs
└── turbo.json          Turborepo pipeline
```

## Architecture rules

### Chain Adapter Pattern

All chain-specific logic lives behind shared interfaces.

- Feature modules import interfaces/services, never concrete chain implementations directly.
- Arbitrum behavior stays behind `ArbitrumService`.
- Solana behavior must be added behind `SolanaService`.
- Umbra and IKA calls must be isolated behind backend services or project hooks.
- Frontend pages must not call raw Umbra, IKA, or Solana SDKs directly.

### Solana-first launch posture

- Current demo chain: Solana devnet.
- Use feature flags for pre-alpha and experimental systems.
- Do not claim production FHE, production MPC, or mainnet privacy guarantees.
- Umbra is a hidden membership-state / encrypted-balance style layer, not full Nox parity.
- IKA dWallet is programmable wallet capability and signing infrastructure, not a replacement for Privy.
- IKA real-funds flows must stay disabled unless explicitly approved.

### Privacy invariants

- Creators never see individual member wallet addresses or tier lists.
- No public member list.
- No enumerable member registry.
- Creator analytics are aggregate-only.
- Backend never returns raw hidden balances, raw private tier encodings, or subscriber wallet lists.
- Single-user/single-address access checks are allowed when needed for entitlement.
- Backend never logs wallet to Telegram links beyond what is required for delivery.

### Protocol fee

Existing Arbitrum contracts use `PROTOCOL_FEE_BPS = 500` (5%). Do not change it casually. If Solana fee logic is added, document whether it matches or intentionally differs from the EVM adapter.

## Development commands

```bash
# Root - runs all workspaces
pnpm dev
pnpm build

# Frontend only
cd frontend && pnpm dev

# Backend only
cd backend && pnpm dev

# Contracts
cd contracts && pnpm compile
cd contracts && pnpm deploy:local
cd contracts && pnpm deploy:sepolia
```

## Environment variables

Copy `.env.example` to local env files and fill them in locally only:

- `frontend/.env.local`
- `backend/.env`
- `contracts/.env`

Never commit real env files.

Solana Phase 2 env categories:

- Solana devnet RPC/subscription endpoint.
- Privy app configuration.
- Umbra devnet/indexer/relayer configuration.
- IKA dWallet pre-alpha configuration.
- Feature flags for Solana, Umbra, IKA, mixer, compliance, real FHE, and real MPC.

Legacy Arbitrum env categories:

- `NEXT_PUBLIC_SORTS_FACTORY_ADDRESS`
- `SORTS_FACTORY_ADDRESS`
- `PRIVATE_KEY`
- `ARBITRUM_SEPOLIA_RPC_URL`
- `IEXEC_PRIVATE_KEY`
- `IEXEC_SORTS_IAPP_ADDRESS`

## Design system

All visual tokens are CSS custom properties in `frontend/src/styles/globals.css`.

- Use existing SORTS tokens.
- Do not hardcode random hex colors in components.
- Preserve the dark, premium, privacy-first visual identity.
- Avoid broad redesigns unless explicitly requested.

## Testing

- Contracts: `cd contracts && pnpm test`
- Backend: `cd backend && pnpm test`
- Frontend: `cd frontend && pnpm test`

For full verification:

```bash
pnpm --filter contracts compile
pnpm --filter contracts test
pnpm --filter @sorts/backend build
pnpm --filter @sorts/frontend build
```

## Key files

- `Priority.md` - Solana Phase 2 launch plan.
- `docs/COLOSSEUM_WINNER_SPEC.md` - judge-facing Solana private subscription rails spec.
- `docs/SUPERTEAM_AGENTIC_ENGINEERING_GRANT.md` - grant application draft.
- `packages/shared/src/interfaces/IChainService.ts` - canonical chain interface.
- `packages/shared/src/interfaces/IWalletService.ts` - canonical wallet interface.
- `backend/src/services/chain/ArbitrumService.ts` - legacy/current EVM adapter.
- `backend/src/services/chain/SolanaService.ts` - target Solana adapter.
- `frontend/src/styles/globals.css` - SORTS design tokens.
