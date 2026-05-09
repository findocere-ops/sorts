/**
 * Three-file synchronization round-trip tests.
 *
 *  SORTS uses Quasar with single-byte instruction + account discriminators
 *  (Anchor's default 8-byte sighash coder cannot encode our ix). That
 *  forces three files to stay in lockstep:
 *
 *    1. programs/sorts-community/src/state.rs   — account layout
 *    2. backend/src/services/chain/SolanaService.ts — account decoder
 *    3. frontend/src/lib/solana/instructions.ts — ix data builder
 *
 *  The existing solana-service tests catch decoder shape regressions, but
 *  they do NOT cross-check the frontend ix builder against the backend
 *  decoder against the on-chain layout. This file does.
 *
 *  Each test uses deterministic fixtures so a layout drift makes the test
 *  fail with a *specific* error message naming WHICH file is out of sync.
 *
 *  Add a new test here when adding a new account / instruction. Update an
 *  existing test when changing a layout — that is the WHOLE POINT of the
 *  sync rule.
 */

import { PublicKey, SystemProgram, SYSVAR_CLOCK_PUBKEY, SYSVAR_RENT_PUBKEY } from '@solana/web3.js';
import {
  decodeCommunity,
  decodeSubscription,
} from '../services/chain/SolanaService';
import {
  COMMUNITY_DISCRIMINATOR,
  SUBSCRIPTION_DISCRIMINATOR,
  IX_INITIALIZE_COMMUNITY,
  IX_SUBSCRIBE,
  IX_RENEW_SUBSCRIPTION,
} from '../services/chain/idl/types';

// Frontend ix builders are imported via the cross-tree alias configured in
// `backend/jest.config.js` (`@/(.*)$` → `frontend/src/$1`). The frontend
// file uses `@/lib/env`, `@/lib/solana/program`, `./idl` — all resolvable.
import {
  buildInitializeCommunityIx,
  buildSubscribeIx,
  buildRenewSubscriptionIx,
} from '@/lib/solana/instructions';

// ── Deterministic fixtures (no env, no random) ──────────────────────────────

const PROGRAM_ID = new PublicKey('AEp6VuJqfctTRQpZP3LDjKcua4C1jGP8YT721AMSBkFV');

const CREATOR     = new PublicKey('11111111111111111111111111111112');
const SUBSCRIBER  = new PublicKey('11111111111111111111111111111113');
const COMMUNITY   = new PublicKey('11111111111111111111111111111114');
const SALT_PUBKEY = new PublicKey('11111111111111111111111111111115');
const TREASURY    = new PublicKey('8z2PLCHhGwGU8PHQd1zByD64E4CeZaQuF2NBy3jrdssf');

// v2 fixtures — subscriber pseudonymization. The 32-byte commitment is what the
// program stores in the Subscription account; the nonce is the secret preimage
// known only to the subscriber. In real use the commitment is derived from
// `derive("SORTS_SUB_V1" || subscriber || nonce)`; in tests we use opaque
// fixed bytes because the byte-layout assertions here don't replay the derive.
const SUBSCRIBER_COMMITMENT_BYTES = new Uint8Array(32).fill(0xa5);
const SUBSCRIBER_NONCE_BYTES      = new Uint8Array(32).fill(0x5a);
// v3 fixture — Tier 1.3 Cloak dual-path payment-rail signatures. All-zero
// represents the transparent (devnet) path; non-zero represents Cloak having
// moved funds off-band. The pattern below is intentionally distinct from
// other 64-byte slots so a layout drift surfaces in the failing assertion.
const CLOAK_PAYMENT_SIGS_BYTES    = new Uint8Array(64).fill(0xee);
const CLOAK_PAYMENT_SIGS_ZERO     = new Uint8Array(64);

const NAME_HASH   = new Uint8Array(32).fill(0xa1);
const SYMBOL_HASH = new Uint8Array(32).fill(0xb2);

const TIER_1_PRICE    = 1_000_000n;
const TIER_1_DURATION = 86_400n;
const TIER_2_PRICE    = 5_000_000n;
const TIER_2_DURATION = 86_400n;
const TIER_3_PRICE    = 25_000_000n;
const TIER_3_DURATION = 86_400n;

// ── Hand-built golden buffers (the "third-party witness").
//
//  These mirror programs/sorts-community/src/state.rs verbatim. If the
//  Rust account layout changes WITHOUT updating both the backend decoder
//  and the frontend ix builder, the assertions below diverge in a way the
//  failure message points at.
//
//  This file is the FOURTH file you must update when changing the layout
//  — that is intentional. The test failing IS the signal.

function buildExpectedCommunityBytes(): Buffer {
  // disc(1) + creator(32) + name_hash(32) + symbol_hash(32) + created_at(8)
  // + tier_count(1) + 6×8 (3 tiers × {price u64, duration i64}) + total_members(8)
  // + active_members(8) + total_revenue(8) + bump(1)  =  179
  const data = Buffer.alloc(179);
  let off = 0;
  data.writeUInt8(COMMUNITY_DISCRIMINATOR, off); off += 1;
  Buffer.from(CREATOR.toBuffer()).copy(data, off); off += 32;
  Buffer.from(NAME_HASH).copy(data, off); off += 32;
  Buffer.from(SYMBOL_HASH).copy(data, off); off += 32;
  data.writeBigInt64LE(1_700_000_000n, off); off += 8;     // created_at
  data.writeUInt8(3, off); off += 1;                        // tier_count
  data.writeBigUInt64LE(TIER_1_PRICE, off); off += 8;
  data.writeBigInt64LE(TIER_1_DURATION, off); off += 8;
  data.writeBigUInt64LE(TIER_2_PRICE, off); off += 8;
  data.writeBigInt64LE(TIER_2_DURATION, off); off += 8;
  data.writeBigUInt64LE(TIER_3_PRICE, off); off += 8;
  data.writeBigInt64LE(TIER_3_DURATION, off); off += 8;
  data.writeBigUInt64LE(7n, off); off += 8;                 // total_members
  data.writeBigUInt64LE(5n, off); off += 8;                 // active_members
  data.writeBigUInt64LE(7_000_000n, off); off += 8;         // total_revenue
  data.writeUInt8(254, off);                                 // bump
  return data;
}

function buildExpectedSubscriptionBytes(): Buffer {
  // v3 layout (Tier 1.2 pseudonymization + Tier 1.3 Cloak dual-path):
  // disc(1) + community(32) + subscriber_commitment(32) + expiry_ts(8)
  // + tier_commitment(32) + salt_pubkey(32) + cloak_payment_sigs(64)
  // + bump(1)  =  202
  // Plaintext subscriber pubkey NEVER stored. cloak_payment_sigs is all-zero
  // on the transparent payment path; non-zero on the Cloak path.
  const data = Buffer.alloc(202);
  let off = 0;
  data.writeUInt8(SUBSCRIPTION_DISCRIMINATOR, off); off += 1;
  Buffer.from(COMMUNITY.toBuffer()).copy(data, off); off += 32;
  Buffer.from(SUBSCRIBER_COMMITMENT_BYTES).copy(data, off); off += 32;
  data.writeBigInt64LE(1_800_000_000n, off); off += 8;     // expiry_ts
  Buffer.alloc(32, 0xcc).copy(data, off); off += 32;       // tier_commitment
  Buffer.from(SALT_PUBKEY.toBuffer()).copy(data, off); off += 32;
  Buffer.from(CLOAK_PAYMENT_SIGS_BYTES).copy(data, off); off += 64;
  data.writeUInt8(255, off);                                // bump
  return data;
}

// Helper that fails with a file-specific message rather than a generic
// `expect(...).toBe(...)` blob.
function syncFail(message: string, ...details: string[]): never {
  const lines = ['THREE-FILE SYNC BREAK DETECTED', message, ...details, '',
    'Files that must agree on the byte layout:',
    '  1. programs/sorts-community/src/state.rs   (account / ix args)',
    '  2. backend/src/services/chain/SolanaService.ts   (decoder)',
    '  3. frontend/src/lib/solana/instructions.ts   (ix data builder)',
    '',
    'When changing one of these, change all three in the same commit.',
    'See .claude/AGENT_GUARDRAILS.md "three-file synchronization rule".',
  ];
  throw new Error(lines.join('\n'));
}

// ── Account-layout round-trips ──────────────────────────────────────────────

describe('Community account round-trip', () => {
  it('decodes a hand-built golden buffer per state.rs', () => {
    const golden = buildExpectedCommunityBytes();
    const decoded = decodeCommunity(golden);
    if (!decoded) {
      syncFail(
        'decodeCommunity returned null on a hand-built 179-byte buffer.',
        'Likely cause: backend/src/services/chain/SolanaService.ts decoder',
        'expects a different layout than programs/sorts-community/src/state.rs.',
      );
    }
    if (decoded!.creator.toBase58() !== CREATOR.toBase58()) {
      syncFail(
        'decodeCommunity.creator drift.',
        'Field offset for `creator` disagrees between the golden buffer (state.rs)',
        'and the backend decoder (SolanaService.ts).',
      );
    }
    if (decoded!.tierCount !== 3) syncFail('Community.tier_count offset drift');
    if (decoded!.tier1PriceLamports !== TIER_1_PRICE) syncFail('Community.tier_1_price_lamports offset drift');
    if (decoded!.totalMembersCounter !== 7n) syncFail('Community.total_members_counter offset drift');
    if (decoded!.activeMembersCounter !== 5n) syncFail('Community.active_members_counter offset drift');
    if (decoded!.totalRevenueLamports !== 7_000_000n) syncFail('Community.total_revenue_lamports offset drift');
    if (decoded!.bump !== 254) syncFail('Community.bump offset drift');
    // Hash fields compare byte-by-byte.
    expect(Array.from(decoded!.nameHash)).toEqual(Array.from(NAME_HASH));
    expect(Array.from(decoded!.symbolHash)).toEqual(Array.from(SYMBOL_HASH));
  });

  it('rejects buffers shorter than 179 bytes', () => {
    expect(decodeCommunity(Buffer.alloc(178))).toBeNull();
  });

  it('rejects buffers with the wrong account discriminator', () => {
    const corrupt = buildExpectedCommunityBytes();
    corrupt.writeUInt8(0xfe, 0);
    if (decodeCommunity(corrupt) !== null) {
      syncFail(
        'decodeCommunity accepted a buffer with the wrong account discriminator.',
        'Either the discriminator changed in state.rs without a backend update,',
        'or the decoder no longer enforces the discriminator at byte 0.',
      );
    }
  });
});

describe('Subscription account round-trip (v3 layout)', () => {
  it('decodes a hand-built v3 golden buffer per state.rs', () => {
    const golden = buildExpectedSubscriptionBytes();
    const decoded = decodeSubscription(golden);
    if (!decoded) {
      syncFail(
        'decodeSubscription returned null on a hand-built 202-byte buffer.',
        'Likely cause: backend/src/services/chain/SolanaService.ts decoder',
        'expects a different Subscription layout than programs/sorts-community/src/state.rs.',
      );
    }
    if (decoded!.community.toBase58() !== COMMUNITY.toBase58()) {
      syncFail('Subscription.community offset drift');
    }
    if (
      Buffer.from(decoded!.subscriberCommitment).toString('hex') !==
      Buffer.from(SUBSCRIBER_COMMITMENT_BYTES).toString('hex')
    ) {
      syncFail('Subscription.subscriber_commitment offset drift');
    }
    if (decoded!.expiryTs !== 1_800_000_000n) {
      syncFail('Subscription.expiry_ts offset drift');
    }
    if (decoded!.saltPubkey.toBase58() !== SALT_PUBKEY.toBase58()) {
      syncFail('Subscription.salt_pubkey offset drift');
    }
    if (
      Buffer.from(decoded!.cloakPaymentSigs).toString('hex') !==
      Buffer.from(CLOAK_PAYMENT_SIGS_BYTES).toString('hex')
    ) {
      syncFail(
        'Subscription.cloak_payment_sigs offset drift',
        'Bytes 137..201 of the decoded buffer do not match the golden Cloak sigs pattern.',
      );
    }
    if (decoded!.bump !== 255) syncFail('Subscription.bump offset drift');
    // Privacy invariant: decoded shape must NOT include a plaintext level
    // field OR a plaintext subscriber pubkey field (Tier 1.2 mitigation).
    expect(Object.keys(decoded!).sort()).toEqual([
      'bump', 'cloakPaymentSigs', 'community', 'expiryTs', 'saltPubkey',
      'subscriberCommitment', 'tierCommitment',
    ]);
  });

  it('rejects pre-v3 buffers shorter than 202 bytes (layout-drift guard)', () => {
    expect(decodeSubscription(Buffer.alloc(138))).toBeNull();
    expect(decodeSubscription(Buffer.alloc(201))).toBeNull();
  });

  it('decodes the all-zero (transparent payment path) cloak sigs slot', () => {
    const data = Buffer.alloc(202);
    let off = 0;
    data.writeUInt8(SUBSCRIPTION_DISCRIMINATOR, off); off += 1;
    Buffer.from(COMMUNITY.toBuffer()).copy(data, off); off += 32;
    Buffer.from(SUBSCRIBER_COMMITMENT_BYTES).copy(data, off); off += 32;
    data.writeBigInt64LE(1_800_000_000n, off); off += 8;
    Buffer.alloc(32, 0xcc).copy(data, off); off += 32;
    Buffer.from(SALT_PUBKEY.toBuffer()).copy(data, off); off += 32;
    Buffer.from(CLOAK_PAYMENT_SIGS_ZERO).copy(data, off); off += 64;
    data.writeUInt8(254, off);

    const decoded = decodeSubscription(data)!;
    expect(decoded.cloakPaymentSigs.length).toBe(64);
    expect(decoded.cloakPaymentSigs.every((b) => b === 0)).toBe(true);
  });
});

// ── Frontend ix builder × backend layout cross-check ────────────────────────

describe('initializeCommunity ix data — frontend builder vs state.rs layout', () => {
  it('emits the documented byte layout', () => {
    const ix = buildInitializeCommunityIx({
      creator: CREATOR,
      nameHash: NAME_HASH,
      symbolHash: SYMBOL_HASH,
      tierCount: 3,
      tier1PriceLamports: TIER_1_PRICE,
      tier1DurationSecs: TIER_1_DURATION,
      tier2PriceLamports: TIER_2_PRICE,
      tier2DurationSecs: TIER_2_DURATION,
      tier3PriceLamports: TIER_3_PRICE,
      tier3DurationSecs: TIER_3_DURATION,
    });

    if (ix.programId.toBase58() !== PROGRAM_ID.toBase58()) {
      syncFail(
        'initialize_community ix programId mismatch.',
        `Expected ${PROGRAM_ID.toBase58()}, got ${ix.programId.toBase58()}.`,
        'Cause: frontend/src/lib/solana/program.ts SORTS_PROGRAM_ID_DEFAULT or env',
        'NEXT_PUBLIC_SOLANA_PROGRAM_ID is wrong, or the deployed id changed.',
      );
    }

    const data = ix.data;
    if (data.length !== 114) {
      syncFail(
        `initialize_community ix data length mismatch: expected 114, got ${data.length}.`,
        'Layout per state.rs: 1 disc + 32 name_hash + 32 symbol_hash + 1 tier_count + 6×8 = 114.',
        'Cause: frontend ix builder and state.rs disagree on the args layout.',
      );
    }

    // Discriminator
    if (data.readUInt8(0) !== IX_INITIALIZE_COMMUNITY) {
      syncFail(
        `initialize_community ix discriminator mismatch.`,
        `Expected ${IX_INITIALIZE_COMMUNITY}, got ${data.readUInt8(0)}.`,
        'Cause: programs/sorts-community/src/lib.rs `#[instruction(discriminator = N)]`',
        'changed without updating frontend instructions.ts (or vice versa).',
      );
    }

    let off = 1;
    expect(Array.from(data.subarray(off, off + 32))).toEqual(Array.from(NAME_HASH));
    off += 32;
    expect(Array.from(data.subarray(off, off + 32))).toEqual(Array.from(SYMBOL_HASH));
    off += 32;
    if (data.readUInt8(off) !== 3) {
      syncFail('initialize_community.tier_count offset drift');
    }
    off += 1;
    if (data.readBigUInt64LE(off) !== TIER_1_PRICE) syncFail('tier_1_price_lamports offset drift');
    off += 8;
    if (data.readBigInt64LE(off) !== TIER_1_DURATION) syncFail('tier_1_duration_secs offset drift');

    // Account ordering must match the program's #[derive(Accounts)] struct.
    // initialize_community.rs order:
    //   creator (signer + writable)
    //   community (PDA, writable)
    //   clock (Sysvar)
    //   rent (Sysvar)
    //   system_program (Program)
    expect(ix.keys.length).toBe(5);
    expect(ix.keys[0].pubkey.toBase58()).toBe(CREATOR.toBase58());
    expect(ix.keys[0].isSigner).toBe(true);
    expect(ix.keys[0].isWritable).toBe(true);
    expect(ix.keys[2].pubkey.toBase58()).toBe(SYSVAR_CLOCK_PUBKEY.toBase58());
    expect(ix.keys[3].pubkey.toBase58()).toBe(SYSVAR_RENT_PUBKEY.toBase58());
    expect(ix.keys[4].pubkey.toBase58()).toBe(SystemProgram.programId.toBase58());
  });
});

describe('subscribe ix data — frontend builder vs state.rs layout (v3)', () => {
  it('emits the documented byte layout: disc + level + commitment + nonce + salt + cloak_sigs', () => {
    const ix = buildSubscribeIx({
      subscriber: SUBSCRIBER,
      community: COMMUNITY,
      creator: CREATOR,
      level: 1,
      commitment: SUBSCRIBER_COMMITMENT_BYTES,
      nonce: SUBSCRIBER_NONCE_BYTES,
      saltPubkey: SALT_PUBKEY,
      cloakPaymentSigs: CLOAK_PAYMENT_SIGS_BYTES,
    });

    // v3 layout: 1 disc + 1 level + 32 commitment + 32 nonce + 32 salt + 64 cloak_sigs = 162.
    if (ix.data.length !== 162) {
      syncFail(
        `subscribe ix data length mismatch: expected 162 (1+1+32+32+32+64), got ${ix.data.length}.`,
      );
    }
    if (ix.data.readUInt8(0) !== IX_SUBSCRIBE) {
      syncFail(`subscribe ix discriminator mismatch (expected ${IX_SUBSCRIBE}, got ${ix.data.readUInt8(0)})`);
    }
    if (ix.data.readUInt8(1) !== 1) syncFail('subscribe.level offset drift');
    expect(Array.from(ix.data.subarray(2, 34))).toEqual(Array.from(SUBSCRIBER_COMMITMENT_BYTES));
    expect(Array.from(ix.data.subarray(34, 66))).toEqual(Array.from(SUBSCRIBER_NONCE_BYTES));
    expect(Array.from(ix.data.subarray(66, 98))).toEqual(Array.from(SALT_PUBKEY.toBuffer()));
    expect(Array.from(ix.data.subarray(98, 162))).toEqual(Array.from(CLOAK_PAYMENT_SIGS_BYTES));

    // Account order per programs/sorts-community/src/instructions/subscribe.rs:
    //   subscriber, community, subscription, protocol_treasury, creator,
    //   clock, rent, system_program
    if (ix.keys.length !== 8) {
      syncFail(
        `subscribe ix account count mismatch: expected 8, got ${ix.keys.length}.`,
        'Cause: subscribe.rs account list and frontend ix builder disagree.',
      );
    }
    expect(ix.keys[0].pubkey.toBase58()).toBe(SUBSCRIBER.toBase58());
    expect(ix.keys[1].pubkey.toBase58()).toBe(COMMUNITY.toBase58());
    expect(ix.keys[3].pubkey.toBase58()).toBe(TREASURY.toBase58());
    expect(ix.keys[4].pubkey.toBase58()).toBe(CREATOR.toBase58());
    expect(ix.keys[5].pubkey.toBase58()).toBe(SYSVAR_CLOCK_PUBKEY.toBase58());
    expect(ix.keys[7].pubkey.toBase58()).toBe(SystemProgram.programId.toBase58());
  });

  it('emits an all-zero cloak_payment_sigs slot on the transparent (devnet) path', () => {
    const ix = buildSubscribeIx({
      subscriber: SUBSCRIBER,
      community: COMMUNITY,
      creator: CREATOR,
      level: 1,
      commitment: SUBSCRIBER_COMMITMENT_BYTES,
      nonce: SUBSCRIBER_NONCE_BYTES,
      saltPubkey: SALT_PUBKEY,
      cloakPaymentSigs: CLOAK_PAYMENT_SIGS_ZERO,
    });
    expect(ix.data.length).toBe(162);
    const sigsSlot = ix.data.subarray(98, 162);
    expect(sigsSlot.every((b) => b === 0)).toBe(true);
  });

  it('refuses level=0 and level=4 (privacy invariant: 1..=3 only)', () => {
    expect(() => buildSubscribeIx({
      subscriber: SUBSCRIBER, community: COMMUNITY, creator: CREATOR,
      level: 0,
      commitment: SUBSCRIBER_COMMITMENT_BYTES,
      nonce: SUBSCRIBER_NONCE_BYTES,
      saltPubkey: SALT_PUBKEY,
      cloakPaymentSigs: CLOAK_PAYMENT_SIGS_ZERO,
    })).toThrow();
    expect(() => buildSubscribeIx({
      subscriber: SUBSCRIBER, community: COMMUNITY, creator: CREATOR,
      level: 4,
      commitment: SUBSCRIBER_COMMITMENT_BYTES,
      nonce: SUBSCRIBER_NONCE_BYTES,
      saltPubkey: SALT_PUBKEY,
      cloakPaymentSigs: CLOAK_PAYMENT_SIGS_ZERO,
    })).toThrow();
  });

  it('refuses commitment, nonce, or cloak_payment_sigs of wrong byte length', () => {
    expect(() => buildSubscribeIx({
      subscriber: SUBSCRIBER, community: COMMUNITY, creator: CREATOR,
      level: 1,
      commitment: new Uint8Array(31),
      nonce: SUBSCRIBER_NONCE_BYTES,
      saltPubkey: SALT_PUBKEY,
      cloakPaymentSigs: CLOAK_PAYMENT_SIGS_ZERO,
    })).toThrow();
    expect(() => buildSubscribeIx({
      subscriber: SUBSCRIBER, community: COMMUNITY, creator: CREATOR,
      level: 1,
      commitment: SUBSCRIBER_COMMITMENT_BYTES,
      nonce: new Uint8Array(33),
      saltPubkey: SALT_PUBKEY,
      cloakPaymentSigs: CLOAK_PAYMENT_SIGS_ZERO,
    })).toThrow();
    expect(() => buildSubscribeIx({
      subscriber: SUBSCRIBER, community: COMMUNITY, creator: CREATOR,
      level: 1,
      commitment: SUBSCRIBER_COMMITMENT_BYTES,
      nonce: SUBSCRIBER_NONCE_BYTES,
      saltPubkey: SALT_PUBKEY,
      cloakPaymentSigs: new Uint8Array(63),
    })).toThrow();
  });
});

describe('renewSubscription ix data — frontend builder vs state.rs layout (v3)', () => {
  it('emits the documented byte layout: disc + level + commitment + nonce + cloak_sigs', () => {
    const ix = buildRenewSubscriptionIx({
      subscriber: SUBSCRIBER,
      community: COMMUNITY,
      creator: CREATOR,
      level: 2,
      commitment: SUBSCRIBER_COMMITMENT_BYTES,
      nonce: SUBSCRIBER_NONCE_BYTES,
      cloakPaymentSigs: CLOAK_PAYMENT_SIGS_BYTES,
    });
    // v3 layout: 1 disc + 1 level + 32 commitment + 32 nonce + 64 cloak_sigs = 130.
    if (ix.data.length !== 130) {
      syncFail(`renew ix data length mismatch: expected 130 (1+1+32+32+64), got ${ix.data.length}.`);
    }
    if (ix.data.readUInt8(0) !== IX_RENEW_SUBSCRIPTION) {
      syncFail(`renew ix discriminator mismatch (expected ${IX_RENEW_SUBSCRIPTION}, got ${ix.data.readUInt8(0)})`);
    }
    if (ix.data.readUInt8(1) !== 2) syncFail('renew.level offset drift');
    expect(Array.from(ix.data.subarray(2, 34))).toEqual(Array.from(SUBSCRIBER_COMMITMENT_BYTES));
    expect(Array.from(ix.data.subarray(34, 66))).toEqual(Array.from(SUBSCRIBER_NONCE_BYTES));
    expect(Array.from(ix.data.subarray(66, 130))).toEqual(Array.from(CLOAK_PAYMENT_SIGS_BYTES));

    // Account order per renew_subscription.rs (no rent — renew is mut, not init):
    //   subscriber, community, subscription, protocol_treasury, creator,
    //   clock, system_program
    if (ix.keys.length !== 7) {
      syncFail(
        `renew ix account count mismatch: expected 7, got ${ix.keys.length}.`,
        'Cause: renew_subscription.rs account list and frontend ix builder disagree.',
      );
    }
    expect(ix.keys[0].pubkey.toBase58()).toBe(SUBSCRIBER.toBase58());
    expect(ix.keys[3].pubkey.toBase58()).toBe(TREASURY.toBase58());
    expect(ix.keys[5].pubkey.toBase58()).toBe(SYSVAR_CLOCK_PUBKEY.toBase58());
    expect(ix.keys[6].pubkey.toBase58()).toBe(SystemProgram.programId.toBase58());
  });

  it('emits an all-zero cloak_payment_sigs slot on the transparent (devnet) renewal path', () => {
    const ix = buildRenewSubscriptionIx({
      subscriber: SUBSCRIBER,
      community: COMMUNITY,
      creator: CREATOR,
      level: 2,
      commitment: SUBSCRIBER_COMMITMENT_BYTES,
      nonce: SUBSCRIBER_NONCE_BYTES,
      cloakPaymentSigs: CLOAK_PAYMENT_SIGS_ZERO,
    });
    expect(ix.data.length).toBe(130);
    const sigsSlot = ix.data.subarray(66, 130);
    expect(sigsSlot.every((b) => b === 0)).toBe(true);
  });
});

// ── Discriminator collision guard ───────────────────────────────────────────

describe('discriminator allocation', () => {
  it('account and instruction discriminators do not collide and are non-event', () => {
    // Per security-auditor checklist item #1 + #2.
    const accountDiscs = [COMMUNITY_DISCRIMINATOR, SUBSCRIPTION_DISCRIMINATOR];
    const ixDiscs = [IX_INITIALIZE_COMMUNITY, IX_SUBSCRIBE, IX_RENEW_SUBSCRIPTION];
    for (const d of [...accountDiscs, ...ixDiscs]) {
      if (d === 0xff) syncFail(`Discriminator ${d} reserved for events in Quasar.`);
    }
    expect(new Set(accountDiscs).size).toBe(accountDiscs.length);
    expect(new Set(ixDiscs).size).toBe(ixDiscs.length);
  });
});
