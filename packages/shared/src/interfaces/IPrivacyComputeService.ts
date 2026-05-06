import type { PrivateEntitlementResult, RegistrationStatus } from '../types/privacy';

/** Identifier the privacy compute service uses to look up an entitlement.
 *
 *  - `wallet`: legacy/EVM-style — the subscriber's wallet address. Solana v2
 *    rejects this path because the on-chain account is keyed by a commitment.
 *  - `commitment`: 32-byte subscriber commitment encoded as base64. Computed
 *    client-side from `derive("SORTS_SUB_V1" || subscriber || nonce)` where
 *    the nonce is a deterministic wallet-signature-derived secret.
 */
export type SubscriberRef =
  | { kind: 'wallet'; wallet: string }
  | { kind: 'commitment'; commitmentBase64: string };

/** Boundary that hides the privacy implementation (Umbra v2 vs the on-chain
 *  commitment fallback) from the route layer.
 *
 *  Implementations MUST:
 *    - Return only `{ active, expiresAt?, privacyMode }` from
 *      `evaluateEntitlement` — no tier, no commitment, no salt, no count.
 *    - Treat `register()` and `evaluateEntitlement()` as idempotent.
 *    - Never log seed material, ciphertext, or signature blobs.
 *    - For Solana v2 chains: accept only `SubscriberRef.commitment`. The
 *      wallet-based variant must throw with a redirect message.
 */
export interface IPrivacyComputeService {
  evaluateEntitlement(
    community: string,
    subscriber: SubscriberRef,
  ): Promise<PrivateEntitlementResult>;

  getRegistrationStatus(subscriber: SubscriberRef): Promise<RegistrationStatus>;
}
