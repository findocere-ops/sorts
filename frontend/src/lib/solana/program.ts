'use client';

import { PublicKey } from '@solana/web3.js';
import { env } from '@/lib/env';
import { SORTS_PROGRAM_ID_DEFAULT } from './idl';

let cachedProgramId: PublicKey | null = null;

export function getSortsProgramId(): PublicKey {
  if (cachedProgramId) return cachedProgramId;
  const id = env.NEXT_PUBLIC_SOLANA_PROGRAM_ID ?? SORTS_PROGRAM_ID_DEFAULT;
  cachedProgramId = new PublicKey(id);
  return cachedProgramId;
}

/** Mirrors the on-chain seeds in programs/sorts-community/src/state.rs.
 *  One Community per creator wallet (the Quasar `#[seeds]` derive does not
 *  accept `[u8;32]` typed seed args — this is a documented deviation).
 */
export function deriveCommunityPda(creator: PublicKey): { pda: PublicKey; bump: number } {
  const programId = getSortsProgramId();
  const [pda, bump] = PublicKey.findProgramAddressSync(
    [Buffer.from('community'), creator.toBuffer()],
    programId,
  );
  return { pda, bump };
}

/** Subscription PDA (v2 — pseudonymous):
 *    seeds = [b"subscription", community, subscriber_commitment]
 *  where `subscriber_commitment` is 32 bytes computed from
 *  `derive("SORTS_SUB_V1" || subscriber || nonce)`.
 *  See `deriveSubscriberCommitment` for the canonical commitment derivation. */
export function deriveSubscriptionPda(
  community: PublicKey,
  subscriberCommitment: Uint8Array,
): { pda: PublicKey; bump: number } {
  if (subscriberCommitment.length !== 32) {
    throw new Error('subscriberCommitment must be exactly 32 bytes');
  }
  const programId = getSortsProgramId();
  const [pda, bump] = PublicKey.findProgramAddressSync(
    [Buffer.from('subscription'), community.toBuffer(), Buffer.from(subscriberCommitment)],
    programId,
  );
  return { pda, bump };
}

/** Compute `subscriber_commitment = derive("SORTS_SUB_V1" || subscriber || nonce)`.
 *
 *  Matches `subscriber_commitment` in programs/sorts-community/src/logic.rs.
 *  The on-chain helper uses `Address::derive_address` (PDA derivation) as a
 *  deterministic 32-byte hash; we reproduce it via `findProgramAddressSync`
 *  on the program id. The result is identical to what the program computes.
 */
export function deriveSubscriberCommitment(
  subscriber: PublicKey,
  nonce: Uint8Array,
): Uint8Array {
  if (nonce.length !== 32) throw new Error('nonce must be exactly 32 bytes');
  const programId = getSortsProgramId();
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from('SORTS_SUB_V1'), subscriber.toBuffer(), Buffer.from(nonce)],
    programId,
  );
  return new Uint8Array(pda.toBuffer());
}

/** Derive the subscriber's per-community nonce from a wallet signature.
 *
 *  The canonical message is `"SORTS-NONCE-V1:" || community_pubkey_bytes`.
 *  The wallet signs it (ed25519, deterministic per RFC 8032), and we hash the
 *  signature into the 32-byte nonce. ed25519 is deterministic, so the same
 *  wallet over the same canonical message reproduces the same nonce on every
 *  visit — no backend table or browser localStorage required.
 *
 *  Returns `{ canonicalMessage }` so the caller hands the bytes to
 *  `signMessage(message)` on the wallet adapter, then calls `nonceFromSignature`.
 */
export function buildNonceCanonicalMessage(community: PublicKey): Uint8Array {
  const prefix = new TextEncoder().encode('SORTS-NONCE-V1:');
  const out = new Uint8Array(prefix.length + 32);
  out.set(prefix, 0);
  out.set(community.toBuffer(), prefix.length);
  return out;
}

/** Convert an ed25519 signature into a 32-byte nonce via SHA-256.
 *  Uses WebCrypto so the secret never leaves the browser tab. */
export async function nonceFromSignature(signature: Uint8Array): Promise<Uint8Array> {
  if (signature.length === 0) throw new Error('signature is empty');
  // Re-wrap into a fresh ArrayBuffer-backed Uint8Array so TypeScript narrows
  // away the SharedArrayBuffer branch of `Uint8Array['buffer']`.
  const copy = new Uint8Array(signature.byteLength);
  copy.set(signature);
  const buf = await crypto.subtle.digest('SHA-256', copy.buffer as ArrayBuffer);
  return new Uint8Array(buf);
}

/** Convenience: encode a 32-byte commitment as base64 for transport to the
 *  backend (`/api/privacy/entitlement?commitment=...`). */
export function encodeCommitmentBase64(commitment: Uint8Array): string {
  if (commitment.length !== 32) {
    throw new Error('commitment must be exactly 32 bytes');
  }
  let bin = '';
  for (let i = 0; i < commitment.length; i += 1) {
    bin += String.fromCharCode(commitment[i]);
  }
  return typeof btoa === 'function' ? btoa(bin) : Buffer.from(commitment).toString('base64');
}

export const PROTOCOL_TREASURY = new PublicKey('8z2PLCHhGwGU8PHQd1zByD64E4CeZaQuF2NBy3jrdssf');
