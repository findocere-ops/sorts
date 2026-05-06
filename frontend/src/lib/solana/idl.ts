/**
 * Re-exports the hand-written sorts_community IDL from the backend, plus
 * convenience type aliases. The IDL is hand-written because Quasar's
 * `quasar idl` command returns an opaque error on the pinned revision; see
 * backend/src/services/chain/idl/sorts_community.json for the source of truth.
 *
 * Note: the IDL uses single-byte discriminators (Quasar) rather than Anchor's
 * 8-byte sighash. The default `@coral-xyz/anchor` Program coder will NOT
 * encode our instructions correctly. We use Anchor only for type generation
 * and BorshCoder for primitive (de)serialization helpers. Tx data is built
 * by hand in `instructions.ts`.
 */

import idlJson from '../../../../backend/src/services/chain/idl/sorts_community.json';

export const SORTS_COMMUNITY_IDL = idlJson as unknown as {
  address: string;
  metadata: { name: string; version: string; spec: string; description?: string };
  instructions: Array<{
    name: string;
    discriminator: number[];
    accounts: Array<{ name: string; writable?: boolean; signer?: boolean; address?: string }>;
    args: Array<{ name: string; type: unknown }>;
  }>;
  accounts: Array<{ name: string; discriminator: number[]; type: unknown }>;
  errors: Array<{ code: number; name: string; msg: string }>;
};

export const COMMUNITY_DISCRIMINATOR = 1 as const;
export const SUBSCRIPTION_DISCRIMINATOR = 3 as const;

export const IX_INITIALIZE_COMMUNITY = 0 as const;
export const IX_SUBSCRIBE = 1 as const;
export const IX_RENEW_SUBSCRIPTION = 2 as const;

export const SORTS_PROGRAM_ID_DEFAULT = SORTS_COMMUNITY_IDL.address;
