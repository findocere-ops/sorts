# SORTS - Private Subscription Rails on Solana

SORTS is a Solana-first platform for private paid communities. It helps creators sell recurring access to gated content, Telegram/web spaces, and premium community workflows while keeping subscriber identity and membership state non-leaky.

The current launch target is a Solana devnet MVP for Colosseum/Superteam: Privy for account and wallet orchestration, Umbra Privacy SDK for hidden membership-state experiments, IKA dWallet for programmable multichain wallet capability display, and aggregate-only creator analytics.

## Product Positioning

SORTS is not just "Skool on-chain." The wedge is private subscription rails for paid communities.

Creators get:

- Solana community creation and subscription setup.
- Creator-selected free-preview content.
- Aggregate revenue and active-member stats.
- Telegram/web gated-access workflows.
- No public subscriber wallet list.

Subscribers get:

- Privy-powered login and wallet UX.
- Solana wallet transaction confirmation before payment.
- A two-community preview quota before joining.
- Gated content unlocks through non-leaky membership checks.
- No public member graph exposed by the app.

## Privacy Rules

SORTS must preserve these invariants:

- No public member list.
- No enumerable member registry.
- Creator dashboards show aggregate stats only.
- APIs must not return raw hidden balances, raw private tier encodings, or subscriber wallet lists.
- Experimental privacy layers must be labeled honestly.

Umbra and IKA are treated carefully:

- Umbra is used for Solana hidden membership-state experiments and encrypted-balance-style entitlement checks.
- IKA dWallet is used for programmable signing/capability display and must be labeled pre-alpha where appropriate.
- SORTS must not claim production FHE, production MPC, or full Nox parity unless those systems are actually implemented and verified.

## Architecture

```text
SORTS/
├── frontend/           Next.js 14 app, creator studio, member/join flows
├── backend/            Express API, SQLite, Telegram bot, chain adapters
├── contracts/          Legacy/adapter EVM contracts and Arbitrum USDC work
├── packages/shared/    Chain, wallet, content, and membership interfaces
├── docs/               Colosseum, grant, and launch planning docs
└── Priority.md         10-day Solana launch plan
```

The architecture is adapter-first. Feature modules should call shared interfaces and project services, not raw chain SDKs.

Key planned Solana services:

- `SolanaService`: implements community, subscription, access-check, and aggregate-stat behavior behind `IChainService`.
- `UmbraPrivacyService`: owns Umbra client setup, registration checks, hidden membership-state checks, and encrypted-balance workflows.
- `IkaDWalletService`: owns IKA dWallet status, capability display, and future MessageApproval lifecycle support.
- `PrivyService`: owns authenticated user identity and wallet metadata.

The existing Arbitrum contracts and USDC migration work remain useful as adapter history and implementation reference, but the current product and demo focus is Solana devnet.

## Current Demo Goal

The demo should prove one clean path:

1. Creator creates a Solana private subscription community.
2. Creator marks preview content.
3. Subscriber signs in with Privy.
4. Subscriber chooses a Solana wallet context.
5. Subscriber previews up to two communities.
6. Subscriber joins with wallet transaction confirmation.
7. App checks hidden/non-leaky membership state.
8. Gated content unlocks.
9. Creator sees aggregate stats, not a member wallet list.
10. IKA dWallet capability appears with pre-alpha warnings.

## Quick Start

Prerequisites:

- Node.js 20+
- pnpm 9+
- Local `.env` files created from examples
- Solana devnet wallet context for Phase 2 work

```bash
git clone <repo>
cd SORTS
pnpm install

cp frontend/.env.example frontend/.env.local
cp backend/.env.example backend/.env
cp contracts/.env.example contracts/.env

pnpm dev
```

Useful checks:

```bash
pnpm --filter contracts compile
pnpm --filter contracts test
pnpm --filter @sorts/backend build
pnpm --filter @sorts/frontend build
```

## Environment Notes

Real `.env` files are local only and must never be committed.

Solana Phase 2 variables should be added to env examples as implementation lands. Expected categories:

- Solana devnet RPC and subscriptions endpoints.
- Privy app configuration.
- Umbra network/indexer/relayer configuration.
- IKA dWallet pre-alpha configuration.
- Feature flags for Umbra, IKA, mixer, compliance, real FHE, and real MPC.

Legacy Arbitrum variables still exist for the current EVM adapter and contract work, but they are not the main launch path.

## Key Docs

- [Priority.md](./Priority.md): 10-day Solana Phase 2 launch plan.
- [Colosseum Winner Spec](./docs/COLOSSEUM_WINNER_SPEC.md): judge-facing Solana private subscription rails spec.
- [Superteam Grant Draft](./docs/SUPERTEAM_AGENTIC_ENGINEERING_GRANT.md): Agentic Engineering Grant application draft.
- [Environment Setup](./ENVIRONMENT_SETUP.md): local env guidance and secret-safety rules.
- [Contracts Deployment](./contracts/DEPLOYMENT.md): legacy Arbitrum USDC deployment notes.

## Tech Stack

| Layer | Current / Target |
|---|---|
| Product chain focus | Solana devnet |
| Wallet/auth | Privy |
| Solana privacy | Umbra Privacy SDK |
| Programmable wallet | IKA dWallet |
| Frontend | Next.js 14, Tailwind CSS |
| Backend | Express, grammy, SQLite |
| Shared architecture | Chain Adapter Pattern |
| Legacy contracts | Solidity, Hardhat, Arbitrum Sepolia USDC |

## Safety

- Do not commit `.env` files.
- Do not print secrets or RPC URLs with API keys.
- Do not add member enumeration.
- Do not claim production-grade privacy before implementation proves it.
- Do not let Solana-specific SDK calls leak into generic product modules.

## License

MIT
