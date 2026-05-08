'use client';

/**
 * Solana Pay URI builder + parser.
 *
 * Format spec: https://docs.solanapay.com/spec
 *
 *   solana:<recipient>?amount=<n>&label=<...>&message=<...>&memo=<...>
 *
 * Used by:
 *   - `CreatorTipQrCard` — generates the URI for a creator's tip QR.
 *   - `/tip/[recipient]` route — parses the URI on landing.
 *
 * No third-party SDK needed: the spec is plain URL building. Phantom
 * mobile already parses `solana:` URIs natively when scanned, so the
 * subscriber-side scanner is the wallet itself, not in-browser.
 *
 * Privacy note: the Solana Pay URI carries the recipient address in
 * plaintext. There is no shielding at this layer — just convenience.
 * Privacy mode (transparent vs Cloak-mainnet) is decided at tx-build
 * time in `tip.ts`, not by the URI.
 */

import { PublicKey } from '@solana/web3.js';

export interface SolanaPayParams {
  recipient: PublicKey;
  /** Amount in SOL (decimal). Optional — when omitted, the receiving UI
   *  prompts for the amount. */
  amount?: number;
  /** Short label shown by the wallet UI (e.g. creator name). */
  label?: string;
  /** Long description shown by the wallet UI. */
  message?: string;
  /** Public on-chain memo attached as an SPL Memo ix. Capped at 80 chars
   *  by the tip rail (see tip.ts::TIP_MEMO_MAX_LENGTH). */
  memo?: string;
}

export function buildSolanaPayUrl(p: SolanaPayParams): string {
  const url = new URL(`solana:${p.recipient.toBase58()}`);
  if (p.amount !== undefined) {
    if (!Number.isFinite(p.amount) || p.amount <= 0) {
      throw new Error('amount must be a positive number');
    }
    // Solana Pay spec: amount is decimal SOL, not lamports.
    url.searchParams.set('amount', p.amount.toString());
  }
  if (p.label) url.searchParams.set('label', p.label);
  if (p.message) url.searchParams.set('message', p.message);
  if (p.memo) {
    if (p.memo.length > 80) throw new Error('memo exceeds 80 chars');
    url.searchParams.set('memo', p.memo);
  }
  return url.toString();
}

export interface ParsedSolanaPay {
  recipient: PublicKey;
  amount?: number;
  label?: string;
  message?: string;
  memo?: string;
}

export function parseSolanaPayUrl(uri: string): ParsedSolanaPay {
  if (!uri.startsWith('solana:')) {
    throw new Error('not a solana: URI');
  }
  // URL parser tolerates `solana:<address>?...` because `solana` is treated
  // as scheme. The pathname becomes the recipient base58 string.
  const url = new URL(uri);
  const recipientStr = url.pathname.replace(/^\/\//, '');
  if (!recipientStr) throw new Error('missing recipient in solana: URI');

  let recipient: PublicKey;
  try {
    recipient = new PublicKey(recipientStr);
  } catch {
    throw new Error(`invalid recipient base58: ${recipientStr}`);
  }

  const amountStr = url.searchParams.get('amount');
  let amount: number | undefined;
  if (amountStr !== null) {
    const parsed = Number(amountStr);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      throw new Error('amount must be a positive number');
    }
    amount = parsed;
  }

  return {
    recipient,
    amount,
    label: url.searchParams.get('label') ?? undefined,
    message: url.searchParams.get('message') ?? undefined,
    memo: url.searchParams.get('memo') ?? undefined,
  };
}

/** Convert a SOL decimal amount into lamports as a bigint, with float-safe
 *  math (no `parseFloat` rounding bug). */
export function solToLamports(sol: number): bigint {
  if (!Number.isFinite(sol) || sol <= 0) {
    throw new Error('sol must be a positive finite number');
  }
  // Multiply via string + integer arithmetic to avoid 0.1 + 0.2 = 0.30000…
  const [whole, fracRaw = ''] = sol.toString().split('.');
  const frac = (fracRaw + '000000000').slice(0, 9); // pad/truncate to 9 dp
  const lamports = BigInt(whole) * 1_000_000_000n + BigInt(frac);
  if (lamports <= 0n) throw new Error('sol must be > 0 lamports');
  return lamports;
}
