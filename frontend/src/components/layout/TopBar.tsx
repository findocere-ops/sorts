'use client';

import Link from 'next/link';
import { WalletButton } from '@/components/auth/WalletButton';
import { DevnetBadge } from '@/components/badges';

export function TopBar({ title, right }: { title?: string; right?: React.ReactNode }) {
  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 30,
        height: 'var(--topbar-h)',
        padding: '0 18px',
        background: 'rgba(8,13,18,0.94)',
        backdropFilter: 'blur(18px) saturate(1.2)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <Link href="/" className="wordmark" style={{ fontSize: 13 }}>SORTS</Link>
      <DevnetBadge />
      {title && <span style={{ color: 'var(--text-2)', fontSize: 13 }}>{title}</span>}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
        {right}
        <WalletButton />
      </div>
    </header>
  );
}
