# SORTS Environment Setup

This guide explains which local environment files SORTS uses and how to configure the Solana-first MVP safely.

Important rule: never paste private keys, seed phrases, `.env` contents, RPC URLs with API keys, or secret files into chat. Put real values only in local `.env` files or hosting dashboards.

## Environment Files

SORTS has three app workspaces:

| App | Example file committed to Git | Real local file | Purpose |
|---|---|---|---|
| Frontend | `frontend/.env.example` | `frontend/.env.local` | Browser app, Privy, API URL, public chain flags |
| Backend | `backend/.env.example` | `backend/.env` | Express API, chain reads, wallet/privacy service config |
| Contracts | `contracts/.env.example` | `contracts/.env` | Legacy Arbitrum/Hardhat deployment |

Create local files:

```bash
cp frontend/.env.example frontend/.env.local
cp backend/.env.example backend/.env
cp contracts/.env.example contracts/.env
```

Do not commit the real files.

## Solana-First MVP Variables

The current product direction is Solana devnet. Add these as the Solana implementation lands.

### Frontend

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_PRIVY_APP_ID=
NEXT_PUBLIC_DEFAULT_CHAIN=solana-devnet
NEXT_PUBLIC_SOLANA_CLUSTER=devnet
NEXT_PUBLIC_ENABLE_UMBRA=true
NEXT_PUBLIC_ENABLE_UMBRA_MIXER=false
```

| Variable | Purpose | Public or secret? |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API URL. | Public |
| `NEXT_PUBLIC_PRIVY_APP_ID` | Privy app ID. | Public |
| `NEXT_PUBLIC_DEFAULT_CHAIN` | Default app chain context. | Public |
| `NEXT_PUBLIC_SOLANA_CLUSTER` | Solana cluster label, usually `devnet` for MVP. | Public |
| `NEXT_PUBLIC_ENABLE_UMBRA` | Enables Umbra UI paths. | Public |
| `NEXT_PUBLIC_ENABLE_UMBRA_MIXER` | Enables mixer UI paths. Keep false for MVP unless explicitly testing. | Public |

Beginner note: `NEXT_PUBLIC_` values are visible in the browser. Never put a private key or secret token in them.

### Backend

```bash
PORT=3001
FRONTEND_URL=http://localhost:3000
DATABASE_PATH=./data/sorts.db

PRIVY_APP_ID=
PRIVY_APP_SECRET=

SOLANA_RPC_URL=
SOLANA_RPC_SUBSCRIPTIONS_URL=

UMBRA_NETWORK=devnet
UMBRA_INDEXER_API_ENDPOINT=
UMBRA_RELAYER_API_ENDPOINT=
UMBRA_PROGRAM_ID=
UMBRA_ENABLE_MIXER=false
UMBRA_ENABLE_COMPLIANCE=true
UMBRA_ENABLE_SECURE_SEED_PERSISTENCE=false

IKA_DWALLET_PROGRAM_ID=
IKA_GRPC_URL=
SORTS_DWALLET_PROGRAM_ID=
IKA_PRE_ALPHA_MODE=true
ENABLE_IKA_REAL_FUNDS=false

ENABLE_SOLANA_PHASE2=true
ENABLE_UMBRA_ENCRYPTED_BALANCES=true
ENABLE_REAL_FHE=false
ENABLE_REAL_MPC_SIGNING=false
```

| Variable | Purpose | Public or secret? |
|---|---|---|
| `PORT` | Local backend port. | Public |
| `FRONTEND_URL` | Allowed frontend origin. | Public |
| `DATABASE_PATH` | SQLite database path. | Local config |
| `PRIVY_APP_ID` | Backend Privy app reference. | Secret-ish |
| `PRIVY_APP_SECRET` | Privy server secret. | Secret |
| `SOLANA_RPC_URL` | Server-side Solana RPC endpoint. | Secret-ish if API-keyed |
| `SOLANA_RPC_SUBSCRIPTIONS_URL` | Server-side Solana websocket/subscription endpoint. | Secret-ish if API-keyed |
| `UMBRA_*` | Umbra devnet service configuration. | Treat URLs as secret-ish if API-keyed |
| `IKA_*` | IKA pre-alpha dWallet configuration. | Treat service URLs as secret-ish if API-keyed |
| `ENABLE_REAL_FHE` | Must stay false until real FHE is verified. | Public flag |
| `ENABLE_REAL_MPC_SIGNING` | Must stay false until real MPC is verified. | Public flag |

## Privy Setup

Privy powers account auth, embedded wallets, external wallet connections, and wallet transaction prompts.

1. Open the Privy dashboard.
2. Create or select the SORTS app.
3. Enable the login methods needed for the demo.
4. Enable Solana wallet support if available in your Privy configuration.
5. Copy the public app ID to `frontend/.env.local`.
6. Put backend Privy secrets only in `backend/.env` or hosting secrets.

Privy is not the privacy protocol. Do not describe Privy as hiding balances, tiers, or content.

## Solana Devnet Setup

For the 10-day MVP:

- Use Solana devnet.
- Use a devnet wallet with no real funds.
- Keep mainnet disabled.
- Keep IKA real-funds paths disabled.
- Make devnet/pre-alpha labels visible in the UI.

Add Solana RPC values only to local env files or hosting dashboards. Do not commit provider URLs if they contain API keys.

## Umbra Setup

Umbra is the planned Solana hidden membership-state layer.

Use Umbra for:

- registration status,
- hidden/encrypted balance membership state,
- private entitlement checks,
- optional user-initiated compliance grants.

Do not use Umbra as:

- a full Nox-equivalent confidential smart-contract runtime,
- direct content encryption,
- a reason to expose raw hidden balances in APIs.

Keep `UMBRA_ENABLE_MIXER=false` for the MVP unless the base demo is stable and mixer/UTXO flow is explicitly tested.

Master seed handling is sensitive. Do not log seeds, persist them casually, or alter the derivation message.

## IKA dWallet Setup

IKA is the planned programmable multichain signing/capability layer.

Use IKA for:

- dWallet status,
- capability display,
- future MessageApproval lifecycle,
- future program-controlled signing flows.

For the MVP:

- keep `IKA_PRE_ALPHA_MODE=true`,
- keep `ENABLE_IKA_REAL_FUNDS=false`,
- label IKA as pre-alpha in UI/docs,
- do not claim production MPC.

## Legacy Arbitrum Adapter Variables

The repo still contains Arbitrum Sepolia/Hardhat work. Keep this working, but treat it as adapter/reference work instead of the primary Solana launch path.

Frontend legacy values:

```bash
NEXT_PUBLIC_CHAIN_ID=421614
NEXT_PUBLIC_ARBITRUM_SEPOLIA_RPC_URL=
NEXT_PUBLIC_SORTS_FACTORY_ADDRESS=
```

Backend legacy values:

```bash
ARBITRUM_SEPOLIA_RPC_URL=
SORTS_FACTORY_ADDRESS=
IEXEC_PRIVATE_KEY=
IEXEC_SORTS_IAPP_ADDRESS=
```

Contracts legacy values:

```bash
PRIVATE_KEY=
ARBITRUM_SEPOLIA_RPC_URL=
ARBISCAN_API_KEY=
USDC_ADDRESS=
```

Only use these when working on the existing Arbitrum adapter, USDC contracts, or iExec/DataProtector experiments.

## Public vs Secret Values

Public values:

- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_PRIVY_APP_ID`
- `NEXT_PUBLIC_DEFAULT_CHAIN`
- `NEXT_PUBLIC_SOLANA_CLUSTER`
- feature flags exposed to the browser
- public program or contract addresses

Secret values:

- private keys,
- seed phrases,
- Secret Recovery Phrases,
- `PRIVY_APP_SECRET`,
- IKA/Umbra credentials if any are issued,
- any `.env` file containing real values.

Secret-ish values:

- RPC URLs with provider API keys,
- indexer URLs with API keys,
- relayer URLs with API keys,
- explorer API keys.

Secret-ish values might not move funds by themselves, but they can expose provider usage, quotas, or account analytics. Do not commit them.

## Never Commit These

Never commit:

- `frontend/.env.local`
- `backend/.env`
- `contracts/.env`
- any `.env` or `.env.*` file with real values
- private keys
- seed phrases
- Secret Recovery Phrases
- Privy secrets
- provider RPC URLs with API keys
- files in `secrets/`
- files ending in `.key`, `.pem`, `.p12`, `.pfx`, or `.secret`

## Quick Local Checklist

1. Create `frontend/.env.local` from `frontend/.env.example`.
2. Create `backend/.env` from `backend/.env.example`.
3. Create `contracts/.env` from `contracts/.env.example` only if working on legacy contracts.
4. Add Privy app values.
5. Add Solana devnet RPC values.
6. Add Umbra devnet values when implementing Umbra flows.
7. Add IKA pre-alpha values when implementing IKA flows.
8. Keep real-funds and real-MPC flags disabled.
9. Run `pnpm dev`.
10. Verify no real env file is staged before committing.

## Verification Commands

```bash
pnpm --filter contracts compile
pnpm --filter contracts test
pnpm --filter @sorts/backend build
pnpm --filter @sorts/frontend build
```
