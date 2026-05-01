'use client';
import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { AppTopBar } from './Navbar';

interface AppShellProps {
  children: React.ReactNode;
  /** If provided, shown in the top bar instead of the auto-derived title */
  pageTitle?: string;
  /** Slot rendered to the right of the top bar — e.g. a primary action button */
  headerRight?: React.ReactNode;
  /** Optional desktop right rail content */
  rightRail?: React.ReactNode;
}

export function AppShell({ children, pageTitle, headerRight, rightRail }: AppShellProps) {
  return (
    <div className="app-shell-root">
      {/* Sidebar — desktop only */}
      <Sidebar />

      {/* Content column */}
      <div className="app-shell-content">
        {/* Desktop: offset for sidebar */}
        <div className="app-shell-desktop" style={{ paddingLeft: 'var(--sidebar-w)' }}>
          <AppTopBar pageTitle={pageTitle} headerRight={headerRight} />
          <div style={{ display: 'flex', minHeight: 'calc(100vh - var(--topbar-h))' }}>
            <main style={{ flex: 1, minWidth: 0 }}>
              {children}
            </main>
            {rightRail ? (
              <aside
                style={{
                  width: 256,
                  minWidth: 256,
                  borderLeft: '1px solid var(--border-dim)',
                  background: 'var(--bg-surface)',
                  padding: '18px 14px',
                  overflowY: 'auto',
                  flexShrink: 0,
                }}
              >
                {rightRail}
              </aside>
            ) : null}
          </div>
        </div>

        {/* Mobile: full width */}
        <div className="app-shell-mobile" style={{ paddingBottom: 'var(--mobile-nav-h)' }}>
          <MobileTopBar pageTitle={pageTitle} headerRight={headerRight} />
          <main style={{ flex: 1 }}>
            {children}
          </main>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <MobileNav />

      <style jsx>{`
        .app-shell-root {
          display: flex;
          min-height: 100vh;
          background: var(--bg-base);
        }

        .app-shell-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
          padding-left: 0;
        }

        .app-shell-desktop {
          display: block;
        }

        .app-shell-mobile {
          display: none;
          flex-direction: column;
        }

        @media (max-width: 767px) {
          .app-shell-desktop {
            display: none;
          }

          .app-shell-mobile {
            display: flex;
          }
        }
      `}</style>
    </div>
  );
}

function MobileTopBar({ pageTitle, headerRight }: { pageTitle?: string; headerRight?: React.ReactNode }) {
  const pathname = usePathname();
  const title = pageTitle ?? deriveTitle(pathname);

  return (
    <header
      style={{
        position: 'sticky', top: 0, zIndex: 30,
        height: 'var(--topbar-h)',
        background: 'rgba(8,9,12,0.92)',
        backdropFilter: 'blur(18px) saturate(1.4)',
        borderBottom: '1px solid var(--border-dim)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 16px', gap: 12,
      }}
    >
      <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-1)' }}>{title}</span>
      {headerRight && <div>{headerRight}</div>}
    </header>
  );
}

function deriveTitle(pathname: string): string {
  if (pathname === '/discover') return 'Discover';
  if (pathname === '/dashboard') return 'Dashboard';
  if (pathname.startsWith('/dashboard/')) return 'Community';
  if (pathname === '/create') return 'Create community';
  if (pathname.startsWith('/community/')) return 'Community';
  if (pathname.startsWith('/join/')) return 'Join';
  if (pathname === '/link') return 'Link Telegram';
  if (pathname === '/account') return 'Account';
  return 'Sorts';
}
