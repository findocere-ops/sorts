'use client';

import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { Icon } from '@/components/icons/Icon';
import { creatorNav } from '@/lib/nav';

export function CreatorSidebar() {
  const pathname = usePathname();
  const params = useParams<{ cid?: string }>();
  const items = creatorNav(params.cid);

  return (
    <aside className="desktop-sidebar">
      <div style={{ height: 'var(--topbar-h)', display: 'flex', alignItems: 'center', padding: '0 14px', borderBottom: '1px solid var(--border-dim)' }}>
        <Link href="/studio" className="wordmark" style={{ fontSize: 13 }}>SORTS STUDIO</Link>
      </div>
      <nav style={{ padding: 8, overflowY: 'auto' }}>
        {items.map((item) => {
          const active = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link key={item.href} href={item.href} className="side-link" data-active={active}>
              <Icon name={item.icon} size={18} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
