'use client';

import { CreatorSidebar } from './CreatorSidebar';
import { MobileBottomNav } from './MobileBottomNav';
import { TopBar } from './TopBar';

export function CreatorStudioLayout({ children, title = 'Creator Studio' }: { children: React.ReactNode; title?: string }) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      <CreatorSidebar />
      <div className="studio-content">
        <TopBar title={title} />
        <main>{children}</main>
      </div>
      <MobileBottomNav mode="creator" />
    </div>
  );
}
