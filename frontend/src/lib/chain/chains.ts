/** Chain registry — single source of truth for cluster names, native units,
 *  explorer URLs, and the discriminator the chain factory routes on.
 *
 *  Adding a chain: add an entry here, write an adapter under
 *  `adapters/<Chain>ChainAdapter.ts`, and route it in `useChain.ts`.
 */

import type { ChainAdapterId } from './types';

export interface ChainRegistryEntry {
  id: ChainAdapterId;
  label: string;
  cluster: 'devnet' | 'mainnet' | 'sepolia';
  family: 'solana' | 'evm';
  nativeCurrency: { symbol: string; decimals: number; label: string };
  explorerTxUrl: (signature: string) => string;
  explorerAddressUrl: (address: string) => string;
  isPrimary: boolean;
  isLegacy: boolean;
}

export const CHAINS: Record<ChainAdapterId, ChainRegistryEntry> = {
  'solana-devnet': {
    id: 'solana-devnet',
    label: 'Solana Devnet',
    cluster: 'devnet',
    family: 'solana',
    nativeCurrency: { symbol: 'SOL', decimals: 9, label: 'SOL' },
    explorerTxUrl: (sig) => `https://explorer.solana.com/tx/${sig}?cluster=devnet`,
    explorerAddressUrl: (addr) => `https://explorer.solana.com/address/${addr}?cluster=devnet`,
    isPrimary: true,
    isLegacy: false,
  },
  'arbitrum-sepolia': {
    id: 'arbitrum-sepolia',
    label: 'Arbitrum Sepolia',
    cluster: 'sepolia',
    family: 'evm',
    nativeCurrency: { symbol: 'ETH', decimals: 18, label: 'USDC' },
    explorerTxUrl: (hash) => `https://sepolia.arbiscan.io/tx/${hash}`,
    explorerAddressUrl: (addr) => `https://sepolia.arbiscan.io/address/${addr}`,
    isPrimary: false,
    isLegacy: true,
  },
};

export const DEFAULT_CHAIN: ChainAdapterId = 'solana-devnet';

/** Resolve a chain id from a query-string value or community metadata field.
 *  Unknown / undefined values fall back to the primary chain. */
export function resolveChainId(input: string | null | undefined): ChainAdapterId {
  if (!input) return DEFAULT_CHAIN;
  if (input === 'solana-devnet' || input === 'arbitrum-sepolia') return input;
  return DEFAULT_CHAIN;
}
