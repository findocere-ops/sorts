'use client';

import { useSearchParams } from 'next/navigation';
import type { PrivacyMode } from '@sorts/shared';
import { PreAlphaBadge } from '@/components/badges';

/** Day-10 A4 — two render modes for the privacy card.
 *
 *  Default (subscriber view): plain-language sentence; never shows the raw
 *  protocol-mode literal, never shows the kebab-case `tier_commitment` /
 *  `salt` jargon. The subscriber sees one trust-relevant fact: "your
 *  identity and tier are hidden from the creator". The card still carries
 *  the mandatory devnet + Umbra-v2 disclosures.
 *
 *  Developer / press view (opt-in via `?dev=1`): the previous monospace
 *  field row including `Privacy mode: on-chain-commitment-fallback`. Useful
 *  for code reviewers, demo-day reviewers, and anyone debugging the card
 *  in the wild.
 *
 *  Privacy rules unchanged in both views:
 *    - NEVER renders a tier number, commitment value, salt value, or
 *      member count.
 *    - Always renders the devnet badge + the "Umbra v2 in progress" badge
 *      when in fallback mode.
 *    - Always renders the "no real funds" line.
 */
export interface UmbraMembershipCardProps {
  privacyMode: PrivacyMode;
  registered: boolean;
  /** Boolean entitlement only — never a tier or count. */
  active: boolean;
  /** ISO timestamp of when the subscription expires, if known. */
  expiresAt?: string | null;
  /** Optional explicit "creator-marked preview" indicator. Used on the
   *  /join page when a creator has tagged a post as preview-eligible. */
  previewMode?: boolean;
  /** Force developer view regardless of `?dev=1` query param. Useful for
   *  documentation pages. */
  forceDeveloperView?: boolean;
}

export function UmbraMembershipCard({
  privacyMode,
  registered,
  active,
  expiresAt,
  previewMode,
  forceDeveloperView,
}: UmbraMembershipCardProps) {
  const searchParams = useSearchParams();
  const queryDev = searchParams?.get('dev') === '1';
  const isDeveloperView = Boolean(forceDeveloperView || queryDev);

  const isFallback = privacyMode === 'on-chain-commitment-fallback';
  const isUmbra = privacyMode === 'umbra-encrypted-balance';

  return (
    <section
      className="card-elevated"
      data-privacy-mode={privacyMode}
      data-view={isDeveloperView ? 'developer' : 'subscriber'}
      style={{
        display: 'grid',
        gap: 14,
        padding: '20px 22px',
        borderRadius: 14,
        background: 'rgba(8,13,18,0.78)',
        border: '1px solid var(--border-subtle)',
      }}
    >
      <header style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div>
          <p className="t-label" style={{ color: 'var(--cyan)', marginBottom: 6 }}>
            Membership privacy
          </p>
          <h3 className="t-h3" style={{ marginBottom: 4 }}>
            {isUmbra ? 'Hidden from the creator' : 'Hidden from the creator'}
          </h3>
          <p className="t-sm" style={{ color: 'var(--text-2)', maxWidth: 520 }}>
            {isUmbra
              ? 'Your tier and identity are hidden from the creator. The chain stores an encrypted balance, not your tier.'
              : 'Your tier and identity are hidden from the creator dashboard and SORTS APIs. On-chain we use a commitment scheme — encrypted-balance hiding lands in v2 via Umbra.'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <PreAlphaBadge label="Devnet" />
          {isFallback && <PreAlphaBadge label="Umbra v2 in progress" />}
        </div>
      </header>

      {/* Subscriber-friendly summary row — three fields max. Privacy mode
          literal + registered flag are developer-only. */}
      <dl
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 12,
          margin: 0,
        }}
      >
        <Field label="Status" value={active ? 'Active' : 'Inactive'} />
        {expiresAt && <Field label="Expires" value={new Date(expiresAt).toLocaleDateString()} />}
        {previewMode && <Field label="Preview" value="creator-marked" />}

        {/* Developer-only fields — surfaced via `?dev=1`. */}
        {isDeveloperView && <Field label="Privacy mode" value={privacyMode} mono />}
        {isDeveloperView && <Field label="Registered" value={registered ? 'yes' : 'no'} />}
      </dl>

      {isFallback && (
        <p className="t-xs" style={{ color: 'var(--text-3, #999)', margin: 0 }}>
          Devnet experimental — encrypted membership state coming via Umbra in v2.
          {isDeveloperView && ' The current build derives entitlement from on-chain commitments only.'}
        </p>
      )}
      <p className="t-xs" style={{ color: 'var(--text-3, #999)', margin: 0 }}>
        Devnet only — no real funds. The SORTS dashboard + APIs never expose your tier
        or wallet to the creator.
      </p>
    </section>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="t-label" style={{ color: 'var(--text-3, #999)', fontSize: 11, marginBottom: 4 }}>
        {label}
      </dt>
      <dd className={mono ? 't-mono' : undefined} style={{ margin: 0, fontSize: 13 }}>
        {value}
      </dd>
    </div>
  );
}
