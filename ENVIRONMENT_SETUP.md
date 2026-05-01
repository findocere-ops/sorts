# SORTS Environment Setup

This guide explains where every key goes and which values must stay private.

Important rule: never paste private keys, seed phrases, `.env` contents, or secret files into chat. Put them only in local `.env` files or hosting dashboards.

## The Three Env Files

SORTS has three separate apps, so it has three separate env files.

| App | Example file committed to Git | Real local file you create | Purpose |
| --- | --- | --- | --- |
| Frontend | `frontend/.env.example` | `frontend/.env.local` | Browser app, wallet login, API URL, public contract address |
| Backend | `backend/.env.example` | `backend/.env` | Express API, chain reads, iExec/DataProtector |
| Contracts | `contracts/.env.example` | `contracts/.env` | Hardhat contract deployment |

To create the real local files:

```bash
cp frontend/.env.example frontend/.env.local
cp backend/.env.example backend/.env
cp contracts/.env.example contracts/.env
```

Then open each real file and fill in the blank values. Do not commit the real files.

## Frontend Variables

Put these in `frontend/.env.local` locally and in Vercel for the hosted frontend.

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_CHAIN_ID=421614
NEXT_PUBLIC_ARBITRUM_SEPOLIA_RPC_URL=
NEXT_PUBLIC_SORTS_FACTORY_ADDRESS=
NEXT_PUBLIC_PRIVY_APP_ID=
```

What each one means:

| Variable | What to put there | Public or secret? |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | Local: `http://localhost:3001`. Hosted: your Render backend URL, such as `https://your-service.onrender.com`. | Public |
| `NEXT_PUBLIC_CHAIN_ID` | `421614` for Arbitrum Sepolia. | Public |
| `NEXT_PUBLIC_ARBITRUM_SEPOLIA_RPC_URL` | Your Arbitrum Sepolia RPC URL. You can leave blank locally to use wallet/default behavior, but a real URL is better for hosted demos. | Public to browser, but do not commit if it contains a provider API key |
| `NEXT_PUBLIC_SORTS_FACTORY_ADDRESS` | The deployed `SortsFactory` contract address after deployment. | Public |
| `NEXT_PUBLIC_PRIVY_APP_ID` | Your Privy App ID from the Privy dashboard. | Public |

Beginner note: `NEXT_PUBLIC_` means "this value is allowed to be visible in the browser." Never put a private key in a `NEXT_PUBLIC_` variable.

## Backend Variables

Put these in `backend/.env` locally and in Render for the hosted backend.

```bash
PORT=3001
FRONTEND_URL=http://localhost:3000
ARBITRUM_SEPOLIA_RPC_URL=
SORTS_FACTORY_ADDRESS=
IEXEC_PRIVATE_KEY=
IEXEC_SORTS_IAPP_ADDRESS=
```

What each one means:

| Variable | What to put there | Public or secret? |
| --- | --- | --- |
| `PORT` | Local backend port. Use `3001` locally. On Render, Render may provide its own port. | Public |
| `FRONTEND_URL` | Local: `http://localhost:3000`. Hosted: your Vercel frontend URL. | Public |
| `ARBITRUM_SEPOLIA_RPC_URL` | Server-side Arbitrum Sepolia RPC URL. | Secret-ish if it contains an API key. Do not commit. |
| `SORTS_FACTORY_ADDRESS` | The deployed `SortsFactory` contract address. | Public |
| `IEXEC_PRIVATE_KEY` | Backend operator wallet private key for iExec/DataProtector actions. | Secret. Never commit. |
| `IEXEC_SORTS_IAPP_ADDRESS` | Address of the iExec app authorized to process protected SORTS content. | Public address, but still keep it in env for easy configuration. |

The backend can also use other optional values later, such as `TELEGRAM_BOT_TOKEN` and `DATABASE_PATH`. The minimal MVP environment above is focused on the requested web and iExec setup.

## Contracts Variables

Put these in `contracts/.env` locally. You usually do not put these in Vercel or Render.

```bash
PRIVATE_KEY=
ARBITRUM_SEPOLIA_RPC_URL=
ARBISCAN_API_KEY=
```

What each one means:

| Variable | What to put there | Public or secret? |
| --- | --- | --- |
| `PRIVATE_KEY` | Private key for the burner deployer wallet that deploys contracts. | Secret. Never commit. |
| `ARBITRUM_SEPOLIA_RPC_URL` | Arbitrum Sepolia RPC URL used by Hardhat. | Secret-ish if it contains an API key. Do not commit. |
| `ARBISCAN_API_KEY` | Arbiscan API key for contract verification. | Secret-ish. Do not commit. |

## Create A Burner MetaMask Wallet

A burner wallet is a wallet used only for testing and deploying testnet contracts. It should not hold real money.

Recommended safest beginner approach:

1. Install MetaMask only from the official MetaMask site or official browser extension store. MetaMask's help center warns not to download it from random sites: [MetaMask getting started](https://support.metamask.io/start/getting-started-with-metamask/).
2. Use a separate browser profile just for SORTS testing.
3. Create a brand-new MetaMask wallet in that profile.
4. Save the Secret Recovery Phrase somewhere safe and offline.
5. Do not reuse your main wallet.
6. Do not put real ETH or valuable assets in this wallet.
7. Export the private key only for the test deployer account, then paste it into `contracts/.env` as `PRIVATE_KEY=...`.

MetaMask also supports adding extra accounts inside an existing wallet, but for a true burner setup, a separate browser profile and separate wallet is cleaner. MetaMask's account guide is here: [How to add accounts in MetaMask](https://support.metamask.io/configure/accounts/how-to-add-accounts-in-your-wallet/).

## Get Arbitrum Sepolia Test ETH

You need Arbitrum Sepolia test ETH to pay testnet gas. It has no real-money value, but it is required for transactions.

Options:

- Use an Arbitrum Sepolia faucet, such as [Alchemy's Arbitrum Sepolia faucet](https://www.alchemy.com/faucets/arbitrum-sepolia) or [ETHGlobal's Arbitrum Sepolia faucet](https://ethglobal.com/faucet/arbitrum-sepolia-421614).
- If you have Ethereum Sepolia ETH, bridge it to Arbitrum Sepolia with the [official Arbitrum bridge](https://bridge.arbitrum.io/).

Send the test ETH to your burner deployer wallet address.

## Get An Arbitrum Sepolia RPC URL

An RPC URL is the endpoint your app uses to talk to the blockchain.

Options:

- Create a free Alchemy app for Arbitrum Sepolia. Alchemy lists the format as `https://arb-sepolia.g.alchemy.com/v2/<api-key>` on its [Arbitrum Sepolia RPC page](https://www.alchemy.com/rpc/arbitrum-sepolia).
- Create a QuickNode Arbitrum Sepolia endpoint. QuickNode lists Arbitrum Sepolia as chain ID `421614` in its [Arbitrum docs](https://www.quicknode.com/docs/arbitrum/api-overview).
- For local experiments, the code falls back to the public RPC `https://sepolia-rollup.arbitrum.io/rpc`, but a provider URL is more reliable for demos.

Put the RPC URL in:

- `frontend/.env.local` as `NEXT_PUBLIC_ARBITRUM_SEPOLIA_RPC_URL=...`
- `backend/.env` as `ARBITRUM_SEPOLIA_RPC_URL=...`
- `contracts/.env` as `ARBITRUM_SEPOLIA_RPC_URL=...`

## Get A Privy App ID

Privy powers login, embedded wallets, wallet signatures, and wallet transactions.

Steps:

1. Go to the [Privy dashboard](https://dashboard.privy.io/).
2. Create a new Privy app. Privy's docs cover this flow here: [Create a Privy app](https://docs.privy.io/basics/get-started/dashboard/create-new-app).
3. Copy the App ID.
4. Put it in `frontend/.env.local` as `NEXT_PUBLIC_PRIVY_APP_ID=...`.
5. Add the same value to Vercel for the frontend deployment.

The Privy App ID is public. It is okay that browser code can see it. It is still better not to hardcode it in source files.

## Add Env Vars In Vercel

Use Vercel for the frontend.

Steps:

1. Open your project in the [Vercel dashboard](https://vercel.com/dashboard).
2. Go to the project.
3. Click `Settings`.
4. Click `Environment Variables`.
5. Add every variable from `frontend/.env.example`.
6. Use your Render backend URL for `NEXT_PUBLIC_API_URL` after the backend is deployed.
7. Redeploy after changing env vars.

Vercel's docs say project environment variables are configured in Project Settings: [Vercel environment variables](https://vercel.com/docs/projects/environment-variables).

## Add Env Vars In Render

Use Render for the backend.

Steps:

1. Open your service in the [Render dashboard](https://dashboard.render.com/).
2. Click your backend service.
3. Click `Environment` in the left menu.
4. Under `Environment Variables`, click `Add Environment Variable`.
5. Add every variable from `backend/.env.example`.
6. Save and redeploy.

Render's docs describe this flow here: [Render environment variables and secrets](https://render.com/docs/configure-environment-variables).

## What iExec Keys Are For

SORTS can publish normal gated content first. iExec/DataProtector is for stronger protected content later.

In plain language:

- `IEXEC_PRIVATE_KEY` lets the backend operator perform iExec/DataProtector actions.
- `IEXEC_SORTS_IAPP_ADDRESS` identifies the iExec app allowed to process protected content.
- These are used when posts are protected with DataProtector instead of stored as plain backend content.

For the first web MVP, you can leave iExec values blank if you are not testing DataProtector-protected posts yet. Do not enable protected-post flows until these values are configured.

iExec DataProtector docs are here: [iExec DataProtector](https://docs.iex.ec/tools/dataProtector/dataProtectorCore/getProtectedData).

## Public vs Secret Values

Public values:

- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_CHAIN_ID`
- `NEXT_PUBLIC_SORTS_FACTORY_ADDRESS`
- `NEXT_PUBLIC_PRIVY_APP_ID`
- `PORT`
- `FRONTEND_URL`
- `SORTS_FACTORY_ADDRESS`
- `IEXEC_SORTS_IAPP_ADDRESS`

Secret values:

- `PRIVATE_KEY`
- `IEXEC_PRIVATE_KEY`
- Seed phrases and Secret Recovery Phrases
- Any `.env` file containing real values
- Any secret file containing keys

Secret-ish values:

- `ARBITRUM_SEPOLIA_RPC_URL`
- `NEXT_PUBLIC_ARBITRUM_SEPOLIA_RPC_URL`
- `ARBISCAN_API_KEY`

Secret-ish means the value might not move funds by itself, but it can expose paid provider usage, rate limits, analytics, or account quotas. Do not commit these values.

## Never Commit These

Never commit:

- `frontend/.env.local`
- `backend/.env`
- `contracts/.env`
- Any `.env` or `.env.*` file with real values
- Private keys
- Seed phrases
- Secret Recovery Phrases
- iExec private keys
- Arbiscan API keys
- RPC URLs that contain provider API keys
- Files in `secrets/`
- Files ending in `.key`, `.pem`, `.p12`, `.pfx`, or `.secret`

The repo `.gitignore` is configured to ignore these secret files while allowing `.env.example` files to be committed.

## Quick Local Checklist

1. Create `frontend/.env.local` from `frontend/.env.example`.
2. Create `backend/.env` from `backend/.env.example`.
3. Create `contracts/.env` from `contracts/.env.example`.
4. Create a burner MetaMask wallet.
5. Fund it with Arbitrum Sepolia test ETH.
6. Add the burner private key only to `contracts/.env`.
7. Add your RPC URL to all three env files.
8. Add your Privy App ID to `frontend/.env.local`.
9. Deploy contracts.
10. Put the deployed `SortsFactory` address in frontend and backend env files.

After that, the app can be tested without exposing secrets in Git.
