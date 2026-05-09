/** Privacy-mode discriminator for the IPrivacyComputeService.
 *
 *  - `umbra-encrypted-balance`: real Umbra registration + encrypted entitlement
 *    (Day 4 cut-line target — not active on devnet today).
 *  - `on-chain-commitment-fallback`: derives entitlement from the Subscription
 *    PDA's `tier_commitment` written by the Day-1 program. Privacy is
 *    preserved because no plaintext tier or member count is ever returned.
 *  - `none`: privacy compute disabled (unauthenticated client surface).
 */
export type PrivacyMode =
  | 'umbra-encrypted-balance'
  | 'on-chain-commitment-fallback'
  | 'none';

/** Result of a private entitlement evaluation. NEVER carries a tier number,
 *  ciphertext, or member count. */
export interface PrivateEntitlementResult {
  active: boolean;
  expiresAt?: string; // ISO timestamp, optional
  privacyMode: PrivacyMode;
}

export interface RegistrationStatus {
  registered: boolean;
  privacyMode: PrivacyMode;
}
