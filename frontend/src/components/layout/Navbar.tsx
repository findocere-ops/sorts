'use client';
import Link from 'next/link';
import { useSortsPrivy } from '@/components/providers/PrivyProvider';
import { SortsLogoFull } from '@/components/brand/SortsLogoFull';

/** AppTopBar — sticky header inside the app shell (dashboard/studio/app pages). */
export function AppTopBar({
  pageTitle: _pageTitle,
  headerRight,
}: {
  pageTitle?: string;
  headerRight?: React.ReactNode;
}) {
  const { ready, authenticated, login } = useSortsPrivy();

  return (
    <header
      style={{
        position: 'sticky', top: 0, zIndex: 30,
        height: 'var(--topbar-h)', padding: '0 18px',
        background: 'var(--bg-panel)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex', alignItems: 'center', gap: 8,
      }}
    >
      <div style={{ flex: 1, maxWidth: 300, position: 'relative' }}>
        <span
          style={{
            position: 'absolute', left: 10, top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-3)', pointerEvents: 'none',
            display: 'flex', alignItems: 'center',
          }}
        >
          <SearchIcon />
        </span>
        <input
          aria-label="Search"
          placeholder="Search communities, content…"
          className="tb-search-input"
          style={{
            width: '100%', height: 30,
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 7,
            padding: '0 10px 0 30px',
            color: 'var(--text-1)',
            fontFamily: 'inherit', fontSize: 13, outline: 'none',
          }}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
        {headerRight}
        <button
          onClick={login}
          className="wallet-btn"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--r-md)', height: 30, padding: '0 12px', fontSize: 12.5, fontWeight: 500, color: 'var(--text-1)', display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', whiteSpace: 'nowrap' }}
        >
          <span style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, background: authenticated ? 'var(--success)' : 'var(--text-3)', boxShadow: authenticated ? '0 0 8px rgba(34,197,94,0.5)' : 'none' }} />
          {ready && authenticated ? 'Connected' : 'Connect Wallet'}
        </button>
      </div>
    </header>
  );
}

/** MarketingNav — landing page nav only, not inside the app shell. */
export function MarketingNav() {
  const { ready, authenticated, login } = useSortsPrivy();

  return (
    <header className="lp-nav">
      {/* Left: Logo */}
      <Link href="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
        <SortsLogoFull markSize={38} wordmarkSize={16} showTagline={false} />
      </Link>

      {/* Center: Nav links */}
      <nav className="lp-nav-links">
        <a href="#features" className="lp-nav-link">Features</a>
        <a href="#privacy" className="lp-nav-link">Privacy</a>
        <a href="#pricing" className="lp-nav-link">Pricing</a>
        <Link href="/role" className="lp-nav-link">Demo</Link>
      </nav>

      {/* Right: Auth */}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
        {ready && !authenticated ? (
          <>
            <button className="btn btn-ghost btn-sm" onClick={login} id="nav-signin-btn">Sign in</button>
            <Link href="/role">
              <button className="btn btn-primary btn-sm" id="nav-launch-btn">Launch app</button>
            </Link>
          </>
        ) : (
          <Link href="/studio">
            <button className="btn btn-primary btn-sm" id="nav-studio-btn">Studio →</button>
          </Link>
        )}
      </div>
    </header>
  );
}

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="7" cy="7" r="4.75" stroke="currentColor" strokeWidth="1.25" />
      <path d="M10.5 10.5L13.5 13.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  );
}
