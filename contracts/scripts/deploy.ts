import { ethers, network } from 'hardhat';
import * as fs from 'fs';
import * as path from 'path';

const DEFAULT_ARBITRUM_SEPOLIA_USDC = '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d';

async function main() {
  const isArbitrumSepolia = network.name === 'arbitrumSepolia';
  const missing: string[] = [];
  const usdcAddress = process.env.USDC_ADDRESS ?? DEFAULT_ARBITRUM_SEPOLIA_USDC;

  if (isArbitrumSepolia && !process.env.PRIVATE_KEY) {
    missing.push('PRIVATE_KEY');
  }
  if (isArbitrumSepolia && !process.env.ARBITRUM_SEPOLIA_RPC_URL && !process.env.ARBITRUM_SEPOLIA_RPC) {
    missing.push('ARBITRUM_SEPOLIA_RPC_URL');
  }

  if (missing.length > 0) {
    console.log('Arbitrum Sepolia deployment is not configured yet.');
    console.log('');
    console.log('Missing required value(s):', missing.join(', '));
    console.log('');
    console.log('Manual setup:');
    console.log('1. Create contracts/.env');
    console.log('2. Add PRIVATE_KEY=<your burner wallet private key>');
    console.log('3. Add ARBITRUM_SEPOLIA_RPC_URL=<your Arbitrum Sepolia RPC URL>');
    console.log('4. Make sure the burner wallet has Arbitrum Sepolia ETH');
    console.log('5. Run: cd contracts && pnpm deploy:sepolia');
    console.log('');
    console.log('Never commit contracts/.env.');
    return;
  }

  const providerNetwork = await ethers.provider.getNetwork();
  const [deployer] = await ethers.getSigners();

  console.log('Network name:', network.name);
  console.log('Chain ID:', providerNetwork.chainId.toString());
  console.log('Deployer address:', deployer.address);
  console.log('Deployer balance:', ethers.formatEther(await ethers.provider.getBalance(deployer.address)), 'ETH');

  const SortsFactory = await ethers.getContractFactory('SortsFactory');
  const factory = await SortsFactory.deploy(deployer.address, usdcAddress);
  const deploymentTx = factory.deploymentTransaction();

  if (deploymentTx?.hash) {
    console.log('Transaction hash:', deploymentTx.hash);
  }

  await factory.waitForDeployment();
  const receipt = deploymentTx ? await deploymentTx.wait() : null;
  const factoryAddress = await factory.getAddress();

  console.log('SortsFactory address:', factoryAddress);
  console.log('Block number:', receipt?.blockNumber ?? 'unavailable');

  const deployments = {
    network: 'arbitrum-sepolia',
    hardhatNetwork: network.name,
    chainId: 421614,
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
    paymentToken: usdcAddress,
    contracts: {
      SortsFactory: factoryAddress,
    },
    transactions: {
      SortsFactory: deploymentTx?.hash ?? null,
    },
    blocks: {
      SortsFactory: receipt?.blockNumber ?? null,
    },
    arbiscanLinks: {
      factory: `https://sepolia.arbiscan.io/address/${factoryAddress}`,
      transaction: deploymentTx?.hash ? `https://sepolia.arbiscan.io/tx/${deploymentTx.hash}` : null,
    },
  };

  const outPath = path.join(__dirname, '../deployments/arbitrum-sepolia.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(deployments, null, 2));

  console.log('Deployment output saved to:', outPath);
  console.log('Arbiscan factory:', deployments.arbiscanLinks.factory);
  if (deployments.arbiscanLinks.transaction) {
    console.log('Arbiscan transaction:', deployments.arbiscanLinks.transaction);
  }
  console.log('');
  console.log('Next step: copy this address into env files:');
  console.log(`NEXT_PUBLIC_SORTS_FACTORY_ADDRESS=${factoryAddress}`);
  console.log(`SORTS_FACTORY_ADDRESS=${factoryAddress}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
