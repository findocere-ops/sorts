import type { Address, Hash, TransactionReceipt } from 'viem';

export type ChainReadinessState =
  | 'wallet-not-connected'
  | 'wrong-network'
  | 'factory-not-configured'
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
  txHash: Hash;
  receipt: TransactionReceipt;
  communityId: bigint | null;
  contractAddress: Address | null;
}

export interface SubscribeInput {
  communityAddress: Address;
  tier: TierLevel;
  paymentWei: bigint;
}

export interface RenewInput {
  communityAddress: Address;
  paymentWei: bigint;
}

export interface TransactionResult {
  txHash: Hash;
  receipt: TransactionReceipt;
}

export interface AggregateStats {
  totalMembers: bigint;
  totalRevenueWei: bigint;
  activeMemberships: bigint;
}
