'use client';

/**
 * Cloak SDK orchestration helpers — Tier 1.3 private payment rail.
 *
 * Activates ONLY when `NEXT_PUBLIC_ENABLE_CLOAK_MAINNET=true`. Cloak's
 * on-chain program (`zh1eLd6r…`) is mainnet-only as of 2026-05-07; the
 * devnet build never reaches these helpers because `SolanaChainAdapter`
 * gates the dual-path branch on the env flag.
 *
 * The SDK is dynamically imported on first use to keep the snarkjs +
 * ffjavascript prover bundle out of the base browser payload. Pages that
 * never invoke Cloak (everything except subscribe-page + creator analytics)
 * pay zero bundle cost.
 *
 * Privacy posture:
 * - The subscriber's wallet executes a Cloak `transact()` deposit
 *   followed by two `partialWithdraw()` calls — one to the creator's
 *   regular Solana wallet (the SORTS price minus protocol fee), one to
 *   the protocol treasury wallet (the protocol fee).
 * - Each call is its own Solana transaction; we collect the first 32
 *   bytes of each signature as the on-chain "evidence" recorded in the
 *   Subscription account's `cloak_payment_sigs` slot.
 * - This is INTENTIONALLY softer than a CPI verifier — Cloak does not
 *   expose one. A backend cron service (planned v2; see
 *   docs/SUBMISSION_RISKS.md) polls fresh Subscription accounts and
 *   confirms the recorded signatures resolve to genuine Cloak `transact`
 *   txs that paid the expected amounts to the right recipients. Without
 *   the cron, an attacker on mainnet can fabricate sigs and get a
 *   Subscription account without paying. Hard requirement before any
 *   production mainnet flag-flip.
 *
 * Fee math: per `programs/sorts-community/src/constants.rs`
 * `CLOAK_FEE_ABSORBER = "subscriber"`. The frontend computes the gross
 * lamport amount as `price + cloak_withdraw_fee(price)` and asks the
 * subscriber to deposit the gross. Creator + treasury each receive their
 * SORTS-side share net; Cloak's withdraw fee is a separate line item.
 */

import { PublicKey } from '@solana/web3.js';
import type {
  Connection,
  Transaction,
  TransactionSignature,
  VersionedTransaction,
} from '@solana/web3.js';
import { env } from '@/lib/env';

/** Wallet shape that Cloak's SDK accepts in browser/Next mode. Mirrors the
 *  `@solana/wallet-adapter-react`-style contract: a publicKey plus a
 *  `signTransaction` that preserves the Transaction or VersionedTransaction
 *  type passed in. */
type CloakCompatibleWallet = {
  publicKey: PublicKey;
  signTransaction: <T extends Transaction | VersionedTransaction>(tx: T) => Promise<T>;
};

/** Hard guard so that any accidental call from a devnet build fails fast
 *  with a recognizable message rather than a confusing SDK error. */
function assertCloakActive(): void {
  if (!env.NEXT_PUBLIC_ENABLE_CLOAK_MAINNET) {
    throw new Error(
      'Cloak path called while NEXT_PUBLIC_ENABLE_CLOAK_MAINNET=false. ' +
        "This is a programming error — the SolanaChainAdapter should only " +
        'call into cloak.ts after checking the flag. Check the dual-path ' +
        'branch in SolanaChainAdapter.subscribe / renew.',
    );
  }
}

/** Lazy-load wrapper. Returns the SDK exports we use plus the constants.
 *  The dynamic import is the entire reason this lives in its own module:
 *  it lets Next bundle-split the snarkjs prover out of the base bundle. */
async function loadSdk() {
  // Inline import keeps the snarkjs / ffjavascript / circomlibjs bundle out
  // of pages that don't subscribe (everything except /join/[cid]/subscribe
  // and /studio/[cid]/analytics). The chunk is still big — ~840 KB — but
  // only those two pages pay for it.
  const sdk = await import('@cloak.dev/sdk');
  return sdk;
}

/** Cloak withdraw fee schedule per docs.cloak.ag (2026-05-07):
 *  - Fixed: 0.005 SOL = 5_000_000 lamports.
 *  - Variable: 0.3% of the withdrawn amount.
 *
 *  Caller computes `gross = price + withdrawFee(price)` so subscriber pays
 *  enough to cover both the SORTS price and Cloak's per-withdraw cut.
 */
export function cloakWithdrawFeeLamports(payout_lamports: bigint): bigint {
  const FIXED_FEE = 5_000_000n;
  const variable = (payout_lamports * 30n) / 10_000n; // 0.3%
  return FIXED_FEE + variable;
}

export interface CloakSubscribePayInput {
  connection: Connection;
  /** Wallet adapter providing publicKey + signTransaction. */
  wallet: CloakCompatibleWallet;
  creator: PublicKey;
  treasury: PublicKey;
  /** SORTS price in lamports (creator's share before SORTS protocol fee). */
  priceLamports: bigint;
  /** SORTS protocol fee (5% of priceLamports). */
  feeLamports: bigint;
  /** Same Cloak SDK requirement: viewing-key registration is opt-in for
   *  compliance/scanning. Default off — the demo/MVP doesn't need it. */
  enforceViewingKeyRegistration?: boolean;
}

export interface CloakSubscribePayResult {
  /** First Cloak tx signature (deposit). */
  depositSig: TransactionSignature;
  /** Second Cloak tx signature (withdraw to creator). */
  creatorWithdrawSig: TransactionSignature;
  /** Third Cloak tx signature (withdraw to treasury). */
  treasuryWithdrawSig: TransactionSignature;
  /** 64-byte slot for `cloak_payment_sigs` on the Subscription account.
   *  Format: `(creatorWithdrawSig[0..32] || treasuryWithdrawSig[0..32])`.
   *  See `frontend/src/lib/solana/instructions.ts::buildCloakSigsFromTxSigs`. */
  paymentSigs: Uint8Array;
}

/** End-to-end Cloak deposit + 2× partial withdraw used by
 *  `SolanaChainAdapter.subscribe` when the Cloak flag is on. */
export async function cloakSubscribePay(
  input: CloakSubscribePayInput,
): Promise<CloakSubscribePayResult> {
  assertCloakActive();

  const sdk = await loadSdk();
  const {
    CLOAK_PROGRAM_ID,
    NATIVE_SOL_MINT,
    createUtxo,
    createZeroUtxo,
    generateUtxoKeypair,
    transact,
    partialWithdraw,
  } = sdk;

  // Step 1: deposit gross = price + fee + cloak_withdraw_fee × 2 into a fresh
  // shielded UTXO owned by the subscriber. Two partial withdraws follow.
  const cloakFeePerWithdraw = cloakWithdrawFeeLamports(input.priceLamports + input.feeLamports);
  const grossDeposit =
    input.priceLamports +
    input.feeLamports +
    cloakFeePerWithdraw * 2n; // 2 withdraws (creator + treasury)

  const owner = await generateUtxoKeypair();
  const depositOutput = await createUtxo(grossDeposit, owner, NATIVE_SOL_MINT);

  const baseOptions = {
    connection: input.connection,
    programId: CLOAK_PROGRAM_ID,
    signTransaction: input.wallet.signTransaction,
    walletPublicKey: input.wallet.publicKey,
    depositorPublicKey: input.wallet.publicKey,
  };

  const deposited = await transact(
    {
      inputUtxos: [await createZeroUtxo(NATIVE_SOL_MINT), await createZeroUtxo(NATIVE_SOL_MINT)],
      outputUtxos: [depositOutput, await createZeroUtxo(NATIVE_SOL_MINT)],
      externalAmount: grossDeposit,
      depositor: input.wallet.publicKey,
    },
    baseOptions,
  );

  // Step 2: partial withdraw to creator (priceLamports - feeLamports).
  const creatorPayout = input.priceLamports - input.feeLamports;
  const creatorWithdraw = await partialWithdraw(
    deposited.outputUtxos,
    input.creator,
    creatorPayout,
    baseOptions,
  );

  // Step 3: partial withdraw to treasury (feeLamports).
  const treasuryWithdraw = await partialWithdraw(
    creatorWithdraw.outputUtxos,
    input.treasury,
    input.feeLamports,
    baseOptions,
  );

  // Build the on-chain evidence slot. We use the FIRST 32 bytes of each of
  // the two payout signatures — half-signatures retain enough entropy to
  // uniquely identify the Solana transactions for off-chain verification
  // (the cron service fetches by signature and confirms the rest matches).
  const creatorSigBytes = base58SignatureFirst32(creatorWithdraw.signature);
  const treasurySigBytes = base58SignatureFirst32(treasuryWithdraw.signature);
  const paymentSigs = new Uint8Array(64);
  paymentSigs.set(creatorSigBytes, 0);
  paymentSigs.set(treasurySigBytes, 32);

  return {
    depositSig: deposited.signature,
    creatorWithdrawSig: creatorWithdraw.signature,
    treasuryWithdrawSig: treasuryWithdraw.signature,
    paymentSigs,
  };
}

export interface CloakPayrollWithdrawInput {
  connection: Connection;
  wallet: CloakCompatibleWallet;
  /** UTXO records the creator has accumulated from prior shielded payments.
   *  The frontend must persist these client-side per Cloak's UTXO model
   *  (see `frontend/src/lib/solana/cloak-utxo-store.ts` — planned v2). */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  inputUtxos: any[];
  recipient: PublicKey;
  enforceViewingKeyRegistration?: boolean;
}

/** Creator payroll withdraw — pulls all shielded balance to a regular wallet. */
export async function cloakPayrollWithdraw(
  input: CloakPayrollWithdrawInput,
): Promise<{ signature: TransactionSignature }> {
  assertCloakActive();
  const sdk = await loadSdk();
  const { CLOAK_PROGRAM_ID, fullWithdraw } = sdk;

  const result = await fullWithdraw(input.inputUtxos, input.recipient, {
    connection: input.connection,
    programId: CLOAK_PROGRAM_ID,
    signTransaction: input.wallet.signTransaction,
    walletPublicKey: input.wallet.publicKey,
    depositorPublicKey: input.wallet.publicKey,
  });

  return { signature: result.signature };
}

/** Take the first 32 bytes of a base58-encoded Solana signature.
 *  Solana sigs are 64 bytes; we record half on-chain for space-efficiency.
 *  Off-chain verifier looks up the full sig by prefix-match against
 *  recent Cloak program activity. */
function base58SignatureFirst32(sig: TransactionSignature): Uint8Array {
  // Lazy import bs58 to keep base64-only pages out of its dep graph.
  // bs58 is already a transitive dep of @cloak.dev/sdk, so this never
  // adds a new module to the tree.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const bs58 = require('bs58').default ?? require('bs58');
  const fullBytes: Uint8Array = bs58.decode(sig);
  if (fullBytes.length !== 64) {
    throw new Error(`unexpected signature byte length: ${fullBytes.length}`);
  }
  return fullBytes.slice(0, 32);
}
