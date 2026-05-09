'use client';

/**
 * /tip/[recipient]?amount=&label=&message=&memo=
 *
 * Desktop fallback for the Solana Pay tip flow. Mobile wallets parse
 * `solana:<recipient>?…` URIs natively — this page exists so:
 *   1. Desktop users can paste a creator's pubkey + tip amount.
 *   2. The Solana Pay URI's `label` / `message` params have a renderable
 *      surface in case the wallet client doesn't show them.
 *
 * Privacy posture: identical to `TipButton` — the active payment-rail
 * (transparent on devnet, Cloak on mainnet) decides what is shielded.
 * The page renders <PrivacyModeBadge variant="full"> so the user sees
 * what the active rail does before they confirm.
 */

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { PrivacyModeBadge } from '@/components/badges/PrivacyModeBadge';
import { TipButton } from '@/components/tip/TipButton';

export default function TipPage({ params }: { params: { recipient: string } }) {
  return (
    <PublicLayout>
      <Suspense fallback={null}>
        <TipPageInner recipient={params.recipient} />
      </Suspense>
    </PublicLayout>
  );
}

function TipPageInner({ recipient }: { recipient: string }) {
  const search = useSearchParams();
  const label = search.get('label') ?? undefined;
  const message = search.get('message') ?? undefined;

  return (
    <main
      style={{
        maxWidth: 560,
        margin: '0 auto',
        padding: '40px 24px',
        display: 'grid',
        gap: 18,
      }}
    >
      <header>
        <p
          className="t-label"
          style={{
            color: 'var(--cyan)',
            textTransform: 'uppercase',
            fontSize: 11,
            letterSpacing: 0.5,
            marginBottom: 6,
          }}
        >
          Solana Pay tip
        </p>
        <h1 className="t-h1" style={{ fontSize: 24, margin: 0 }}>
          {label ? `Tip ${label}` : 'Send a tip'}
        </h1>
        {message && (
          <p
            style={{
              fontSize: 13,
              color: 'var(--text-2)',
              marginTop: 8,
              lineHeight: 1.55,
            }}
          >
            {message}
          </p>
        )}
      </header>

      <PrivacyModeBadge variant="full" />

      <section
        style={{
          padding: 16,
          borderRadius: 12,
          border: '1px solid var(--border-subtle)',
          background: 'var(--bg-card)',
          fontSize: 13,
          color: 'var(--text-2)',
          lineHeight: 1.55,
        }}
      >
        <div style={{ marginBottom: 6, fontSize: 11, color: 'var(--text-3)' }}>
          Recipient
        </div>
        <code
          style={{
            display: 'block',
            fontSize: 11,
            wordBreak: 'break-all',
            padding: 8,
            borderRadius: 6,
            background: 'var(--bg-elevated)',
            color: 'var(--text-1)',
          }}
        >
          {recipient}
        </code>
      </section>

      <TipButton recipient={recipient} label={label} display="block" />

      <p
        style={{
          fontSize: 11.5,
          color: 'var(--text-3)',
          lineHeight: 1.6,
          textAlign: 'center',
        }}
      >
        Tipping does not grant subscription access. To unlock gated
        content, subscribe via the community page.
      </p>
    </main>
  );
}
