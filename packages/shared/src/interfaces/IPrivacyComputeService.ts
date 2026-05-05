import type { PrivateEntitlementResult, RegistrationStatus } from '../types/privacy';

/** Boundary that hides the privacy implementation (Umbra v2 vs the on-chain
 *  commitment fallback) from the route layer.
 *
 *  Implementations MUST:
 *    - Return only `{ active, expiresAt?, privacyMode }` from
 *      `evaluateEntitlement` — no tier, no commitment, no salt, no count.
 *    - Treat `register()` and `evaluateEntitlement()` as idempotent.
 *    - Never log seed material, ciphertext, or signature blobs.
 */
export interface IPrivacyComputeService {
  evaluateEntitlement(
    community: string,
    subscriber: string,
  ): Promise<PrivateEntitlementResult>;

  getRegistrationStatus(subscriber: string): Promise<RegistrationStatus>;
}
