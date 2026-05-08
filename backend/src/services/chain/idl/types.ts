// Hand-written TypeScript types for the sorts_community Solana program.
// Mirrors programs/sorts-community/src/state.rs verbatim.
//
// Why hand-written: Quasar's `quasar idl` command returns an opaque Anyhow
// error on the pinned revision; we wrote the JSON IDL manually and these
// types track it. If a future Quasar release fixes IDL generation we can
// swap to the auto-generated client without touching call-sites.

import type { PublicKey } from '@solana/web3.js';

/** Community.discriminator = 1. */
export const COMMUNITY_DISCRIMINATOR = 1;
/** Subscription.discriminator = 3. */
export const SUBSCRIPTION_DISCRIMINATOR = 3;

/** Instruction discriminators — see programs/sorts-community/src/lib.rs. */
export const IX_INITIALIZE_COMMUNITY = 0;
export const IX_SUBSCRIBE = 1;
export const IX_RENEW_SUBSCRIPTION = 2;

/** Mirrors `Community` in src/state.rs. */
export interface CommunityAccount {
  creator: PublicKey;
  nameHash: Uint8Array; // [u8; 32]
  symbolHash: Uint8Array; // [u8; 32]
  createdAt: bigint; // i64 unix seconds
  tierCount: number; // u8 (1..=3)
  tier1PriceLamports: bigint;
  tier1DurationSecs: bigint;
  tier2PriceLamports: bigint;
  tier2DurationSecs: bigint;
  tier3PriceLamports: bigint;
  tier3DurationSecs: bigint;
  totalMembersCounter: bigint;
  activeMembersCounter: bigint;
  totalRevenueLamports: bigint;
  bump: number;
}

/** Mirrors `Subscription` in src/state.rs (v3 — pseudonymous + Cloak dual-path).
 *
 * Privacy posture:
 *
 * **Tier 1.2 (subscriber identity)** — `subscriberCommitment` replaces the
 * plaintext subscriber pubkey:
 *  - Account holds `subscriberCommitment = derive("SORTS_SUB_V1" ||
 *    subscriber_pubkey || nonce)`. The nonce is a 32-byte secret derived
 *    client-side from `sha256(wallet.signMessage("SORTS-NONCE-V1:" ||
 *    community_pubkey))`. ed25519 signatures are deterministic (RFC 8032), so
 *    the subscriber re-derives the same nonce on every visit without backend
 *    or browser state.
 *
 * **Tier 1.3 (payment-rail privacy)** — `cloakPaymentSigs` records the Cloak
 * transfer signatures when the subscriber paid via Cloak:
 *  - All-zero (default, devnet) → transparent `system_program::transfer`
 *    payment moved funds. Lamport movement visible on Solana Explorer
 *    (Tier 1.3 leak intentionally documented).
 *  - Non-zero (mainnet, Cloak path) → payment moved off-band via Cloak; the
 *    program recorded the two 32-byte transfer signatures concatenated. An
 *    off-chain verifier (planned v2 cron) confirms the recorded signatures
 *    resolve to genuine Cloak `transact` calls. Cloak's program is mainnet-
 *    only, so this slot is all-zero on devnet builds.
 *
 * **Tier-level secrecy** — `tierCommitment` is the derive over
 * `("SORTS_TIER_V1", level, saltPubkey)`. Plaintext level never stored.
 *
 * Account size 202 bytes (was 138 in v2).
 */
export interface SubscriptionAccount {
  community: PublicKey;
  subscriberCommitment: Uint8Array; // [u8; 32]
  expiryTs: bigint; // i64 unix seconds
  tierCommitment: Uint8Array; // [u8; 32]
  saltPubkey: PublicKey;
  cloakPaymentSigs: Uint8Array; // [u8; 64] — all-zero on transparent path
  bump: number;
}

/** Aggregate-only view derived from Community counters.
 * Mirrors the Rust `aggregate_stats` helper. */
export interface AggregateStatsView {
  totalMembers: bigint;
  activeMembers: bigint;
  totalRevenueLamports: bigint;
}

/** Result of `check_access` (off-chain projection). */
export interface AccessView {
  active: boolean;
  expiryTs: bigint;
}
