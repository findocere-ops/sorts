/**
 * Site-wide truthfulness footer.
 *
 * Renders on every page via the root layout. Carries the
 * "devnet / pre-alpha / no real funds" honesty contract so that
 * aspirational marketing copy elsewhere is anchored in reality.
 */
export function DisclaimerFooter() {
  return (
    <footer
      role="contentinfo"
      style={{
        borderTop: '1px solid var(--border-subtle)',
        background: 'var(--bg-panel)',
        padding: '20px 24px',
        fontSize: 11.5,
        lineHeight: 1.6,
        color: 'var(--text-3)',
      }}
    >
      <div
        style={{
          maxWidth: 1080,
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '2px 10px',
              borderRadius: 999,
              border: '1px solid var(--border-cyan)',
              background: 'var(--cyan-dim)',
              color: 'var(--cyan)',
              fontWeight: 600,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              fontSize: 10,
            }}
          >
            Solana devnet
          </span>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '2px 10px',
              borderRadius: 999,
              border: '1px solid var(--border-orange)',
              background: 'var(--orange-dim)',
              color: 'var(--orange)',
              fontWeight: 600,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              fontSize: 10,
            }}
          >
            Pre-alpha · no real funds
          </span>
        </div>
        <p>
          SORTS is in active development. The current build runs on Solana devnet.
          Privy authentication, Umbra Privacy SDK, and IKA dWallet integrations are experimental
          and labeled accordingly throughout the product. We do not claim production FHE,
          production MPC, or mainnet privacy guarantees in this release.
        </p>
        <p>
          No real funds, mainnet assets, or custodial wallets are accepted. Devnet test tokens only.
          Information shown to creators is aggregate-only by design — individual subscriber wallets,
          tier levels, and membership graphs are deliberately not exposed.
        </p>
        <p style={{ color: 'var(--text-3)', opacity: 0.7 }}>
          © {new Date().getFullYear()} SORTS Protocol · Private subscription rails for Solana communities
        </p>
      </div>
    </footer>
  );
}
