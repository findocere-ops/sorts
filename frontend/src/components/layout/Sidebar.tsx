'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSortsAccount, useSortsPrivy } from '@/components/providers/PrivyProvider';

const NAV_ITEMS = [
  { href: '/discover',   label: 'Discover',   icon: CompassIcon },
  { href: '/dashboard',  label: 'Dashboard',  icon: GridIcon },
  { href: '/create',     label: 'Create',     icon: PlusIcon },
];

export function Sidebar() {
  const pathname = usePathname();
  const { authenticated, logout, user } = useSortsPrivy();
  const { address } = useSortsAccount();

  const email = user?.email?.address;
  const shortAddr = address ? `${address.slice(0, 6)}…${address.slice(-4)}` : null;

  return (
    <aside
      className="app-sidebar"
      style={{
        width: 'var(--sidebar-w)',
        height: '100vh',
        position: 'fixed',
        top: 0,
        left: 0,
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border)',
        zIndex: 40,
      }}
    >
      {/* Logo */}
      <div style={{ height: 'var(--topbar-h)', display: 'flex', alignItems: 'center', padding: '0 13px', borderBottom: '1px solid var(--border-dim)' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <SortsLogoMark />
          <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.03em', color: 'var(--text-1)', whiteSpace: 'nowrap' }}>
            SORTS
          </span>
        </Link>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '10px 7px', overflowY: 'auto' }}>
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '7px 9px', borderRadius: 'var(--r-md)',
                marginBottom: 2,
                fontSize: 13.5, fontWeight: active ? 500 : 450,
                color: active ? 'var(--accent)' : 'var(--text-2)',
                background: active ? 'var(--accent-dim)' : 'transparent',
                transition: 'color 0.12s, background 0.12s',
                textDecoration: 'none',
              }}
              className="hover:text-text-1 hover:bg-bg-hover"
            >
              <Icon active={active} />
              {label}
            </Link>
          );
        })}

        {/* Community feeds show up here dynamically — placeholder separator */}
        <div style={{ height: 1, background: 'var(--border-dim)', margin: '5px 7px' }} />

        <Link
          href="/discover"
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '7px 9px', borderRadius: 'var(--r-md)',
            fontSize: 12.5, color: 'var(--text-3)',
            textDecoration: 'none',
          }}
          className="hover:text-text-2"
        >
          Browse all communities →
        </Link>
      </nav>

      {/* Account footer */}
      <div style={{ padding: '12px 7px', borderTop: '1px solid var(--border-dim)' }}>
        <Link
          href="/account"
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 9px', borderRadius: 'var(--r-md)',
            textDecoration: 'none',
            background: pathname === '/account' ? 'var(--bg-elevated)' : 'transparent',
          }}
          className="hover:bg-bg-hover"
        >
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: 'var(--accent-dim)',
            border: '1px solid rgba(91,142,245,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700, color: 'var(--accent)', flexShrink: 0,
          }}>
            {email ? email[0].toUpperCase() : address ? address[2].toUpperCase() : '?'}
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {email ?? shortAddr ?? 'Account'}
            </p>
            {authenticated && (
              <p style={{ fontSize: 11, color: 'var(--text-3)' }}>Arbitrum Sepolia</p>
            )}
          </div>
        </Link>

        {authenticated && (
          <button
            onClick={() => logout()}
            style={{
              width: '100%', marginTop: 4,
              padding: '6px 12px', borderRadius: 'var(--r-md)',
              fontSize: 12, color: 'var(--text-3)', background: 'none', border: 'none',
              textAlign: 'left', cursor: 'pointer', transition: 'color 0.12s',
            }}
            className="hover:text-rose"
          >
            Sign out
          </button>
        )}
      </div>

      <style jsx>{`
        .app-sidebar {
          display: flex;
          flex-direction: column;
        }

        @media (max-width: 767px) {
          .app-sidebar {
            display: none;
          }
        }
      `}</style>
    </aside>
  );
}

/* ── Icons ──────────────────────────────────────────────────────────────────── */
function CompassIcon({ active }: { active: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="8" cy="8" r="6.5" stroke={active ? 'var(--accent)' : 'currentColor'} strokeWidth="1.25"/>
      <path d="M10.5 5.5L9 9L5.5 10.5L7 7L10.5 5.5Z" fill={active ? 'var(--accent)' : 'currentColor'} fillOpacity={active ? 1 : 0.6}/>
    </svg>
  );
}

function GridIcon({ active }: { active: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
      <rect x="2" y="2" width="5" height="5" rx="1.5" stroke={active ? 'var(--accent)' : 'currentColor'} strokeWidth="1.25"/>
      <rect x="9" y="2" width="5" height="5" rx="1.5" stroke={active ? 'var(--accent)' : 'currentColor'} strokeWidth="1.25"/>
      <rect x="2" y="9" width="5" height="5" rx="1.5" stroke={active ? 'var(--accent)' : 'currentColor'} strokeWidth="1.25"/>
      <rect x="9" y="9" width="5" height="5" rx="1.5" stroke={active ? 'var(--accent)' : 'currentColor'} strokeWidth="1.25"/>
    </svg>
  );
}

function PlusIcon({ active }: { active: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="8" cy="8" r="6.5" stroke={active ? 'var(--accent)' : 'currentColor'} strokeWidth="1.25"/>
      <path d="M8 5v6M5 8h6" stroke={active ? 'var(--accent)' : 'currentColor'} strokeWidth="1.25" strokeLinecap="round"/>
    </svg>
  );
}

export function SortsLogoMark() {
  return (
    <div style={{
      width: 28, height: 28,
      background: 'linear-gradient(135deg, #0e1016 0%, #141828 100%)',
      border: '1px solid rgba(91,142,245,0.2)',
      borderRadius: 8,
      boxShadow: '0 4px 20px rgba(91,142,245,0.15)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="1.8" y="2.1" width="11.4" height="3.5" rx="1.75" fill="#5b8ef5" />
        <rect x="3.5" y="6.25" width="9.1" height="3.5" rx="1.75" fill="#5b8ef5" opacity="0.72" />
        <rect x="1.8" y="10.4" width="11.4" height="3.5" rx="1.75" fill="#5b8ef5" />
      </svg>
    </div>
  );
}
