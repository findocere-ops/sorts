import type {
  IPrivacyComputeService,
  PrivacyMode,
  PrivateEntitlementResult,
  RegistrationStatus,
  SubscriberRef,
} from '@sorts/shared';
import { SolanaService } from './SolanaService';

/** Day-4 cut-line implementation, updated for v2 subscriber pseudonymization.
 *
 *  Real Umbra integration could not be wired in this devnet build:
 *    - `pnpm exec ts-node backend/scripts/verify-umbra-devnet.ts` returned
 *      "fallback recommended" because Umbra's registration call fails on
 *      devnet ("Transaction simulation failed") and on mainnet without an
 *      MXE account ("MXE account not found on-chain. Cannot determine
 *      cluster offset.").
 *    - Per the cut-line gate we do NOT ship a fake Umbra integration.
 *
 *  v2 (subscriber pseudonymization) — IPrivacyComputeService now takes a
 *  `SubscriberRef` discriminated union instead of a wallet string:
 *    - `wallet`: legacy/EVM path — rejected here because Solana subscriptions
 *      live behind a commitment seed, so the wallet alone is not enough to
 *      locate the PDA. Caller must compute the commitment client-side and
 *      hand the bytes back via `commitment`.
 *    - `commitment`: 32-byte commitment, base64-encoded. Routed to
 *      `SolanaService.checkAccessByCommitment` which reads only the
 *      `expiry_ts` from the on-chain Subscription account.
 *
 *  Privacy invariants still hold:
 *    - Returns ONLY `{ active, expiresAt, privacyMode }`.
 *    - NEVER returns a tier, commitment, salt, or member count.
 *    - NEVER touches a user-supplied seed or ciphertext, so there is
 *      nothing to leak in logs.
 *
 *  When Umbra v2 lands with devnet support, replace the commitment branch
 *  with the encrypted-balance check; the route + UI surfaces stay unchanged.
 *  The `privacyMode` field flips from `'on-chain-commitment-fallback'` to
 *  `'umbra-encrypted-balance'`.
 */
export class UmbraPrivacyService implements IPrivacyComputeService {
  private mode: PrivacyMode = 'on-chain-commitment-fallback';
  private chain: SolanaService;

  constructor(deps?: { chain?: SolanaService; mode?: PrivacyMode }) {
    this.chain = deps?.chain ?? new SolanaService();
    if (deps?.mode) this.mode = deps.mode;
  }

  async evaluateEntitlement(
    community: string,
    subscriber: SubscriberRef,
  ): Promise<PrivateEntitlementResult> {
    if (subscriber.kind === 'wallet') {
      throw new Error(
        'Wallet-based entitlement is not supported on Solana v2. ' +
          'Compute the subscriber commitment client-side (32 bytes, base64) ' +
          'and call again with `subscriber={ kind: "commitment", commitmentBase64 }`.',
      );
    }

    const commitmentBytes = decodeBase64Commitment(subscriber.commitmentBase64);
    const active = await this.chain.checkAccessByCommitment(community, commitmentBytes);
    let expiresAt: string | undefined;
    try {
      const status = await this.chain.getMembershipStatusByCommitment(
        community,
        commitmentBytes,
      );
      expiresAt = status.expiresAt ?? undefined;
    } catch {
      // membership status is best-effort; entitlement still applies.
    }
    return { active, expiresAt, privacyMode: this.mode };
  }

  async getRegistrationStatus(_subscriber: SubscriberRef): Promise<RegistrationStatus> {
    // No external privacy registry exists in fallback mode. Every subscriber
    // is implicitly "registered" because entitlement is derived from on-chain
    // state alone — and on-chain registration happens at subscribe-time.
    return { registered: true, privacyMode: this.mode };
  }
}

/** Parse a base64 commitment string into 32 raw bytes. Throws clear errors so
 *  malformed client input surfaces as a 400 at the route layer rather than as
 *  a generic decoder fault. */
function decodeBase64Commitment(commitmentBase64: string): Uint8Array {
  let buf: Buffer;
  try {
    // Tolerate both base64 and base64url; Node's Buffer accepts both shapes.
    buf = Buffer.from(commitmentBase64.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
  } catch {
    throw new Error('commitmentBase64 is not valid base64');
  }
  if (buf.length !== 32) {
    throw new Error(
      `commitmentBase64 must decode to exactly 32 bytes, got ${buf.length}`,
    );
  }
  return new Uint8Array(buf);
}
