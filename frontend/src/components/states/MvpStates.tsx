'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Icon, type IconName } from '@/components/icons/Icon';
import type { TransactionStatus } from '@/lib/types';

interface StateAction {
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: React.ComponentProps<typeof Button>['variant'];
}

interface EmptyStateShellProps {
  icon: IconName;
  eyebrow: string;
  title: string;
  body: string;
  badge?: string;
  tone?: 'cyan' | 'orange' | 'gold' | 'success' | 'danger';
  action?: StateAction;
  secondaryAction?: StateAction;
  detail?: ReactNode;
}

const toneStyles = {
  cyan: {
    color: 'var(--cyan)',
    background: 'var(--cyan-dim)',
    border: 'var(--border-cyan)',
  },
  orange: {
    color: 'var(--orange)',
    background: 'var(--orange-dim)',
    border: 'var(--border-orange)',
  },
  gold: {
    color: 'var(--gold)',
    background: 'var(--gold-dim)',
    border: 'rgba(255,198,41,0.28)',
  },
  success: {
    color: 'var(--success)',
    background: 'var(--success-dim)',
    border: 'rgba(34,197,94,0.28)',
  },
  danger: {
    color: 'var(--danger)',
    background: 'var(--danger-dim)',
    border: 'rgba(239,68,68,0.28)',
  },
};

function EmptyStateShell({
  icon,
  eyebrow,
  title,
  body,
  badge,
  tone = 'cyan',
  action,
  secondaryAction,
  detail,
}: EmptyStateShellProps) {
  const styles = toneStyles[tone];

  return (
    <section
      style={{
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-lg)',
        background: 'linear-gradient(180deg, var(--bg-elevated), var(--bg-card))',
        padding: 24,
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: '0 auto 0 0',
          width: 3,
          background: styles.color,
          opacity: 0.85,
        }}
      />
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 'var(--r-md)',
            display: 'grid',
            placeItems: 'center',
            color: styles.color,
            background: styles.background,
            border: `1px solid ${styles.border}`,
            flexShrink: 0,
          }}
        >
          <Icon name={icon} size={20} />
        </div>

        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
            <p className="t-label" style={{ color: styles.color }}>{eyebrow}</p>
            {badge && <Badge variant={tone === 'danger' ? 'danger' : tone === 'success' ? 'success' : 'default'}>{badge}</Badge>}
          </div>
          <h2 className="t-h2" style={{ marginBottom: 8 }}>{title}</h2>
          <p className="t-sm" style={{ color: 'var(--text-2)', maxWidth: 620 }}>{body}</p>

          {detail && (
            <div
              style={{
                marginTop: 14,
                padding: '10px 12px',
                borderRadius: 'var(--r-md)',
                border: '1px solid var(--border-dim)',
                background: 'var(--bg-panel)',
                color: 'var(--text-2)',
                fontSize: 12.5,
              }}
            >
              {detail}
            </div>
          )}

          {(action || secondaryAction) && (
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 18 }}>
              {action && <StateButton action={action} />}
              {secondaryAction && <StateButton action={{ variant: 'secondary', ...secondaryAction }} />}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function StateButton({ action }: { action: StateAction }) {
  if (action.href) {
    const className = ['btn', getButtonVariantClass(action.variant ?? 'primary'), 'btn-sm'].join(' ');
    if (action.href.startsWith('http')) {
      return (
        <a className={className} href={action.href} target="_blank" rel="noreferrer">
          {action.label}
        </a>
      );
    }
    return (
      <Link className={className} href={action.href}>
        {action.label}
      </Link>
    );
  }

  return (
    <Button variant={action.variant ?? 'primary'} size="sm" onClick={action.onClick}>
      {action.label}
    </Button>
  );
}

function getButtonVariantClass(variant: React.ComponentProps<typeof Button>['variant']) {
  switch (variant) {
    case 'secondary': return 'btn-secondary';
    case 'ghost': return 'btn-ghost';
    case 'outline': return 'btn-outline';
    case 'cyan': return 'btn-cyan';
    case 'danger': return 'btn-danger';
    case 'primary':
    default:
      return 'btn-primary';
  }
}

export function BackendNotConnected({ apiUrl, onRetry }: { apiUrl?: string; onRetry?: () => void }) {
  return (
    <EmptyStateShell
      icon="bolt"
      eyebrow="Backend offline"
      title="SORTS API is not connected"
      body="The frontend is running, but it cannot reach the backend yet. Start the backend locally or set the hosted Render URL before testing live data."
      tone="orange"
      badge="API"
      action={onRetry ? { label: 'Retry', onClick: onRetry } : undefined}
      detail={apiUrl ? <span className="t-mono">{apiUrl}</span> : 'Expected local backend: http://localhost:3001'}
    />
  );
}

export function ContractNotConfigured({
  onOpenSetup,
  chain = 'solana-devnet',
}: {
  onOpenSetup?: () => void;
  chain?: 'solana-devnet' | 'arbitrum-sepolia';
}) {
  if (chain === 'arbitrum-sepolia') {
    return (
      <EmptyStateShell
        icon="settings"
        eyebrow="Contract missing"
        title="SortsFactory is not configured"
        body="Deploy the Arbitrum Sepolia factory contract, then add its address to the frontend and backend env files."
        tone="gold"
        badge="Legacy"
        action={onOpenSetup ? { label: 'View setup', onClick: onOpenSetup } : undefined}
        detail={<span className="t-mono">NEXT_PUBLIC_SORTS_FACTORY_ADDRESS=0x...</span>}
      />
    );
  }
  return (
    <EmptyStateShell
      icon="settings"
      eyebrow="Program missing"
      title="Solana program is not configured"
      body="Deploy the sorts_community Solana program, then set NEXT_PUBLIC_SOLANA_PROGRAM_ID for the frontend and SOLANA_PROGRAM_ID for the backend."
      tone="gold"
      badge="Devnet"
      action={onOpenSetup ? { label: 'View setup', onClick: onOpenSetup } : undefined}
      detail={<span className="t-mono">NEXT_PUBLIC_SOLANA_PROGRAM_ID=AEp6...&nbsp;</span>}
    />
  );
}

export function NoCommunitySelected({ href = '/discover' }: { href?: string }) {
  return (
    <EmptyStateShell
      icon="grid"
      eyebrow="No community"
      title="Choose a community to continue"
      body="Select a community before opening a gated feed, joining a membership, or reviewing aggregate stats."
      action={{ label: 'Browse communities', href }}
    />
  );
}

export function NoContentPublished({ creatorHref }: { creatorHref?: string }) {
  return (
    <EmptyStateShell
      icon="feed"
      eyebrow="Quiet feed"
      title="No content has been published yet"
      body="This community exists, but there are no published posts to show. Members will see new posts here once the creator publishes them."
      secondaryAction={creatorHref ? { label: 'Open studio', href: creatorHref } : undefined}
    />
  );
}

export function MembershipNotActive({ joinHref }: { joinHref?: string }) {
  return (
    <EmptyStateShell
      icon="lock"
      eyebrow="Membership required"
      title="Your wallet does not have active access"
      body="Connect the right wallet or subscribe with Arbitrum Sepolia ETH to unlock this gated feed. The creator will not receive a subscriber wallet list."
      tone="gold"
      action={joinHref ? { label: 'View membership tiers', href: joinHref } : undefined}
    />
  );
}

export function WrongNetworkState({
  currentChainId,
  targetChainId = 421614,
  onSwitchNetwork,
}: {
  currentChainId?: number;
  targetChainId?: number;
  onSwitchNetwork?: () => void;
}) {
  return (
    <EmptyStateShell
      icon="wallet"
      eyebrow="Wrong network"
      title="Switch to Arbitrum Sepolia"
      body="SORTS MVP transactions run on Arbitrum Sepolia. Switch networks before deploying communities, subscribing, or renewing."
      tone="orange"
      action={onSwitchNetwork ? { label: 'Switch network', onClick: onSwitchNetwork } : undefined}
      detail={
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <span>Current: <span className="t-mono">{currentChainId ?? 'unknown'}</span></span>
          <span>Required: <span className="t-mono">{targetChainId}</span></span>
        </div>
      }
    />
  );
}

export function TransactionState({
  status,
  txHash,
  error,
  explorerUrl,
  onReset,
}: {
  status: TransactionStatus;
  txHash?: string | null;
  error?: string | null;
  explorerUrl?: string;
  onReset?: () => void;
}) {
  const copy = getTransactionCopy(status);
  const tone = status === 'transaction-confirmed' ? 'success' : status === 'transaction-failed' ? 'danger' : 'cyan';

  return (
    <EmptyStateShell
      icon={status === 'transaction-confirmed' ? 'check' : status === 'transaction-failed' ? 'eye_off' : 'bolt'}
      eyebrow={copy.eyebrow}
      title={copy.title}
      body={error || copy.body}
      tone={tone}
      action={explorerUrl && txHash ? { label: 'View on Arbiscan', href: explorerUrl, variant: 'secondary' } : undefined}
      secondaryAction={onReset && status === 'transaction-failed' ? { label: 'Dismiss', onClick: onReset } : undefined}
      detail={txHash ? <span className="t-mono">{txHash}</span> : undefined}
    />
  );
}

export function DataProtectorNotConfigured({ docsHref }: { docsHref?: string }) {
  return (
    <EmptyStateShell
      icon="shield"
      eyebrow="DataProtector unavailable"
      title="Protected content is not configured yet"
      body="Plain gated posts can still work. iExec/DataProtector keys are only required when the creator chooses protected encrypted content."
      tone="gold"
      secondaryAction={docsHref ? { label: 'Read env guide', href: docsHref } : undefined}
      detail={
        <div className="t-mono">
          IEXEC_PRIVATE_KEY=<br />
          IEXEC_SORTS_IAPP_ADDRESS=
        </div>
      }
    />
  );
}

function getTransactionCopy(status: TransactionStatus) {
  switch (status) {
    case 'wallet-not-connected':
      return {
        eyebrow: 'Wallet required',
        title: 'Connect a wallet first',
        body: 'A wallet connection is required before this transaction can be prepared.',
      };
    case 'wrong-network':
      return {
        eyebrow: 'Wrong network',
        title: 'Switch to Arbitrum Sepolia',
        body: 'This transaction must be sent on Arbitrum Sepolia.',
      };
    case 'factory-not-configured':
      return {
        eyebrow: 'Contract missing',
        title: 'Factory address is not configured',
        body: 'Deploy SortsFactory and set NEXT_PUBLIC_SORTS_FACTORY_ADDRESS.',
      };
    case 'awaiting-signature':
      return {
        eyebrow: 'Wallet prompt',
        title: 'Waiting for wallet signature',
        body: 'Approve the request in your wallet to continue. No successful transaction is shown until the chain confirms it.',
      };
    case 'transaction-pending':
      return {
        eyebrow: 'Transaction pending',
        title: 'Waiting for Arbitrum Sepolia',
        body: 'The transaction was submitted and is waiting for confirmation.',
      };
    case 'transaction-confirmed':
      return {
        eyebrow: 'Confirmed',
        title: 'Transaction confirmed',
        body: 'The transaction is confirmed on Arbitrum Sepolia.',
      };
    case 'transaction-failed':
      return {
        eyebrow: 'Failed',
        title: 'Transaction failed',
        body: 'The wallet or chain rejected the transaction. Review the message and try again.',
      };
    case 'idle':
    default:
      return {
        eyebrow: 'Ready',
        title: 'Ready for transaction',
        body: 'No transaction is currently in progress.',
      };
  }
}
