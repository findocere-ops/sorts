'use client';

import type { PrivacyMode } from '@sorts/shared';
import { PreAlphaBadge } from '@/components/badges';

/** Card shown on /join/[cid] (preview) and /app/[cid]/feed (gated views).
 *
 *  Privacy rules enforced visually:
 *    - NEVER renders a tier number, commitment, salt, or member count.
 *    - Always renders the privacy-mode label.
 *    - Always renders the devnet / experimental disclosure when in fallback
 *      mode ("encrypted membership state coming via Umbra in v2").
 *    - Always renders the "no real funds" line. */
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
}

export function UmbraMembershipCard({
  privacyMode,
  registered,
  active,
  expiresAt,
  previewMode,
}: UmbraMembershipCardProps) {
  const isFallback = privacyMode === 'on-chain-commitment-fallback';
  const isUmbra = privacyMode === 'umbra-encrypted-balance';

  return (
    <section
      className="card-elevated"
      data-privacy-mode={privacyMode}
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
            {isUmbra ? 'Umbra encrypted balance' : 'On-chain commitment fallback'}
          </h3>
          <p className="t-sm" style={{ color: 'var(--text-2)', maxWidth: 480 }}>
            {isUmbra
              ? 'Membership entitlement is read from your Umbra encrypted balance — the chain only sees a ciphertext.'
              : 'Membership entitlement is derived from the on-chain Subscription PDA. Your tier level is never stored in plaintext; only a tier_commitment plus a salt are written by the program.'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <PreAlphaBadge label="Devnet" />
          {isFallback && <PreAlphaBadge label="Umbra v2 in progress" />}
        </div>
      </header>

      <dl
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 12,
          margin: 0,
        }}
      >
        <Field label="Privacy mode" value={privacyMode} mono />
        <Field label="Registered" value={registered ? 'yes' : 'no'} />
        <Field label="Entitlement" value={active ? 'active' : 'inactive'} />
        {expiresAt && <Field label="Expires" value={new Date(expiresAt).toLocaleString()} />}
        {previewMode && <Field label="Preview" value="creator-marked" />}
      </dl>

      {isFallback && (
        <p className="t-xs" style={{ color: 'var(--text-3, #999)', margin: 0 }}>
          Devnet experimental — encrypted membership state coming via Umbra in v2. The
          current build derives entitlement from on-chain commitments only.
        </p>
      )}
      <p className="t-xs" style={{ color: 'var(--text-3, #999)', margin: 0 }}>
        Devnet only — no real funds. Information shown here is aggregate to the wallet itself; tier level and member count are never exposed.
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
