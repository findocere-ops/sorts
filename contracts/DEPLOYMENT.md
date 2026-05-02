# SORTS Legacy Arbitrum USDC Deployment Flow

This document covers the legacy/current Arbitrum Sepolia contract adapter. The active product launch focus is Solana devnet private subscription rails, described in `../Priority.md` and `../docs/COLOSSEUM_WINNER_SPEC.md`.

Use this flow only when maintaining or testing the existing Hardhat/Arbitrum contracts. SORTS memberships on Arbitrum Sepolia are paid in USDC, not native ETH. Use a burner wallet and keep all secrets in local `.env` files only.

## 1. Prepare a Burner Wallet

Create a fresh wallet for deployment. Do not use a wallet that holds real funds.

The deployer wallet needs Arbitrum Sepolia ETH for gas. Fund it from a trusted Arbitrum Sepolia faucet before deploying.

Test subscriber wallets need Circle testnet USDC. Use the Circle faucet:

https://faucet.circle.com/

## 2. Configure `contracts/.env`

Create or update `contracts/.env` locally. Never commit it.

Required keys:

```env
PRIVATE_KEY=
ARBITRUM_SEPOLIA_RPC_URL=
```

Optional key:

```env
USDC_ADDRESS=
```

If `USDC_ADDRESS` is not set, the deploy script uses Circle's Arbitrum Sepolia testnet USDC:

```text
0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d
```

Do not print private keys, RPC URLs, or secret values in logs, issues, commits, or screenshots.

## 3. Compile

```bash
pnpm --filter contracts compile
```

## 4. Test

```bash
pnpm --filter contracts test
```

## 5. Deploy

```bash
pnpm --filter contracts deploy:sepolia
```

The deployment writes the Arbitrum Sepolia deployment artifact and prints the new SortsFactory address.

Reminder: this does not deploy the Solana Phase 2 MVP. Solana work belongs behind `SolanaService`, Umbra privacy services, and IKA wallet services.

## 6. Update App Environments

After each redeploy, the old factory address is stale.

Copy the printed factory address into `frontend/.env.local`:

```env
NEXT_PUBLIC_SORTS_FACTORY_ADDRESS=
```

Copy the same factory address into `backend/.env`:

```env
SORTS_FACTORY_ADDRESS=
```

Do not commit `.env` files.

## 7. Restart

Restart the app from the repo root:

```bash
pnpm dev
```

## 8. Verify

Open:

```text
http://localhost:3000/status
```

Then open:

```text
http://localhost:3000/studio/create
```

The status page should show the legacy factory as configured, Arbitrum Sepolia as the expected EVM adapter chain, and backend health if the frontend API URL is configured.

## Safety Rules

- Never commit `.env` files.
- Never print private keys.
- Never print RPC URLs.
- Never deploy from a wallet that holds real funds.
- Never add enumerable member-list reads to contracts or backend APIs.
