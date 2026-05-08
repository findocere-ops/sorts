'use client';

/**
 * Privacy-mode helper — single source of truth for the badge text on every
 * payment surface (subscribe, tip, creator payroll, analytics).
 *
 * Design rule: the helper NEVER returns a label that overstates what the
 * runtime can prove. On devnet we always show `transparent · devnet`.
 * Mainnet flag flips swap the label (and the underlying ix path) in lockstep.
 *
 * Adding a new payment rail (Umbra, IKA, etc.) means a new entry here PLUS
 * a new ix path in `tip.ts` / `cloak.ts` / `umbra.ts`. The helper output
 * cannot drift from the rail it describes — that is the entire point.
 */

import { env } from '@/lib/env';

export type PaymentMode =
  /** Solana `system_program::transfer`. Sender + recipient + amount fully
   *  visible on Solana Explorer. Default on devnet. */
  | 'transparent-devnet'
  /** Cloak-shielded `partialWithdraw` from a deposit pool to recipient.
   *  Activates only when `NEXT_PUBLIC_ENABLE_CLOAK_MAINNET=true`. Cloak's
   *  program is mainnet-only as of 2026-05-07 (see SUBMISSION_RISKS.md R1). */
  | 'cloak-mainnet'
  /** Reserved for future Umbra encrypted-balance path. */
  | 'umbra-mainnet'
  /** Reserved for future IKA dWallet programmable-signer path. */
  | 'ika-pre-alpha';

export interface PaymentModeDescriptor {
  mode: PaymentMode;
  /** Short label rendered in the UI badge. Must NEVER claim privacy that
   *  the active rail does not deliver. */
  label: string;
  /** Long description shown in tooltips / modals when the user hovers. */
  description: string;
  /** Tailwind/CSS hint — `gray` = transparent, `cyan` = shielded, `orange`
   *  = experimental. Component picks colors via this discriminant. */
  tone: 'gray' | 'cyan' | 'orange';
  /** Visible on a `pre-alpha` integration; the badge gets an extra warning
   *  band when true. */
  preAlpha: boolean;
}

const DESCRIPTORS: Record<PaymentMode, PaymentModeDescriptor> = {
  'transparent-devnet': {
    mode: 'transparent-devnet',
    label: 'Payment: transparent · devnet',
    description:
      'Sender, recipient, and amount are visible on Solana Explorer. ' +
      'Devnet build; no real funds. Mainnet activation routes through ' +
      'Cloak for shielded transfer (see SUBMISSION_RISKS.md R1).',
    tone: 'gray',
    preAlpha: false,
  },
  'cloak-mainnet': {
    mode: 'cloak-mainnet',
    label: 'Payment: shielded via Cloak · mainnet',
    description:
      'Cloak SDK orchestrates a deposit + partial withdraw to the ' +
      'recipient. The on-chain trace shows the Cloak shielded pool, not ' +
      'the sender wallet. Active when ENABLE_CLOAK_MAINNET=true.',
    tone: 'cyan',
    preAlpha: false,
  },
  'umbra-mainnet': {
    mode: 'umbra-mainnet',
    label: 'Payment: shielded via Umbra · mainnet',
    description:
      'Reserved for the future Umbra encrypted-balance integration. Not ' +
      'active in any current build.',
    tone: 'cyan',
    preAlpha: true,
  },
  'ika-pre-alpha': {
    mode: 'ika-pre-alpha',
    label: 'Payment: programmable via IKA · pre-alpha',
    description:
      'Reserved for the future IKA dWallet programmable-signer ' +
      'integration. Not active in any current build.',
    tone: 'orange',
    preAlpha: true,
  },
};

/** Return the active payment mode for the current build.
 *
 *  Order of precedence:
 *    1. NEXT_PUBLIC_ENABLE_CLOAK_MAINNET — Cloak path active.
 *    2. (future) NEXT_PUBLIC_ENABLE_UMBRA_MAINNET — Umbra path.
 *    3. (future) NEXT_PUBLIC_ENABLE_IKA_PRE_ALPHA — IKA path.
 *    4. Default: transparent-devnet.
 */
export function getActivePaymentMode(): PaymentModeDescriptor {
  if (env.NEXT_PUBLIC_ENABLE_CLOAK_MAINNET) {
    return DESCRIPTORS['cloak-mainnet'];
  }
  return DESCRIPTORS['transparent-devnet'];
}

/** Resolve a descriptor by explicit mode. Useful for badge previews on a
 *  page that wants to advertise the eventual mainnet behavior even though
 *  the current build is on the transparent path. */
export function getPaymentModeDescriptor(mode: PaymentMode): PaymentModeDescriptor {
  return DESCRIPTORS[mode];
}

/** Negative assertion: the label of the *active* mode never claims privacy
 *  unless the rail actually delivers it. The unit test in
 *  `__tests__/privacy-mode.test.ts` runs this against every mode. */
export function labelClaimsPrivacy(label: string): boolean {
  return /shielded|encrypted|private(?!\b\s+(?:transfer|key))/i.test(label);
}
