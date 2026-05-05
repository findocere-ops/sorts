'use client';

import { useCallback, useMemo, useState } from 'react';
import { createPublicClient, decodeEventLog, http, isAddress, zeroAddress } from 'viem';
import type { Address, Hash, TransactionReceipt } from 'viem';
import { arbitrumSepolia } from 'viem/chains';
import {
  useSortsAccount,
  useSortsChainId,
  useSortsSwitchChain,
  useSortsWriteContract,
} from '@/components/providers/PrivyProvider';
import { erc20Abi } from './abis/erc20Abi';
import { factoryAbi } from './abis/factoryAbi';
import { membershipAbi } from './abis/membershipAbi';
import type {
  AggregateStats,
  ChainReadinessState,
  ChainState,
  ChainTransactionState,
  CreateCommunityInput,
  CreateCommunityResult,
  RenewInput,
  SubscribeInput,
  TransactionResult,
} from './types';

export const ARBITRUM_SEPOLIA_CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? arbitrumSepolia.id);
export const ARBITRUM_SEPOLIA_RPC_URL = process.env.NEXT_PUBLIC_ARBITRUM_SEPOLIA_RPC_URL;
export const SORTS_FACTORY_ADDRESS = process.env.NEXT_PUBLIC_SORTS_FACTORY_ADDRESS;
export const USDC_PAYMENT_TOKEN_LABEL = 'USDC';

const EXPLORER_BASE_URL = 'https://sepolia.arbiscan.io';

const publicClient = createPublicClient({
  chain: arbitrumSepolia,
  transport: http(ARBITRUM_SEPOLIA_RPC_URL || undefined),
});

export function getConfiguredFactoryAddress(address = SORTS_FACTORY_ADDRESS): Address | null {
  const normalized = address?.trim();
  if (!normalized || !isAddress(normalized) || normalized === zeroAddress) return null;
  return normalized as Address;
}

export function isFactoryConfigured(address = SORTS_FACTORY_ADDRESS): address is Address {
  return Boolean(getConfiguredFactoryAddress(address));
}

export function shortenAddress(address?: string | null, chars = 4): string {
  if (!address) return '';
  if (address.length <= chars * 2 + 2) return address;
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

export function formatTxHash(hash?: string | null, chars = 6): string {
  if (!hash) return '';
  if (hash.length <= chars * 2 + 2) return hash;
  return `${hash.slice(0, chars + 2)}...${hash.slice(-chars)}`;
}

export function getExplorerTxUrl(txHash: string): string {
  return `${EXPLORER_BASE_URL}/tx/${txHash}`;
}

export function getExplorerAddressUrl(address: string): string {
  return `${EXPLORER_BASE_URL}/address/${address}`;
}

/** Legacy Arbitrum-Sepolia implementation. The chain-aware `useChain()`
 *  factory below picks this when `?chain=arbitrum-sepolia` is set; default is
 *  Solana. Existing call sites that need Arbitrum-specific fields
 *  (factoryConfigured, paymentTokenLabel, approveUsdc, etc.) should call
 *  `useLegacyArbitrumChain()` directly. */
export function useLegacyArbitrumChain() {
  const { address } = useSortsAccount();
  const chainId = useSortsChainId();
  const { switchChain } = useSortsSwitchChain();
  const { writeContractAsync } = useSortsWriteContract();
  const [transactionState, setTransactionState] = useState<ChainTransactionState>('idle');
  const [txHash, setTxHash] = useState<Hash | null>(null);
  const [error, setError] = useState<string | null>(null);

  const factoryConfigured = isFactoryConfigured();
  const wrongNetwork = Boolean(address && chainId !== ARBITRUM_SEPOLIA_CHAIN_ID);

  const readinessState = useMemo<ChainReadinessState>(() => {
    if (!address) return 'wallet-not-connected';
    if (wrongNetwork) return 'wrong-network';
    if (!factoryConfigured) return 'factory-not-configured';
    return 'ready';
  }, [address, factoryConfigured, wrongNetwork]);

  const chainState = useMemo<ChainState>(() => {
    if (transactionState !== 'idle') return transactionState;
    return readinessState;
  }, [readinessState, transactionState]);

  const resetTransaction = useCallback(() => {
    setTransactionState('idle');
    setTxHash(null);
    setError(null);
  }, []);

  const switchToArbitrumSepolia = useCallback(() => {
    switchChain({ chainId: ARBITRUM_SEPOLIA_CHAIN_ID });
  }, [switchChain]);

  const assertReadyForFactoryWrite = useCallback(() => {
    if (!address) throw new Error('Connect a wallet first.');
    if (wrongNetwork) throw new Error('Switch to Arbitrum Sepolia before sending a transaction.');
    const factoryAddress = getConfiguredFactoryAddress();
    if (!factoryAddress) throw new Error('Set NEXT_PUBLIC_SORTS_FACTORY_ADDRESS after deploying SortsFactory.');
    return factoryAddress;
  }, [address, wrongNetwork]);

  const assertReadyForMembershipWrite = useCallback((communityAddress: Address) => {
    if (!address) throw new Error('Connect a wallet first.');
    if (wrongNetwork) throw new Error('Switch to Arbitrum Sepolia before sending a transaction.');
    if (!isAddress(communityAddress)) throw new Error('Community contract address is invalid.');
  }, [address, wrongNetwork]);

  const assertReadyForTokenWrite = useCallback((spender: Address) => {
    if (!address) throw new Error('Connect a wallet first.');
    if (wrongNetwork) throw new Error('Switch to Arbitrum Sepolia before sending a transaction.');
    if (!isAddress(spender)) throw new Error('USDC spender address is invalid.');
  }, [address, wrongNetwork]);

  const waitForReceipt = useCallback(async (hash: Hash): Promise<TransactionReceipt> => {
    setTransactionState('transaction-pending');
    return publicClient.waitForTransactionReceipt({ hash });
  }, []);

  const createCommunity = useCallback(async (input: CreateCommunityInput): Promise<CreateCommunityResult> => {
    setError(null);

    try {
      const factoryAddress = assertReadyForFactoryWrite();
      setTransactionState('awaiting-signature');

      const hash = await writeContractAsync({
        address: factoryAddress,
        abi: factoryAbi,
        functionName: 'createCommunity',
        args: [
          input.name,
          input.symbol,
          input.tiers.map((tier) => tier.level),
          input.tiers.map((tier) => tier.priceWei),
          input.tiers.map((tier) => tier.durationSeconds),
        ],
      });

      setTxHash(hash);
      const receipt = await waitForReceipt(hash);
      const created = parseCommunityCreatedEvent(receipt, factoryAddress);

      setTransactionState('transaction-confirmed');
      return {
        txHash: hash,
        receipt,
        communityId: created.communityId,
        contractAddress: created.contractAddress,
      };
    } catch (caught) {
      const message = getErrorMessage(caught);
      setError(message);
      setTransactionState('transaction-failed');
      throw caught;
    }
  }, [assertReadyForFactoryWrite, waitForReceipt, writeContractAsync]);

  const getUsdcAddress = useCallback(async (): Promise<Address> => {
    const factoryAddress = getConfiguredFactoryAddress();
    if (!factoryAddress) {
      throw new Error('Set NEXT_PUBLIC_SORTS_FACTORY_ADDRESS after deploying SortsFactory.');
    }

    return publicClient.readContract({
      address: factoryAddress,
      abi: factoryAbi,
      functionName: 'paymentToken',
    });
  }, []);

  const approveUsdc = useCallback(async (spender: Address, amount: bigint): Promise<TransactionResult> => {
    setError(null);

    try {
      assertReadyForTokenWrite(spender);
      const usdcAddress = await getUsdcAddress();
      setTransactionState('awaiting-signature');

      const hash = await writeContractAsync({
        address: usdcAddress,
        abi: erc20Abi,
        functionName: 'approve',
        args: [spender, amount],
      });

      setTxHash(hash);
      const receipt = await waitForReceipt(hash);
      setTransactionState('transaction-confirmed');
      return { txHash: hash, receipt };
    } catch (caught) {
      const message = getErrorMessage(caught);
      setError(message);
      setTransactionState('transaction-failed');
      throw caught;
    }
  }, [assertReadyForTokenWrite, getUsdcAddress, waitForReceipt, writeContractAsync]);

  const subscribe = useCallback(async (input: SubscribeInput): Promise<TransactionResult> => {
    setError(null);

    try {
      assertReadyForMembershipWrite(input.communityAddress as Address);
      setTransactionState('awaiting-signature');

      const hash = await writeContractAsync({
        address: input.communityAddress as Address,
        abi: membershipAbi,
        functionName: 'subscribe',
        args: [input.tier],
      });

      setTxHash(hash);
      const receipt = await waitForReceipt(hash);
      setTransactionState('transaction-confirmed');
      return { txHash: hash, receipt };
    } catch (caught) {
      const message = getErrorMessage(caught);
      setError(message);
      setTransactionState('transaction-failed');
      throw caught;
    }
  }, [assertReadyForMembershipWrite, waitForReceipt, writeContractAsync]);

  const renew = useCallback(async (input: RenewInput): Promise<TransactionResult> => {
    setError(null);

    try {
      assertReadyForMembershipWrite(input.communityAddress as Address);
      setTransactionState('awaiting-signature');

      const hash = await writeContractAsync({
        address: input.communityAddress as Address,
        abi: membershipAbi,
        functionName: 'renewSubscription',
      });

      setTxHash(hash);
      const receipt = await waitForReceipt(hash);
      setTransactionState('transaction-confirmed');
      return { txHash: hash, receipt };
    } catch (caught) {
      const message = getErrorMessage(caught);
      setError(message);
      setTransactionState('transaction-failed');
      throw caught;
    }
  }, [assertReadyForMembershipWrite, waitForReceipt, writeContractAsync]);

  const getAggregateStats = useCallback(async (communityAddress: Address): Promise<AggregateStats> => {
    if (!isAddress(communityAddress)) {
      throw new Error('Community contract address is invalid.');
    }

    const [totalMembers, totalRevenueWei, activeMemberships] = await publicClient.readContract({
      address: communityAddress,
      abi: membershipAbi,
      functionName: 'getAggregateStats',
    });

    return { totalMembers, totalRevenueWei, activeMemberships };
  }, []);

  const readUsdcAllowance = useCallback(async (owner: Address, spender: Address): Promise<bigint> => {
    if (!isAddress(owner)) throw new Error('USDC owner address is invalid.');
    if (!isAddress(spender)) throw new Error('USDC spender address is invalid.');

    const usdcAddress = await getUsdcAddress();
    return publicClient.readContract({
      address: usdcAddress,
      abi: erc20Abi,
      functionName: 'allowance',
      args: [owner, spender],
    });
  }, [getUsdcAddress]);

  const readUsdcBalance = useCallback(async (owner: Address): Promise<bigint> => {
    if (!isAddress(owner)) throw new Error('USDC owner address is invalid.');

    const usdcAddress = await getUsdcAddress();
    return publicClient.readContract({
      address: usdcAddress,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [owner],
    });
  }, [getUsdcAddress]);

  return {
    address,
    chainId,
    chainState,
    readinessState,
    transactionState,
    txHash,
    error,
    factoryAddress: getConfiguredFactoryAddress(),
    factoryConfigured,
    wrongNetwork,
    paymentTokenLabel: USDC_PAYMENT_TOKEN_LABEL,
    approveUsdc,
    createCommunity,
    subscribe,
    renew,
    getUsdcAddress,
    readUsdcAllowance,
    readUsdcBalance,
    getAggregateStats,
    resetTransaction,
    switchToArbitrumSepolia,
  };
}

function parseCommunityCreatedEvent(receipt: TransactionReceipt, factoryAddress: Address) {
  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== factoryAddress.toLowerCase()) continue;

    try {
      const decoded = decodeEventLog({
        abi: factoryAbi,
        data: log.data,
        topics: log.topics,
      });

      if (decoded.eventName === 'CommunityCreated') {
        return {
          communityId: decoded.args.communityId,
          contractAddress: decoded.args.contractAddress,
        };
      }
    } catch {
      // Ignore unrelated logs from the same transaction.
    }
  }

  return {
    communityId: null,
    contractAddress: null,
  };
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Transaction failed.';
}

// ── Chain-aware factory (Day 3) ──────────────────────────────────────────────
//
// Default chain: solana-devnet. Legacy Arbitrum is reachable via
// `?chain=arbitrum-sepolia` or via a community whose metadata records that
// chain id. Existing call sites that destructure Arbitrum-specific fields
// (factoryConfigured, paymentTokenLabel, approveUsdc, getUsdcAddress, etc.)
// should switch to `useLegacyArbitrumChain()` directly. The new factory
// returns the chain-agnostic `ChainAdapter` shape.

import { useSearchParams } from 'next/navigation';
import { resolveChainId } from './chains';
import type { ChainAdapter, ChainAdapterId } from './types';
import { useArbitrumChainAdapter } from './adapters/ArbitrumChainAdapter';
import { useSolanaChainAdapter } from './adapters/SolanaChainAdapter';

export function resolveActiveChainId(query: URLSearchParams | null): ChainAdapterId {
  return resolveChainId(query?.get('chain') ?? null);
}

/** Pick a chain adapter based on the `?chain=` query string (default
 *  `solana-devnet`). Both adapter hooks are called unconditionally to satisfy
 *  the React rules-of-hooks; only the picked one is returned. */
export function useChain(): ChainAdapter {
  const searchParams = useSearchParams();
  const active = resolveActiveChainId(searchParams);
  const solana = useSolanaChainAdapter();
  const arbitrum = useArbitrumChainAdapter();
  return active === 'arbitrum-sepolia' ? arbitrum : solana;
}
