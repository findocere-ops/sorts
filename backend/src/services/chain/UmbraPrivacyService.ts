import type {
  IChainService,
  IPrivacyComputeService,
  PrivacyMode,
  PrivateEntitlementResult,
  RegistrationStatus,
} from '@sorts/shared';
import { SolanaService } from './SolanaService';

/** Day-4 cut-line implementation.
 *
 *  Real Umbra integration could not be wired in this devnet build:
 *    - `pnpm exec ts-node backend/scripts/verify-umbra-devnet.ts` returned
 *      "fallback recommended" because Umbra's registration call fails on
 *      devnet ("Transaction simulation failed") and on mainnet without an
 *      MXE account ("MXE account not found on-chain. Cannot determine
 *      cluster offset.").
 *    - Per the cut-line gate we do NOT ship a fake Umbra integration.
 *
 *  This fallback computes entitlement from the on-chain Subscription PDA's
 *  `expiry_ts` written by the Day-1 program. Privacy invariants still hold:
 *    - It returns ONLY `{ active, expiresAt, privacyMode }`.
 *    - It NEVER returns a tier, commitment, salt, or member count.
 *    - It NEVER touches a user-supplied seed or ciphertext, so there is
 *      nothing to leak in logs.
 *
 *  When Umbra v2 lands with devnet support, replace `evaluateEntitlement`
 *  with the encrypted-balance check; the route + UI surfaces stay unchanged.
 *  The `privacyMode` field flips from `'on-chain-commitment-fallback'` to
 *  `'umbra-encrypted-balance'`.
 *
 *  The class name retains "Umbra" in the symbol so the eventual swap is a
 *  one-line change in the implementation rather than a name churn across
 *  every consumer.
 */
export class UmbraPrivacyService implements IPrivacyComputeService {
  private mode: PrivacyMode = 'on-chain-commitment-fallback';
  private chain: IChainService;

  constructor(deps?: { chain?: IChainService; mode?: PrivacyMode }) {
    this.chain = deps?.chain ?? new SolanaService();
    if (deps?.mode) this.mode = deps.mode;
  }

  async evaluateEntitlement(
    community: string,
    subscriber: string,
  ): Promise<PrivateEntitlementResult> {
    // checkAccess returns boolean only; the underlying SolanaService never
    // exposes the tier — see Day-2 privacy assertions.
    const active = await this.chain.checkAccess(community, subscriber, 1);
    let expiresAt: string | undefined;
    try {
      const status = await this.chain.getMembershipStatus(community, subscriber);
      expiresAt = status.expiresAt ?? undefined;
    } catch {
      // membership status is best-effort; entitlement still applies.
    }
    return { active, expiresAt, privacyMode: this.mode };
  }

  async getRegistrationStatus(_subscriber: string): Promise<RegistrationStatus> {
    // No external privacy registry exists in fallback mode. Every wallet is
    // implicitly "registered" because entitlement is derived from on-chain
    // state alone.
    return { registered: true, privacyMode: this.mode };
  }
}
