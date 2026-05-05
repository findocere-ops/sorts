'use client';

import { useCallback } from 'react';
import { CHAINS } from '../chains';
import type {
  AggregateStats,
  ChainAdapter,
  CreateCommunityInput,
  CreateCommunityResult,
  RenewInput,
  SubscribeInput,
  TransactionResult,
} from '../types';
import { useLegacyArbitrumChain } from '../useChain';
import type { Address } from 'viem';

/** Arbitrum legacy adapter. Wraps the existing wagmi/viem implementation in
 *  the ChainAdapter projection so the chain-aware `useChain()` factory can
 *  return either Arbitrum or Solana behind one shape.
 *
 *  Available only via `?chain=arbitrum-sepolia` — Solana is the default. */
export function useArbitrumChainAdapter(): ChainAdapter {
  const legacy = useLegacyArbitrumChain();

  const createCommunity = useCallback(async (input: CreateCommunityInput): Promise<CreateCommunityResult> => {
    const result = await legacy.createCommunity(input);
    return {
      txHash: result.txHash,
      receipt: result.receipt,
      communityId: result.communityId,
      contractAddress: result.contractAddress,
    };
  }, [legacy]);

  const subscribe = useCallback(async (input: SubscribeInput): Promise<TransactionResult> => {
    return legacy.subscribe({
      communityAddress: input.communityAddress as Address,
      tier: input.tier,
      paymentWei: input.paymentWei,
    });
  }, [legacy]);

  const renew = useCallback(async (input: RenewInput): Promise<TransactionResult> => {
    return legacy.renew({
      communityAddress: input.communityAddress as Address,
      paymentWei: input.paymentWei,
    });
  }, [legacy]);

  const getAggregateStats = useCallback(async (communityRef: string): Promise<AggregateStats> => {
    return legacy.getAggregateStats(communityRef as Address);
  }, [legacy]);

  // Map legacy 'factory-not-configured' → adapter's 'factory-not-configured'.
  // Both terms are accepted by the union for back-compat.
  return {
    chain: 'arbitrum-sepolia',
    readinessState: legacy.readinessState,
    transactionState: legacy.transactionState,
    address: legacy.address,
    txHash: legacy.txHash,
    error: legacy.error,
    paymentTokenLabel: CHAINS['arbitrum-sepolia'].nativeCurrency.label,
    getExplorerTxUrl: CHAINS['arbitrum-sepolia'].explorerTxUrl,
    createCommunity,
    subscribe,
    renew,
    getAggregateStats,
    resetTransaction: legacy.resetTransaction,
  };
}
