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
      <style jsx>{`
        .mobile-bottom-nav {
          display: none;
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          height: var(--mobile-nav-h);
          background: rgba(8,13,18,0.96);
          backdrop-filter: blur(18px) saturate(1.3);
          border-top: 1px solid var(--border);
          z-index: 50;
          padding: 0 4px;
        }
        .mobile-link {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 3px;
          color: var(--text-3);
          font-size: 10px;
          text-decoration: none;
        }
        .mobile-link[data-active='true'] {
          color: var(--cyan);
        }
        @media (max-width: 767px) {
          .mobile-bottom-nav { display: flex; }
        }
      `}</style>
    </nav>
  );
}
