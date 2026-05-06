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

/** Mirrors `Subscription` in src/state.rs (v2 — pseudonymous).
 *
 * Privacy posture (Tier 1.2 mitigation):
 *  - The plaintext subscriber pubkey is NOT stored on the account. Instead the
 *    account body holds `subscriberCommitment = derive("SORTS_SUB_V1" ||
 *    subscriber_pubkey || nonce)`. The nonce is a 32-byte secret derived
 *    client-side from `sha256(wallet.signMessage("SORTS-NONCE-V1:" ||
 *    community_pubkey))`. ed25519 signatures are deterministic (RFC 8032), so
 *    the subscriber re-derives the same nonce on every visit without backend
 *    or browser state.
 *  - `tierCommitment` is keccak/PDA-style derive over
 *    `("SORTS_TIER_V1", level, saltPubkey)`. The plaintext level is never
 *    stored — only this commitment plus the salt that lets the holder
 *    recompute it.
 */
export interface SubscriptionAccount {
  community: PublicKey;
  subscriberCommitment: Uint8Array; // [u8; 32]
  expiryTs: bigint; // i64 unix seconds
  tierCommitment: Uint8Array; // [u8; 32]
  saltPubkey: PublicKey;
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
