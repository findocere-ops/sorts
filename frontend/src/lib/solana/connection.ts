'use client';

import { Connection, clusterApiUrl } from '@solana/web3.js';
import { env } from '@/lib/env';

/** Singleton Solana RPC connection. Devnet only — no mainnet code path
 *  exists because the Universal Hard Rules forbid mainnet writes. */
let cached: Connection | null = null;

export function getSolanaConnection(): Connection {
  if (cached) return cached;
  const url = env.NEXT_PUBLIC_SOLANA_DEVNET_RPC_URL ?? clusterApiUrl('devnet');
  cached = new Connection(url, { commitment: 'confirmed' });
  return cached;
}

/** Cluster string used in explorer links. */
export const SOLANA_CLUSTER = 'devnet' as const;

export function getSolanaExplorerTxUrl(signature: string): string {
  return `https://explorer.solana.com/tx/${signature}?cluster=${SOLANA_CLUSTER}`;
}

export function getSolanaExplorerAddressUrl(address: string): string {
  return `https://explorer.solana.com/address/${address}?cluster=${SOLANA_CLUSTER}`;
}
