'use client';

/** Tiny topbar badge that signals the active chain is a testnet/devnet.
 *  Renders site-wide so reviewers always know they are not on mainnet. */
export function DevnetBadge() {
  return (
    <span
      title="Solana Devnet — no real funds"
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
        background: 'rgba(45,232,224,0.10)',
        color: 'var(--cyan)',
        border: '1px solid rgba(45,232,224,0.35)',
      }}
    >
      <span
        aria-hidden
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: 'var(--cyan)',
          boxShadow: '0 0 6px var(--cyan)',
        }}
      />
      Devnet
    </span>
  );
}
