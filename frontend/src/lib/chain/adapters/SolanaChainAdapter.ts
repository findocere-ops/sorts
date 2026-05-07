'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  Keypair,
  PublicKey,
  Transaction,
} from '@solana/web3.js';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { CHAINS } from '../chains';
import type {
  AggregateStats,
  ChainAdapter,
  ChainReadinessState,
  ChainTransactionState,
  CreateCommunityInput,
  CreateCommunityResult,
  RenewInput,
  SubscribeInput,
  TransactionResult,
} from '../types';
import { env } from '@/lib/env';
import {
  buildInitializeCommunityIx,
  buildRenewSubscriptionIx,
  buildSubscribeIx,
  buildZeroCloakSigs,
  hash32,
} from '@/lib/solana/instructions';
import {
  buildNonceCanonicalMessage,
  deriveCommunityPda,
  deriveSubscriberCommitment,
  getSortsProgramId,
  nonceFromSignature,
  PROTOCOL_TREASURY,
} from '@/lib/solana/program';

/** Layout offsets — must match programs/sorts-community/src/state.rs.
 *  Discriminator(1) + creator(32) + name_hash(32) + symbol_hash(32) +
 *  created_at(8) + tier_count(1) + 6×8 (tier prices/durations) +
 *  total_members(8) + active_members(8) + total_revenue(8) + bump(1). */
const COMMUNITY_TOTAL_MEMBERS_OFFSET = 1 + 32 + 32 + 32 + 8 + 1 + 6 * 8;
const COMMUNITY_ACTIVE_MEMBERS_OFFSET = COMMUNITY_TOTAL_MEMBERS_OFFSET + 8;
const COMMUNITY_REVENUE_OFFSET = COMMUNITY_ACTIVE_MEMBERS_OFFSET + 8;

export function useSolanaChainAdapter(): ChainAdapter {
  const { connection } = useConnection();
  const { publicKey, signTransaction, signMessage, connected } = useWallet();
  const [transactionState, setTransactionState] = useState<ChainTransactionState>('idle');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const programConfigured = Boolean(env.NEXT_PUBLIC_SOLANA_PROGRAM_ID);

  const readinessState = useMemo<ChainReadinessState>(() => {
    if (!connected || !publicKey) return 'wallet-not-connected';
    if (!programConfigured) return 'program-not-configured';
    return 'ready';
  }, [connected, publicKey, programConfigured]);

  const resetTransaction = useCallback(() => {
    setTransactionState('idle');
    setTxHash(null);
    setError(null);
  }, []);

  const requireWallet = useCallback((): { signer: PublicKey; sign: NonNullable<typeof signTransaction> } => {
    if (!publicKey) throw new Error('Connect a Solana wallet first.');
    if (!signTransaction) throw new Error('Connected wallet does not support signTransaction.');
    return { signer: publicKey, sign: signTransaction };
  }, [publicKey, signTransaction]);

  /** Derive the per-(subscriber, community) nonce + commitment by asking the
   *  wallet to sign a canonical message. ed25519 is deterministic per RFC
   *  8032, so the same wallet over the same message reproduces the same
   *  nonce on every visit — no backend table or browser localStorage. */
  const deriveCommitmentForCommunity = useCallback(
    async (signer: PublicKey, community: PublicKey): Promise<{ commitment: Uint8Array; nonce: Uint8Array }> => {
      if (!signMessage) {
        throw new Error(
          'Connected wallet does not support signMessage. Use a wallet adapter ' +
            '(Phantom, Solflare, etc.) that exposes message signing.',
        );
      }
      const message = buildNonceCanonicalMessage(community);
      const signature = await signMessage(message);
      const nonce = await nonceFromSignature(new Uint8Array(signature));
      const commitment = deriveSubscriberCommitment(signer, nonce);
      return { commitment, nonce };
    },
    [signMessage],
  );

  const createCommunity = useCallback(async (input: CreateCommunityInput): Promise<CreateCommunityResult> => {
    setError(null);
    try {
      const { signer, sign } = requireWallet();
      setTransactionState('awaiting-signature');

      const nameHash = await hash32(input.name);
      const symbolHash = await hash32(input.symbol);
      const tierCount = Math.min(input.tiers.length, 3);

      const tierPair = (level: 1 | 2 | 3) => {
        const t = input.tiers.find((x) => x.level === level);
        if (!t) return { price: 0n, duration: 0n };
        return { price: t.priceWei, duration: t.durationSeconds };
      };
      const t1 = tierPair(1);
      const t2 = tierPair(2);
      const t3 = tierPair(3);

      const ix = buildInitializeCommunityIx({
        creator: signer,
        nameHash,
        symbolHash,
        tierCount,
        tier1PriceLamports: t1.price,
        tier1DurationSecs: t1.duration,
        tier2PriceLamports: t2.price,
        tier2DurationSecs: t2.duration,
        tier3PriceLamports: t3.price,
        tier3DurationSecs: t3.duration,
      });

      const tx = new Transaction().add(ix);
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
      tx.recentBlockhash = blockhash;
      tx.feePayer = signer;

      const signed = await sign(tx);
      setTransactionState('transaction-pending');
      const sig = await connection.sendRawTransaction(signed.serialize(), {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
      });
      setTxHash(sig);
      await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, 'confirmed');
      setTransactionState('transaction-confirmed');

      const { pda } = deriveCommunityPda(signer);
      return {
        txHash: sig,
        contractAddress: pda.toBase58(),
        communityId: null,
      };
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Solana transaction failed.';
      setError(message);
      setTransactionState('transaction-failed');
      throw caught;
    }
  }, [connection, requireWallet]);

  const subscribe = useCallback(async (input: SubscribeInput): Promise<TransactionResult> => {
    setError(null);
    try {
      const { signer, sign } = requireWallet();
      if (!input.creatorAddress) throw new Error('subscribe requires creatorAddress on Solana.');
      setTransactionState('awaiting-signature');

      const community = new PublicKey(input.communityAddress);
      const creator = new PublicKey(input.creatorAddress);
      // Salt is a fresh ephemeral keypair — pubkey is recorded on-chain, secret discarded.
      const salt = input.saltPubkey ? new PublicKey(input.saltPubkey) : Keypair.generate().publicKey;

      // Step 1: derive subscriber pseudonym (commitment + nonce) by asking the
      // wallet to sign a canonical message. The nonce never leaves the browser.
      const { commitment, nonce } = await deriveCommitmentForCommunity(signer, community);

      // Step 2: Tier 1.3 dual-path payment rail.
      // - Default (devnet): all-zero `cloak_payment_sigs`. The on-chain
      //   handler executes the transparent system_program::transfer flow.
      // - When ENABLE_CLOAK_MAINNET=true (mainnet only): orchestrate a
      //   Cloak deposit + 2× partialWithdraw to creator and treasury, then
      //   record the resulting payout signatures in the slot. The handler
      //   then SKIPS the transparent transfer (Cloak already moved funds).
      let cloakPaymentSigs = buildZeroCloakSigs();
      if (env.NEXT_PUBLIC_ENABLE_CLOAK_MAINNET) {
        if (!signTransaction) {
          throw new Error('Cloak path requires a wallet that supports signTransaction.');
        }
        // Lazy import keeps the snarkjs prover bundle out of pages that don't
        // need it. The chunk is shared with the analytics-page payroll widget.
        const { cloakSubscribePay } = await import('@/lib/solana/cloak');
        const tierPriceLamports = input.tierPriceLamports ?? 0n;
        if (tierPriceLamports <= 0n) {
          throw new Error(
            'Cloak path requires a positive tierPriceLamports on the SubscribeInput.',
          );
        }
        const feeLamports = (tierPriceLamports * 500n) / 10_000n; // 5% protocol fee, matches PROTOCOL_FEE_BPS.
        const cloakResult = await cloakSubscribePay({
          connection,
          wallet: { publicKey: signer, signTransaction },
          creator,
          treasury: PROTOCOL_TREASURY,
          priceLamports: tierPriceLamports,
          feeLamports,
        });
        cloakPaymentSigs = cloakResult.paymentSigs;
      }

      const ix = buildSubscribeIx({
        subscriber: signer,
        community,
        creator,
        level: input.tier,
        commitment,
        nonce,
        saltPubkey: salt,
        cloakPaymentSigs,
      });
      const tx = new Transaction().add(ix);
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
      tx.recentBlockhash = blockhash;
      tx.feePayer = signer;
      const signed = await sign(tx);

      setTransactionState('transaction-pending');
      const sig = await connection.sendRawTransaction(signed.serialize(), { preflightCommitment: 'confirmed' });
      setTxHash(sig);
      await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, 'confirmed');
      setTransactionState('transaction-confirmed');
      return { txHash: sig };
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Solana transaction failed.';
      setError(message);
      setTransactionState('transaction-failed');
      throw caught;
    }
  }, [connection, requireWallet, deriveCommitmentForCommunity]);

  const renew = useCallback(async (input: RenewInput): Promise<TransactionResult> => {
    setError(null);
    try {
      const { signer, sign } = requireWallet();
      if (!input.creatorAddress) throw new Error('renew requires creatorAddress on Solana.');
      if (!input.tier) throw new Error('renew requires tier on Solana.');
      setTransactionState('awaiting-signature');

      const community = new PublicKey(input.communityAddress);
      const creator = new PublicKey(input.creatorAddress);
      // Re-derive the same commitment + nonce that subscribe-time used. Because
      // ed25519 signing is deterministic, the same wallet over the same message
      // produces the same nonce → same commitment → same Subscription PDA.
      const { commitment, nonce } = await deriveCommitmentForCommunity(signer, community);

      // Dual-path payment rail (mirrors subscribe). Each renewal records its
      // own cloak_payment_sigs — a transparent renewal of a Cloak subscribe
      // is allowed (sigs flip back to zero) and vice versa.
      let cloakPaymentSigs = buildZeroCloakSigs();
      if (env.NEXT_PUBLIC_ENABLE_CLOAK_MAINNET) {
        if (!signTransaction) {
          throw new Error('Cloak path requires a wallet that supports signTransaction.');
        }
        const { cloakSubscribePay } = await import('@/lib/solana/cloak');
        const tierPriceLamports = input.tierPriceLamports ?? 0n;
        if (tierPriceLamports <= 0n) {
          throw new Error('Cloak renew requires a positive tierPriceLamports on the RenewInput.');
        }
        const feeLamports = (tierPriceLamports * 500n) / 10_000n;
        const cloakResult = await cloakSubscribePay({
          connection,
          wallet: { publicKey: signer, signTransaction },
          creator,
          treasury: PROTOCOL_TREASURY,
          priceLamports: tierPriceLamports,
          feeLamports,
        });
        cloakPaymentSigs = cloakResult.paymentSigs;
      }

      const ix = buildRenewSubscriptionIx({
        subscriber: signer,
        community,
        creator,
        level: input.tier,
        commitment,
        nonce,
        cloakPaymentSigs,
      });
      const tx = new Transaction().add(ix);
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
      tx.recentBlockhash = blockhash;
      tx.feePayer = signer;
      const signed = await sign(tx);

      setTransactionState('transaction-pending');
      const sig = await connection.sendRawTransaction(signed.serialize(), { preflightCommitment: 'confirmed' });
      setTxHash(sig);
      await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, 'confirmed');
      setTransactionState('transaction-confirmed');
      return { txHash: sig };
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Solana transaction failed.';
      setError(message);
      setTransactionState('transaction-failed');
      throw caught;
    }
  }, [connection, requireWallet, deriveCommitmentForCommunity]);

  const getAggregateStats = useCallback(async (communityRef: string): Promise<AggregateStats> => {
    let pubkey: PublicKey;
    try {
      pubkey = new PublicKey(communityRef);
    } catch {
      // Fall back: treat communityRef as a creator pubkey and derive the PDA.
      pubkey = deriveCommunityPda(new PublicKey(communityRef)).pda;
    }
    void getSortsProgramId(); // ensure env-driven id is initialized
    const info = await connection.getAccountInfo(pubkey);
    if (!info) {
      return { totalMembers: 0n, activeMemberships: 0n, totalRevenueWei: 0n };
    }
    const data = info.data;
    return {
      totalMembers: data.readBigUInt64LE(COMMUNITY_TOTAL_MEMBERS_OFFSET),
      activeMemberships: data.readBigUInt64LE(COMMUNITY_ACTIVE_MEMBERS_OFFSET),
      totalRevenueWei: data.readBigUInt64LE(COMMUNITY_REVENUE_OFFSET),
    };
  }, [connection]);

  return {
    chain: 'solana-devnet',
    readinessState,
    transactionState,
    address: publicKey?.toBase58(),
    txHash,
    error,
    paymentTokenLabel: CHAINS['solana-devnet'].nativeCurrency.label,
    getExplorerTxUrl: CHAINS['solana-devnet'].explorerTxUrl,
    createCommunity,
    subscribe,
    renew,
    getAggregateStats,
    resetTransaction,
  };
}
