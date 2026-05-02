'use client';

import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { Icon } from '@/components/icons/Icon';
import { creatorNav, publicNav, subscriberNav } from '@/lib/nav';

export function MobileBottomNav({ mode }: { mode: 'public' | 'creator' | 'subscriber' }) {
  const pathname = usePathname();
  const params = useParams<{ cid?: string }>();
  const items = mode === 'creator'
    ? creatorNav(params.cid).slice(0, 5)
    : mode === 'subscriber' && params.cid
      ? subscriberNav(params.cid).slice(0, 5)
      : publicNav.slice(0, 5);

  return (
    <nav className="mobile-bottom-nav">
      {items.map((item) => {
        const active = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link key={item.href} href={item.href} className="mobile-link" data-active={active}>
            <Icon name={item.icon} size={17} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
