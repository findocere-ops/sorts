'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/',           label: 'Home',      icon: HomeIcon },
  { href: '/discover',   label: 'Discover',  icon: CompassIcon },
  { href: '/dashboard',  label: 'Dashboard', icon: GridIcon },
  { href: '/create',     label: 'Create',    icon: PlusIcon },
  { href: '/account',    label: 'Account',   icon: UserIcon },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="app-mobile-nav"
      style={{
        position: 'fixed',
        bottom: 0, left: 0, right: 0,
        height: 'var(--mobile-nav-h)',
        background: 'rgba(14,16,22,0.96)',
        backdropFilter: 'blur(20px) saturate(1.4)',
        borderTop: '1px solid var(--border)',
        zIndex: 50,
        alignItems: 'center',
        justifyContent: 'space-around',
        padding: '0 4px',
      }}
    >
      {TABS.map(({ href, label, icon: Icon }) => {
        const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              padding: '6px 10px', borderRadius: 'var(--r-md)',
              color: active ? 'var(--accent)' : 'var(--text-3)',
              textDecoration: 'none', flex: 1, transition: 'color 0.12s',
            }}
          >
            <Icon />
            <span style={{ fontSize: 10, fontWeight: active ? 600 : 400 }}>{label}</span>
          </Link>
        );
      })}

      <style jsx>{`
        .app-mobile-nav {
          display: none;
        }

        @media (max-width: 767px) {
          .app-mobile-nav {
            display: flex;
          }
        }
      `}</style>
    </nav>
  );
}

function HomeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M2 8L9 2L16 8V16H12V12H6V16H2V8Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
    </svg>
  );
}

function CompassIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M11.5 6.5L10 10L6.5 11.5L8 8L11.5 6.5Z" fill="currentColor" fillOpacity={0.7}/>
    </svg>
  );
}

function GridIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="2.5" y="2.5" width="5.5" height="5.5" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
      <rect x="10" y="2.5" width="5.5" height="5.5" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
      <rect x="2.5" y="10" width="5.5" height="5.5" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
      <rect x="10" y="10" width="5.5" height="5.5" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M9 6v6M6 9h6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="7" r="3" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M3 16c0-3.314 2.686-5 6-5s6 1.686 6 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  );
}
