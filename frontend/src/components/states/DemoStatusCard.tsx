'use client';

import { Icon } from '@/components/icons/Icon';

/** Day-10 UX fix A3 — paired "what works today" panel.
 *
 *  Pure read of the README "Current Demo Status" table. The component does
 *  NOT issue a new privacy claim; it mirrors the calibrated honesty pass
 *  rows verbatim. When any row in that table changes, update the constant
 *  below in lockstep.
 *
 *  Mounted alongside the disclosure stack (DevnetBadge / PreAlphaBadge /
 *  DisclaimerFooter) so a first-time visitor sees the "✅" list next to the
 *  "🧪 in progress" list and reads the build as calibrated rather than
 *  broken.
 */

interface StatusRow {
  state: 'live' | 'experimental' | 'out-of-scope';
  label: string;
  note: string;
}

const ROWS: StatusRow[] = [
  { state: 'live',          label: 'Solana devnet community creation',         note: 'Quasar program AEp6V…BkFV' },
  { state: 'live',          label: 'Subscriber subscribe + access check',      note: 'Devnet only' },
  { state: 'live',          label: 'Aggregate-only creator analytics',         note: 'No member lists, ever' },
  { state: 'live',          label: 'Privy auth (email + Solana wallet)',       note: 'Wallet-adapter for Solana, Privy for identity' },
  { state: 'live',          label: 'Telegram delivery',                        note: '/status reply never includes tier' },
  { state: 'experimental',  label: 'Umbra hidden membership state',            note: 'Cut-line tripped Day 4 — see UmbraMembershipCard "v2 in progress"' },
  { state: 'experimental',  label: 'IKA dWallet capability',                   note: 'Static capability card; real-funds method gated + throws' },
  { state: 'out-of-scope',  label: 'Mainnet',                                  note: 'Devnet MVP only — Universal Hard Rule' },
];

const ICON: Record<StatusRow['state'], { glyph: string; color: string; label: string }> = {
  live:          { glyph: '✅', color: 'var(--success, #22c55e)', label: 'Live' },
  experimental:  { glyph: '🧪', color: 'var(--gold, #ffb02e)',    label: 'Experimental' },
  'out-of-scope':{ glyph: '❌', color: 'var(--text-3, #999)',     label: 'Not in scope' },
};

export function DemoStatusCard({ compact = false }: { compact?: boolean }) {
  return (
    <section
      className="card-elevated"
      aria-label="Current demo status"
      style={{
        display: 'grid',
        gap: 14,
        padding: compact ? 16 : 22,
        borderRadius: 14,
        border: '1px solid var(--border-subtle)',
        background: 'rgba(8,13,18,0.78)',
      }}
    >
      <header style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, alignItems: 'baseline' }}>
        <div>
          <p className="t-label" style={{ color: 'var(--cyan)' }}>What works today</p>
          {!compact && (
            <p className="t-sm" style={{ color: 'var(--text-2)', maxWidth: 520, marginTop: 4 }}>
              Honest snapshot of every system in the SORTS demo. Rows mirror the
              README "Current Demo Status" table — calibrated, not aspirational.
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--text-3)' }}>
          <span>✅ Live</span>
          <span>🧪 Experimental</span>
          <span>❌ Out of scope</span>
        </div>
      </header>

      <ul style={{ display: 'grid', gap: 8, padding: 0, margin: 0, listStyle: 'none' }}>
        {ROWS.map((row) => {
          const ic = ICON[row.state];
          return (
            <li
              key={row.label}
              style={{
                display: 'grid',
                gridTemplateColumns: '24px 1fr',
                gap: 10,
                alignItems: 'baseline',
                padding: '6px 8px',
                borderRadius: 8,
                background: 'rgba(12,19,26,0.55)',
              }}
            >
              <span aria-label={ic.label} title={ic.label} style={{ fontSize: 14 }}>{ic.glyph}</span>
              <span style={{ display: 'grid', gap: 2 }}>
                <span style={{ fontSize: 13.5, color: 'var(--text-1)', fontWeight: 500 }}>{row.label}</span>
                <span style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{row.note}</span>
              </span>
            </li>
          );
        })}
      </ul>

      <p className="t-xs" style={{ color: 'var(--text-3)', margin: 0 }}>
        Devnet only — no real funds.{' '}
        <Icon name="shield" size={11} color="var(--text-3)" /> Aggregate-only by design.
      </p>
    </section>
  );
}
