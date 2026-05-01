# SORTS Deployment Guide (Arbitrum Sepolia)

This guide walks you through deploying the `SortsFactory` contract to the Arbitrum Sepolia testnet and securely wiring the deployed address into the SORTS frontend and backend.

## 1. Environment Setup

You need to provide a burner wallet with some Arbitrum Sepolia ETH to pay for gas fees. **Never use your main mainnet wallet for testnet deployments.**

1. Create a new file named `.env` inside the `contracts/` directory:
   \`\`\`bash
   touch contracts/.env
   \`\`\`
   *(Note: This file is already ignored by Git, so your secrets are safe).*

2. Open `contracts/.env` and add the following variables:
   \`\`\`env
   PRIVATE_KEY=your_burner_wallet_private_key_without_0x_prefix
   ARBITRUM_SEPOLIA_RPC_URL=https://sepolia-rollup.arbitrum.io/rpc
   \`\`\`
   *(Optional)* If you want to verify the contract source code on Arbiscan automatically, you can also add:
   \`\`\`env
   ARBISCAN_API_KEY=your_arbiscan_api_key
   \`\`\`

3. Ensure the wallet associated with `PRIVATE_KEY` has Arbitrum Sepolia ETH. You can get testnet ETH from faucets like [Alchemy Faucet](https://www.alchemy.com/faucets/arbitrum-sepolia) or [QuickNode Faucet](https://faucet.quicknode.com/arbitrum/sepolia).

## 2. Deploy the Contract

Run the following command from the root of the SORTS repository:

\`\`\`bash
pnpm --filter contracts compile
pnpm --filter contracts deploy:sepolia
\`\`\`

If successful, the script will output the deployed **SortsFactory address** and save a detailed JSON file to `contracts/deployments/arbitrum-sepolia.json`.

## 3. Sync Environment Variables (Frontend & Backend)

Once the contract is deployed, you **must** inform the frontend and backend about the new factory address so the MVP apps can interact with it.

### Frontend
Open or create `frontend/.env.local` and add/update the following:
\`\`\`env
NEXT_PUBLIC_SORTS_FACTORY_ADDRESS=<Paste deployed SortsFactory address here>
NEXT_PUBLIC_CHAIN_ID=421614
NEXT_PUBLIC_ARBITRUM_SEPOLIA_RPC_URL=https://sepolia-rollup.arbitrum.io/rpc
\`\`\`

### Backend
Open or create `backend/.env` and add/update the following:
\`\`\`env
SORTS_FACTORY_ADDRESS=<Paste deployed SortsFactory address here>
ARBITRUM_SEPOLIA_RPC_URL=https://sepolia-rollup.arbitrum.io/rpc
\`\`\`

## 4. Verify Frontend State

Once the environment variables are securely synced, ensure the frontend hot-reloads (or restart it with `pnpm dev`). 

Navigate to `http://localhost:3000/studio/create` (or your active frontend URL). The "SortsFactory is not configured" error screen should disappear, and you should now see the Create Community wizard or the transaction-ready state.
