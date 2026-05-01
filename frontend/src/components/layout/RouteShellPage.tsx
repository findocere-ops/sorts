'use client';

import type { ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Icon, type IconName } from '@/components/icons/Icon';

interface RouteShellPageProps {
  eyebrow: string;
  title: string;
  body: string;
  icon?: IconName;
  badge?: string;
  actionLabel?: string;
  onAction?: () => void;
  children?: ReactNode;
}

export function RouteShellPage({
  eyebrow,
  title,
  body,
  icon = 'shield',
  badge,
  actionLabel,
  onAction,
  children,
}: RouteShellPageProps) {
  return (
    <div style={{ maxWidth: 920, margin: '0 auto', padding: '32px 24px' }}>
      <section
        style={{
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-lg)',
          background: 'linear-gradient(180deg, var(--bg-elevated), var(--bg-card))',
          padding: 28,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 'var(--r-md)',
              display: 'grid',
              placeItems: 'center',
              color: 'var(--cyan)',
              background: 'var(--cyan-dim)',
              border: '1px solid var(--border-cyan)',
              flexShrink: 0,
            }}
          >
            <Icon name={icon} size={21} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
              <p className="t-label" style={{ color: 'var(--cyan)' }}>{eyebrow}</p>
              {badge && <Badge>{badge}</Badge>}
            </div>
            <h1 className="t-h1" style={{ marginBottom: 8 }}>{title}</h1>
            <p className="t-body" style={{ color: 'var(--text-2)', maxWidth: 660 }}>{body}</p>
            {actionLabel && onAction && (
              <div style={{ marginTop: 18 }}>
                <Button size="sm" onClick={onAction}>{actionLabel}</Button>
              </div>
            )}
          </div>
        </div>
      </section>
      {children && <div style={{ marginTop: 18 }}>{children}</div>}
    </div>
  );
}
