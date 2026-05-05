'use client';

import {
  PublicKey,
  SystemProgram,
  SYSVAR_CLOCK_PUBKEY,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
} from '@solana/web3.js';
import {
  IX_INITIALIZE_COMMUNITY,
  IX_RENEW_SUBSCRIPTION,
  IX_SUBSCRIBE,
} from './idl';
import {
  PROTOCOL_TREASURY,
  deriveCommunityPda,
  deriveSubscriptionPda,
  getSortsProgramId,
} from './program';

/** keccak-style 32-byte hash of a UTF-8 string, computed in the browser via
 *  WebCrypto. We use SHA-256 here (not keccak) because the Solana program
 *  stores the hash as opaque [u8;32] and never recomputes it on-chain — the
 *  only requirement is that the same plaintext produces the same digest at
 *  call sites (frontend now, backend if it ever reproduces). */
export async function hash32(input: string): Promise<Uint8Array> {
  const bytes = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest('SHA-256', bytes);
  return new Uint8Array(buf);
}

export interface InitializeCommunityArgs {
  creator: PublicKey;
  nameHash: Uint8Array; // 32 bytes
  symbolHash: Uint8Array; // 32 bytes
  tierCount: number; // 1..=3
  tier1PriceLamports: bigint;
  tier1DurationSecs: bigint;
  tier2PriceLamports: bigint;
  tier2DurationSecs: bigint;
  tier3PriceLamports: bigint;
  tier3DurationSecs: bigint;
}

/** Builds the initialize_community ix. Account order mirrors
 *  programs/sorts-community/src/instructions/initialize_community.rs. */
export function buildInitializeCommunityIx(args: InitializeCommunityArgs): TransactionInstruction {
  if (args.nameHash.length !== 32) throw new Error('nameHash must be 32 bytes');
  if (args.symbolHash.length !== 32) throw new Error('symbolHash must be 32 bytes');
  if (args.tierCount < 1 || args.tierCount > 3) throw new Error('tierCount must be 1..=3');

  const { pda: community } = deriveCommunityPda(args.creator);
  const programId = getSortsProgramId();

  // ix layout: [u8 disc][u8;32 name_hash][u8;32 symbol_hash][u8 tier_count]
  //             [u64 t1_price][i64 t1_dur]
  //             [u64 t2_price][i64 t2_dur]
  //             [u64 t3_price][i64 t3_dur]
  // Total: 1 + 32 + 32 + 1 + 6*8 = 114 bytes.
  const data = Buffer.alloc(114);
  let off = 0;
  data.writeUInt8(IX_INITIALIZE_COMMUNITY, off); off += 1;
  Buffer.from(args.nameHash).copy(data, off); off += 32;
  Buffer.from(args.symbolHash).copy(data, off); off += 32;
  data.writeUInt8(args.tierCount, off); off += 1;
  data.writeBigUInt64LE(args.tier1PriceLamports, off); off += 8;
  data.writeBigInt64LE(args.tier1DurationSecs, off); off += 8;
  data.writeBigUInt64LE(args.tier2PriceLamports, off); off += 8;
  data.writeBigInt64LE(args.tier2DurationSecs, off); off += 8;
  data.writeBigUInt64LE(args.tier3PriceLamports, off); off += 8;
  data.writeBigInt64LE(args.tier3DurationSecs, off); off += 8;

  return new TransactionInstruction({
    programId,
    keys: [
      { pubkey: args.creator, isSigner: true, isWritable: true },
      { pubkey: community, isSigner: false, isWritable: true },
      { pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false },
      { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data,
  });
}

export interface SubscribeArgs {
  subscriber: PublicKey;
  community: PublicKey;
  creator: PublicKey;
  level: number; // 1..=tier_count
  saltPubkey: PublicKey;
}

export function buildSubscribeIx(args: SubscribeArgs): TransactionInstruction {
  if (args.level < 1 || args.level > 3) throw new Error('level must be 1..=3');
  const { pda: subscription } = deriveSubscriptionPda(args.community, args.subscriber);
  const programId = getSortsProgramId();

  // ix layout: [u8 disc][u8 level][pubkey salt = 32 bytes]
  const data = Buffer.alloc(34);
  let off = 0;
  data.writeUInt8(IX_SUBSCRIBE, off); off += 1;
  data.writeUInt8(args.level, off); off += 1;
  Buffer.from(args.saltPubkey.toBuffer()).copy(data, off);

  return new TransactionInstruction({
    programId,
    keys: [
      { pubkey: args.subscriber, isSigner: true, isWritable: true },
      { pubkey: args.community, isSigner: false, isWritable: true },
      { pubkey: subscription, isSigner: false, isWritable: true },
      { pubkey: PROTOCOL_TREASURY, isSigner: false, isWritable: true },
      { pubkey: args.creator, isSigner: false, isWritable: true },
      { pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false },
      { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data,
  });
}

export interface RenewArgs {
  subscriber: PublicKey;
  community: PublicKey;
  creator: PublicKey;
  level: number;
}

export function buildRenewSubscriptionIx(args: RenewArgs): TransactionInstruction {
  if (args.level < 1 || args.level > 3) throw new Error('level must be 1..=3');
  const { pda: subscription } = deriveSubscriptionPda(args.community, args.subscriber);
  const programId = getSortsProgramId();

  const data = Buffer.alloc(2);
  data.writeUInt8(IX_RENEW_SUBSCRIPTION, 0);
  data.writeUInt8(args.level, 1);

  return new TransactionInstruction({
    programId,
    keys: [
      { pubkey: args.subscriber, isSigner: true, isWritable: true },
      { pubkey: args.community, isSigner: false, isWritable: true },
      { pubkey: subscription, isSigner: false, isWritable: true },
      { pubkey: PROTOCOL_TREASURY, isSigner: false, isWritable: true },
      { pubkey: args.creator, isSigner: false, isWritable: true },
      { pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data,
  });
}
