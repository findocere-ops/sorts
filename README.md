# SORTS — Privacy-First Community Platform

**iExec Vibe Coding Challenge 2026 submission**

SORTS lets creators deploy private membership communities on Arbitrum Sepolia. Subscribers get gated content through a web app and Telegram bot. Phase 1 uses ERC-7984-shaped membership commitments for on-chain tiers and iExec DataProtector for protected content.

---

## What makes SORTS different

| Platform | Creator sees member list | Creator sees tier breakdown | Creator sees wallet addresses |
|---|---|---|---|
| Substack, Patreon, etc. | ✓ | ✓ | ✓ |
| **SORTS** | ✗ | ✗ | ✗ |

Membership tiers are encoded as keccak256 commitments on-chain through an ERC-7984-shaped interface. Access checks return pass/fail only, and the public API never returns post bodies until wallet proof and on-chain tier checks pass.

---

## Architecture

```
┌──────────────────────────────────────────────────────┐
│  Next.js 14 frontend (Privy + wagmi + viem)           │
│  ↕ wagmi write  ↕ REST API                            │
├──────────────┬───────────────────────────────────────┤
│ Arbitrum     │  Express backend + grammy Telegram bot │
│ Sepolia      │  SQLite metadata + iExec protected data │
│ SortsFactory │                                        │
│ SortsMembership (ERC-7984, per community)             │
└──────────────────────────────────────────────────────┘
```

**Chain Adapter Pattern** — all blockchain calls go through `IChainService`. Phase 2 can add a `SolanaService` without changing feature services.

**Privacy boundary:** Phase 1 is an Arbitrum Sepolia membership contract plus iExec DataProtector protected content. Do not describe it as a full NOX confidential-token deployment until a true NOX/confidential pointer implementation is wired in.

---

## Revenue model

| Layer | Mechanism | Margin |
|---|---|---|
| Protocol fee | 5% of every subscription, collected on-chain | ~99% (gas < $0.01) |
| Platform plans | Free / Builder ($49) / Scale ($149) / Enterprise | >80% |

Combined projected margin: **>50%** from first paying customer.

---

## Deployed contracts (Arbitrum Sepolia)

| Contract | Address |
|---|---|
| SortsFactory | `TBD — run pnpm deploy:sepolia` |
| Demo: Alpha Traders | `TBD` |

---

## Quick start

### Prerequisites
- Node.js 20+
- pnpm 9+
- A wallet funded with Arbitrum Sepolia ETH

```bash
git clone <repo>
cd SORTS
pnpm install

# Copy and fill environment files
cp frontend/.env.example frontend/.env.local
cp backend/.env.example backend/.env
cp contracts/.env.example contracts/.env

# Deploy contracts
cd contracts
pnpm compile
pnpm deploy:sepolia        # writes to deployments/arbitrum-sepolia.json

# Run dev servers
cd ..
pnpm dev                   # starts frontend (:3000) + backend (:3001)
```

### Environment variables

**frontend/.env.local**
```
NEXT_PUBLIC_PRIVY_APP_ID=clxxxxxxxxxxxxxxxx   # From privy.io dashboard
NEXT_PUBLIC_SORTS_FACTORY_ADDRESS=0x...
NEXT_PUBLIC_API_URL=http://localhost:3001
```

**backend/.env**
```
TELEGRAM_BOT_TOKEN=...                        # From @BotFather
DATABASE_PATH=./data/sorts.db
FRONTEND_URL=http://localhost:3000
PORT=3001
SORTS_FACTORY_ADDRESS=0x...
ARBITRUM_SEPOLIA_RPC=https://sepolia-rollup.arbitrum.io/rpc
IEXEC_PRIVATE_KEY=0x...                       # Used by DataProtector; can differ from deployer
IEXEC_SORTS_IAPP_ADDRESS=0x...                # iExec app that processes protected content
```

**contracts/.env**
```
PRIVATE_KEY=0x...
ARBITRUM_SEPOLIA_RPC=https://sepolia-rollup.arbitrum.io/rpc
```

---

## Flows

### Creator flow
1. Connect wallet → `/create` → fill name/symbol/tiers → deploy via SortsFactory
2. Manage content at `/dashboard/:communityId`; protected posts require iExec env vars
3. Share `/join/:communityId` link

### Member flow
1. Discover at `/discover` → `/join/:communityId` → select tier → subscribe (on-chain payment)
2. Access gated feed at `/community/:communityId`; post bodies require wallet signature and on-chain tier verification
3. Link Telegram via `/link?code=...&tg=...` → receive posts in DM

---

## Tech stack

| Layer | Choice |
|---|---|
| Smart contracts | Solidity 0.8.24, Hardhat |
| Blockchain | Arbitrum Sepolia (Phase 1) |
| Token standard | ERC-7984-shaped commitment interface |
| Content privacy | iExec DataProtector |
| Frontend | Next.js 14, Tailwind CSS, Privy, wagmi, viem |
| Backend | Express, grammy, better-sqlite3, ts-node |
| Monorepo | Turborepo, pnpm workspaces |

---

## License

MIT
