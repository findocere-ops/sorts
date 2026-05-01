# Beginner's Guide: Deploying SORTS to Arbitrum Sepolia

Welcome! You don't need to know how to code to do this. We just need to give the system a "burner wallet" (a temporary crypto wallet that only holds test money) so it can pay the fake fees required to deploy the contract to the Arbitrum Sepolia test network.

Follow these steps exactly:

## Step 1: Create a Burner Wallet
If you don't have one, create a brand new wallet in MetaMask. **Do not use a wallet that holds real money.**
1. Open your MetaMask extension.
2. Go to Account Settings -> Account Details -> **Export Private Key**.
3. Copy this long string of characters.

## Step 2: Get Free Test Money
Your burner wallet needs "Arbitrum Sepolia ETH" to pay for the deployment.
1. Go to the [Alchemy Arbitrum Sepolia Faucet](https://www.alchemy.com/faucets/arbitrum-sepolia) or [QuickNode Faucet](https://faucet.quicknode.com/arbitrum/sepolia).
2. Paste your burner wallet's public address (starts with `0x`) and request funds.

## Step 3: Tell the System Your Keys
We need to save your private key in a hidden file so the deploy script can use it. **This file is completely ignored by version control, so it will never be uploaded to GitHub.**

1. Inside your code editor, go into the `contracts` folder.
2. Create a brand new file and name it exactly `.env` (don't forget the dot!).
3. Paste the following text inside it:

\`\`\`env
PRIVATE_KEY=paste_your_private_key_here
ARBITRUM_SEPOLIA_RPC_URL=https://sepolia-rollup.arbitrum.io/rpc
\`\`\`
*(Replace `paste_your_private_key_here` with the private key you exported from MetaMask. Do not add quotes around it. If your key starts with `0x`, remove the `0x` part.)*

## Step 4: Run the Deploy Script
Now that the system has a wallet with test money, run this exact command in your terminal at the bottom of your editor:

\`\`\`bash
pnpm --filter contracts deploy:sepolia
\`\`\`

If it works, the terminal will print out a bunch of text, including something that says:
`SortsFactory address: 0x...` (followed by a long string).
**Copy that address!**

## Step 5: Connect the Frontend and Backend
Now we need to tell the website where the contract lives.

**1. Update the Frontend:**
Open the file `frontend/.env.local` (create it if it doesn't exist) and add these lines:
\`\`\`env
NEXT_PUBLIC_SORTS_FACTORY_ADDRESS=paste_the_factory_address_here
NEXT_PUBLIC_CHAIN_ID=421614
NEXT_PUBLIC_ARBITRUM_SEPOLIA_RPC_URL=https://sepolia-rollup.arbitrum.io/rpc
\`\`\`

**2. Update the Backend:**
Open the file `backend/.env` (create it if it doesn't exist) and add these lines:
\`\`\`env
SORTS_FACTORY_ADDRESS=paste_the_factory_address_here
ARBITRUM_SEPOLIA_RPC_URL=https://sepolia-rollup.arbitrum.io/rpc
\`\`\`

*(Make sure you replace `paste_the_factory_address_here` with the actual address you copied in Step 4).*

## You're done!
Restart your app if it's running. When you go back to `http://localhost:3000/studio/create`, the "SortsFactory is not configured" message will be gone, and you can create your first community!
