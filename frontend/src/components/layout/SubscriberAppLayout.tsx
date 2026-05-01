'use client';

import { MobileBottomNav } from './MobileBottomNav';
import { SubscriberSidebar } from './SubscriberSidebar';
import { TopBar } from './TopBar';

export function SubscriberAppLayout({ children, title = 'Subscriber App' }: { children: React.ReactNode; title?: string }) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      <SubscriberSidebar />
      <div className="subscriber-content">
        <TopBar title={title} />
        <main>{children}</main>
      </div>
      <MobileBottomNav mode="subscriber" />
      <style jsx>{`
        .subscriber-content { padding-left: var(--sidebar-w); }
        @media (max-width: 767px) {
          .subscriber-content { padding-left: 0; padding-bottom: var(--mobile-nav-h); }
        }
      `}</style>
    </div>
  );
}
