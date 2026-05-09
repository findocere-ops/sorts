import type { Address, Hash, TransactionReceipt } from 'viem';

/** Chain id discriminator for the chain-aware factory.
 *  - `solana-devnet` is the primary, default chain (Phase 2).
 *  - `arbitrum-sepolia` is the legacy adapter, reachable via `?chain=arbitrum-sepolia`. */
export type ChainAdapterId = 'solana-devnet' | 'arbitrum-sepolia';

export type ChainReadinessState =
  | 'wallet-not-connected'
  | 'wrong-network'
  | 'factory-not-configured'   // legacy alias — kept for back-compat with EVM call sites
  | 'program-not-configured'   // Solana equivalent
  | 'ready';

export type ChainTransactionState =
  | 'idle'
  | 'awaiting-signature'
  | 'transaction-pending'
  | 'transaction-confirmed'
  | 'transaction-failed';

export type ChainState = ChainReadinessState | ChainTransactionState;

export type TierLevel = 1 | 2 | 3;

export interface CreateCommunityTierInput {
  level: TierLevel;
  priceWei: bigint;
  durationSeconds: bigint;
}

export interface CreateCommunityInput {
  name: string;
  symbol: string;
  tiers: CreateCommunityTierInput[];
}

export interface CreateCommunityResult {
  /** Hex tx hash on EVM, base58 signature on Solana. */
  txHash: string;
  /** EVM-only — populated by ArbitrumChainAdapter. */
  receipt?: TransactionReceipt;
  /** EVM-only — bigint id from the factory event log. */
  communityId?: bigint | null;
  /** EVM contract address or Solana community PDA, base58. */
  contractAddress: string | null;
}

export interface SubscribeInput {
  /** EVM contract address or Solana community PDA. */
  communityAddress: string;
  tier: TierLevel;
  /** EVM USDC payment in wei; on Solana lamports come from the on-chain Tier slot. */
  paymentWei: bigint;
  /** Solana-only: 32-byte salt that, combined with `tier`, forms `tier_commitment`. */
  saltPubkey?: string;
  /** Solana-only: community creator pubkey, used as a verified account on the ix. */
  creatorAddress?: string;
  /** Solana + Cloak path only: the lamport price of the chosen tier. The
   *  on-chain transparent path reads this from the Community PDA itself,
   *  so this hint is only consumed when `NEXT_PUBLIC_ENABLE_CLOAK_MAINNET`
   *  is true (Cloak orchestration runs client-side and needs to know the
   *  amount before the on-chain ix). */
  tierPriceLamports?: bigint;
}

export interface RenewInput {
  communityAddress: string;
  paymentWei: bigint;
  /** Solana-only — same as in SubscribeInput. */
  creatorAddress?: string;
  /** Solana-only — required by the on-chain renew_subscription ix. */
  tier?: TierLevel;
  /** Solana + Cloak path only — same as SubscribeInput.tierPriceLamports. */
  tierPriceLamports?: bigint;
}

export interface TransactionResult {
  txHash: string;
  /** EVM-only. */
  receipt?: TransactionReceipt;
}

export interface AggregateStats {
  totalMembers: bigint;
  totalRevenueWei: bigint;
  activeMemberships: bigint;
}

/** Common surface every chain adapter must satisfy. The frontend `useChain()`
 *  hook returns one of these implementations, picked from the chain registry
 *  using community metadata or the `?chain=` query string. */
export interface ChainAdapter {
  chain: ChainAdapterId;
  readinessState: ChainReadinessState;
  transactionState: ChainTransactionState;
  address: string | undefined;
  txHash: string | null;
  error: string | null;

  /** Human label for the native payment unit (e.g. `SOL`, `USDC`). */
  paymentTokenLabel: string;
  /** Stable URL to the explorer for a transaction signature / hash. */
  getExplorerTxUrl(txHash: string): string;

  createCommunity(input: CreateCommunityInput): Promise<CreateCommunityResult>;
  subscribe(input: SubscribeInput): Promise<TransactionResult>;
  renew(input: RenewInput): Promise<TransactionResult>;
  getAggregateStats(communityRef: string): Promise<AggregateStats>;
  resetTransaction(): void;
}
