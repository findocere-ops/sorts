export type ChainId =
  | 'arbitrum-sepolia'   // Phase 1 — iExec Vibe Coding Challenge
  | 'solana-devnet'      // Phase 2 — IKA + Encrypt + Umbra
  | 'solana-mainnet';    // Phase 2 — production Solana

export interface ChainConfig {
  id: ChainId;
  name: string;
  rpcUrl: string;
  explorerUrl: string;
  nativeCurrency: { symbol: string; decimals: number };
  isTestnet: boolean;
}

export const CHAIN_CONFIGS: Record<ChainId, ChainConfig> = {
  'arbitrum-sepolia': {
    id: 'arbitrum-sepolia',
    name: 'Arbitrum Sepolia',
    rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
    explorerUrl: 'https://sepolia.arbiscan.io',
    nativeCurrency: { symbol: 'ETH', decimals: 18 },
    isTestnet: true,
  },
  'solana-devnet': {
    id: 'solana-devnet',
    name: 'Solana Devnet',
    rpcUrl: 'https://api.devnet.solana.com',
    explorerUrl: 'https://explorer.solana.com/?cluster=devnet',
    nativeCurrency: { symbol: 'SOL', decimals: 9 },
    isTestnet: true,
  },
  'solana-mainnet': {
    id: 'solana-mainnet',
    name: 'Solana',
    rpcUrl: 'https://api.mainnet-beta.solana.com',
    explorerUrl: 'https://explorer.solana.com',
    nativeCurrency: { symbol: 'SOL', decimals: 9 },
    isTestnet: false,
  },
};
