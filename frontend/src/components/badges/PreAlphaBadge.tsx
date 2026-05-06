'use client';

/** Marker badge for screens that load pre-alpha integrations
 *  (Umbra encrypted balances, IKA dWallet signing, etc.). Render alongside
 *  the screen heading so users understand the feature is gated. */
export function PreAlphaBadge({ label = 'Pre-alpha' }: { label?: string }) {
  return (
    <span
      title="Pre-alpha integration — devnet only, no production guarantees"
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
        textTransform: 'uppercase',
        background: 'rgba(255,176,46,0.12)',
        color: 'var(--gold, #ffb02e)',
        border: '1px solid rgba(255,176,46,0.4)',
      }}
    >
      <span aria-hidden>⚠</span>
      {label}
    </span>
  );
}
