export type EvmChainId = 'arbitrum-sepolia';
export type SolanaChainId = 'solana-devnet' | 'solana-mainnet';

export type ChainId =
  | EvmChainId    // Phase 1 — iExec Vibe Coding Challenge legacy
  | SolanaChainId; // Phase 2 — Solana primary chain (devnet first)

/** Discriminator used by ChainServiceFactory to route to the right adapter. */
export const COMMUNITY_CHAIN_LEGACY: EvmChainId = 'arbitrum-sepolia';
export const COMMUNITY_CHAIN_DEVNET: SolanaChainId = 'solana-devnet';

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

export function isSolanaChain(id: ChainId | string): id is SolanaChainId {
  return id === 'solana-devnet' || id === 'solana-mainnet';
}
