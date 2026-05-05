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

export function deriveSubscriptionPda(community: PublicKey, subscriber: PublicKey): { pda: PublicKey; bump: number } {
  const programId = getSortsProgramId();
  const [pda, bump] = PublicKey.findProgramAddressSync(
    [Buffer.from('subscription'), community.toBuffer(), subscriber.toBuffer()],
    programId,
  );
  return { pda, bump };
}

export const PROTOCOL_TREASURY = new PublicKey('8z2PLCHhGwGU8PHQd1zByD64E4CeZaQuF2NBy3jrdssf');
