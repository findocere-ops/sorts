import * as React from 'react';
import Link from 'next/link';
import { Icon, type IconName } from '@/components/icons/Icon';
import { Button } from '@/components/ui/Button';

export interface EmptyStateProps {
  icon?: IconName;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
}

export function EmptyState({
  icon = 'grid',
  title,
  description,
  actionLabel,
  onAction,
  actionHref,
}: EmptyStateProps) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '64px 24px',
      textAlign: 'center',
      border: '1px dashed var(--border)',
      borderRadius: 'var(--r-lg)',
      background: 'var(--bg-elevated)'
    }}>
      <div style={{
        width: 48,
        height: 48,
        borderRadius: '50%',
        background: 'var(--cyan-dim)',
        color: 'var(--cyan)',
        display: 'grid',
        placeItems: 'center',
        marginBottom: 16
      }}>
        <Icon name={icon} size={24} />
      </div>
      <h3 className="t-h2" style={{ marginBottom: 8 }}>{title}</h3>
      <p className="t-body" style={{ color: 'var(--text-2)', maxWidth: 400, marginBottom: 24 }}>
        {description}
      </p>
      {actionLabel && (
        actionHref ? (
          <Link href={actionHref}>
            <Button>{actionLabel}</Button>
          </Link>
        ) : (
          <Button onClick={onAction}>{actionLabel}</Button>
        )
      )}
    </div>
  );
}
