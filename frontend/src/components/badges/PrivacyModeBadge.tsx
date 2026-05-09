'use client';

/**
 * Privacy-mode badge — renders the active payment-rail label sourced from
 * `lib/solana/privacy-mode.ts::getActivePaymentMode()`. Dropping this on
 * any payment surface (subscribe button, tip modal, payroll widget,
 * analytics page) keeps the wording honest and consistent.
 *
 * Usage:
 *   <PrivacyModeBadge />            // active mode (env-driven)
 *   <PrivacyModeBadge mode="cloak-mainnet" />  // explicit preview
 */

import {
  getActivePaymentMode,
  getPaymentModeDescriptor,
  type PaymentMode,
} from '@/lib/solana/privacy-mode';

interface PrivacyModeBadgeProps {
  /** Optional explicit mode override (used in previews / docs). When
   *  omitted, the component reads the env-driven active mode. */
  mode?: PaymentMode;
  /** Compact (inline near a button) or full (block-level with tooltip
   *  caption). Default `compact`. */
  variant?: 'compact' | 'full';
}

const TONE_STYLES: Record<
  ReturnType<typeof getActivePaymentMode>['tone'],
  { background: string; color: string; border: string }
> = {
  gray: {
    background: 'rgba(255,255,255,0.06)',
    color: 'var(--text-2)',
    border: '1px solid rgba(255,255,255,0.10)',
  },
  cyan: {
    background: 'rgba(45,232,224,0.10)',
    color: 'var(--cyan)',
    border: '1px solid rgba(45,232,224,0.35)',
  },
  orange: {
    background: 'rgba(255,138,0,0.10)',
    color: 'var(--orange)',
    border: '1px solid rgba(255,138,0,0.35)',
  },
};

export function PrivacyModeBadge({ mode, variant = 'compact' }: PrivacyModeBadgeProps) {
  const descriptor = mode ? getPaymentModeDescriptor(mode) : getActivePaymentMode();
  const tone = TONE_STYLES[descriptor.tone];

  if (variant === 'full') {
    return (
      <div
        title={descriptor.description}
        data-payment-mode={descriptor.mode}
        style={{
          padding: 12,
          borderRadius: 10,
          ...tone,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 6,
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: 0.4,
            textTransform: 'uppercase',
          }}
        >
          <span
            aria-hidden
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: 'currentColor',
              boxShadow: '0 0 6px currentColor',
            }}
          />
          {descriptor.label}
          {descriptor.preAlpha && (
            <span
              style={{
                marginLeft: 'auto',
                fontSize: 10,
                fontWeight: 700,
                background: 'rgba(255,138,0,0.20)',
                color: 'var(--orange)',
                padding: '2px 6px',
                borderRadius: 4,
              }}
            >
              PRE-ALPHA
            </span>
          )}
        </div>
        <p
          style={{
            margin: 0,
            fontSize: 11.5,
            color: 'var(--text-2)',
            lineHeight: 1.5,
          }}
        >
          {descriptor.description}
        </p>
      </div>
    );
  }

  return (
    <span
      title={descriptor.description}
      data-payment-mode={descriptor.mode}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        height: 22,
        padding: '0 8px',
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: 0.4,
        ...tone,
      }}
    >
      <span
        aria-hidden
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: 'currentColor',
          boxShadow: '0 0 6px currentColor',
        }}
      />
      {descriptor.label}
    </span>
  );
}
