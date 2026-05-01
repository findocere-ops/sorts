'use client';

import { TopBar } from './TopBar';
import { MobileBottomNav } from './MobileBottomNav';

export function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      <TopBar title="Confidential communities" />
      <main>{children}</main>
      <MobileBottomNav mode="public" />
    </div>
  );
}
