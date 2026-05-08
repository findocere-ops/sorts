'use client';

/**
 * Tip rail — Tier 1.3 dual-path payment, smaller surface than subscribe.
 *
 * Devnet (default): a single `system_program::transfer` ix from the tipper
 * to the creator. Optional 80-char message attached via the SPL Memo
 * Program. Sender, recipient, and amount are visible on Solana Explorer.
 * Privacy claim: NONE. Privacy badge `transparent · devnet`.
 *
 * Mainnet (when `NEXT_PUBLIC_ENABLE_CLOAK_MAINNET=true`): defers to
 * `cloak.ts::cloakSubscribePay` with `feeLamports=0` (creator gets the
 * full amount, no SORTS protocol cut on tips). On-chain trace shows the
 * Cloak shielded pool, not the tipper.
 *
 * Kept as a separate module from `cloak.ts` because the devnet path uses
 * NO Cloak SDK code at all — keeps the snarkjs/circomlibjs prover bundle
 * out of pages that just want a tip button.
 */

import {
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';
import type {
  Connection,
  Transaction as Tx,
  TransactionSignature,
  VersionedTransaction,
} from '@solana/web3.js';
import { env } from '@/lib/env';

/** SPL Memo Program v2 — same id used across devnet + mainnet. */
const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');
/** Hard cap on the optional memo. The on-chain memo is fully public — we
 *  cap to 80 chars so a leaked memo can't double as a covert side-channel. */
const MAX_MEMO_LENGTH = 80;

type WalletAdapterLike = {
  publicKey: PublicKey;
  signTransaction: <T extends Tx | VersionedTransaction>(tx: T) => Promise<T>;
};

export interface TipInput {
  connection: Connection;
  wallet: WalletAdapterLike;
  recipient: PublicKey;
  amountLamports: bigint;
  /** Optional 80-char public memo. Trimmed; oversized inputs throw. */
  memo?: string;
}

export interface TipResult {
  signature: TransactionSignature;
  /** Which payment rail actually fired. Mirrors `getActivePaymentMode()`. */
  paymentMode: 'transparent-devnet' | 'cloak-mainnet';
}

export async function sendTip(input: TipInput): Promise<TipResult> {
  if (input.amountLamports <= 0n) {
    throw new Error('amountLamports must be positive');
  }
  if (input.memo && input.memo.length > MAX_MEMO_LENGTH) {
    throw new Error(`memo exceeds ${MAX_MEMO_LENGTH} chars`);
  }
  if (input.recipient.equals(input.wallet.publicKey)) {
    throw new Error('cannot tip yourself');
  }

  if (env.NEXT_PUBLIC_ENABLE_CLOAK_MAINNET) {
    // Mainnet path — defer to cloak.ts. Tips have no SORTS protocol fee
    // (creator gets 100% of amount), so we pass feeLamports=0.
    const { cloakSubscribePay } = await import('@/lib/solana/cloak');
    // Re-use the same orchestration as subscribe; treasury arg unused in tip
    // because feeLamports=0 makes the treasury withdraw a no-op. Pass a
    // placeholder pubkey so the typed contract is satisfied.
    const result = await cloakSubscribePay({
      connection: input.connection,
      wallet: input.wallet,
      creator: input.recipient,
      treasury: input.recipient, // unused at fee=0; safe placeholder
      priceLamports: input.amountLamports,
      feeLamports: 0n,
    });
    return {
      signature: result.creatorWithdrawSig,
      paymentMode: 'cloak-mainnet',
    };
  }

  return sendTipTransparent(input);
}

/** Devnet path — one tx with a system_program::transfer + optional memo ix. */
async function sendTipTransparent(input: TipInput): Promise<TipResult> {
  const tx = new Transaction();
  tx.add(
    SystemProgram.transfer({
      fromPubkey: input.wallet.publicKey,
      toPubkey: input.recipient,
      lamports: Number(input.amountLamports),
    }),
  );
  if (input.memo) {
    tx.add(
      new TransactionInstruction({
        keys: [],
        programId: MEMO_PROGRAM_ID,
        data: Buffer.from(input.memo, 'utf8'),
      }),
    );
  }

  const { blockhash, lastValidBlockHeight } =
    await input.connection.getLatestBlockhash('confirmed');
  tx.recentBlockhash = blockhash;
  tx.feePayer = input.wallet.publicKey;

  const signed = await input.wallet.signTransaction(tx);
  const signature = await input.connection.sendRawTransaction(signed.serialize(), {
    preflightCommitment: 'confirmed',
  });
  await input.connection.confirmTransaction(
    { signature, blockhash, lastValidBlockHeight },
    'confirmed',
  );
  return { signature, paymentMode: 'transparent-devnet' };
}

export const TIP_MEMO_MAX_LENGTH = MAX_MEMO_LENGTH;
