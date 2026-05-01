# SORTS — Claude Code Project Instructions

## What this project is
SORTS is a privacy-first community platform built for the iExec Vibe Coding Challenge 2026.
Creators deploy on-chain membership contracts; subscribers get cryptographically-gated content
delivered through a web app and Telegram bot. Individual membership data is never exposed.

## Repository layout
```
SORTS/
├── contracts/          Solidity — SortsMembership (ERC-7984) + SortsFactory
├── backend/            Express API + grammy Telegram bot + SQLite
├── frontend/           Next.js 14 app (App Router, RainbowKit, wagmi)
├── packages/shared/    TypeScript interfaces — IChainService, IContentService, IWalletService
└── turbo.json          Turborepo pipeline
```

## Architecture rules (do NOT violate)

### Chain Adapter Pattern
All chain-specific logic lives behind `IChainService` (packages/shared/src/interfaces).
Feature modules import the interface, never a concrete chain implementation.
Phase 1 = ArbitrumService only. Phase 2 adds SolanaService — never break Phase 1.

### Privacy invariants
- Creators NEVER see individual member wallet addresses or tiers.
- `getAggregateStats()` is the ONLY stats method on SortsMembership.
- Backend never logs wallet ↔ Telegram links beyond what's needed for delivery.

### Protocol fee
`PROTOCOL_FEE_BPS = 500` (5%) is collected at the contract level in `_collectProtocolFee`.
This is the primary on-chain revenue. Do not change the BPS without updating `SortsFactory`.

## Development commands

```bash
# Root — runs all workspaces
pnpm dev           # turbo dev (frontend + backend)
pnpm build         # turbo build

# Frontend only
cd frontend && pnpm dev      # Next.js on :3000

# Backend only
cd backend && pnpm dev       # ts-node-dev on :3001

# Contracts
cd contracts && pnpm compile
cd contracts && pnpm deploy:local
cd contracts && pnpm deploy:sepolia
```

## Environment variables

Copy `.env.example` to `.env` in each workspace and fill in:
- `NEXT_PUBLIC_FACTORY_ADDRESS` — deployed SortsFactory address
- `NEXT_PUBLIC_API_URL` — backend URL
- `TELEGRAM_BOT_TOKEN` — grammy bot token
- `DATABASE_URL` — path to SQLite file (default `./data/sorts.db`)
- `PRIVATE_KEY` — deployer wallet private key (contracts only, never commit)

## Design system
All visual tokens are CSS custom properties in `frontend/src/styles/globals.css`.
Never use hardcoded hex colors in components — always use `var(--token-name)`.
Font stack: DM Sans (body), DM Mono (data/code). Loaded from Google Fonts.

## Testing
- Contracts: `cd contracts && pnpm test` (Hardhat + chai)
- Backend: `cd backend && pnpm test` (jest)
- Frontend: `cd frontend && pnpm test` (vitest)

## Key files
- `contracts/contracts/SortsMembership.sol` — ERC-7984 membership token, non-transferable
- `contracts/contracts/SortsFactory.sol` — deploys memberships, acts as protocol treasury
- `frontend/src/lib/constants.ts` — PLATFORM_PLANS revenue tiers
- `packages/shared/src/interfaces/IChainService.ts` — canonical chain interface
