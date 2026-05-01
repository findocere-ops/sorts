import Link from 'next/link';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { Button } from '@/components/ui/Button';
import { Icon, type IconName } from '@/components/icons/Icon';

const cards: Array<{
  href?: string;
  icon: IconName;
  eyebrow: string;
  title: string;
  body: string;
  cta?: string;
}> = [
  {
    href: '/studio',
    icon: 'grid',
    eyebrow: 'Creator',
    title: 'Open Creator Studio',
    body: 'Manage communities, publish gated content, and view aggregate-only analytics.',
    cta: 'Go to studio',
  },
  {
    href: '/studio/create',
    icon: 'plus',
    eyebrow: 'Creator',
    title: 'Create a community',
    body: 'Deploy or record a private membership community on Arbitrum Sepolia.',
    cta: 'Create community',
  },
  {
    href: '/join/demo',
    icon: 'invite',
    eyebrow: 'Subscriber',
    title: 'Join a community',
    body: 'Use an invite link or test the subscriber path. Real membership requires a deployed community.',
    cta: 'Open join flow',
  },
  {
    icon: 'shield',
    eyebrow: 'Protocol',
    title: 'Privacy by default',
    body: 'Creators see aggregate stats only. No subscriber wallet tables, member names, VIP lists, or exact tier ownership lists.',
  },
];

export default function RolePage() {
  return (
    <PublicLayout>
      <main style={{ maxWidth: 1080, margin: '0 auto', padding: '46px 24px' }}>
        <div style={{ marginBottom: 24 }}>
          <p className="t-label" style={{ color: 'var(--cyan)', marginBottom: 10 }}>Role gateway</p>
          <h1 className="t-display" style={{ fontSize: 44, marginBottom: 10 }}>Choose how you want to enter SORTS.</h1>
          <p className="t-body" style={{ color: 'var(--text-2)', maxWidth: 700 }}>
            Public pages stay open. Wallet connection is only needed when you create, subscribe, sign, or manage account-specific actions.
          </p>
        </div>

        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
          {cards.map((card) => (
            <RoleCard key={card.title} {...card} />
          ))}
        </div>
      </main>
    </PublicLayout>
  );
}

function RoleCard({
  href,
  icon,
  eyebrow,
  title,
  body,
  cta,
}: {
  href?: string;
  icon: IconName;
  eyebrow: string;
  title: string;
  body: string;
  cta?: string;
}) {
  const content = (
    <article
      style={{
        height: '100%',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-lg)',
        background: 'linear-gradient(180deg, var(--bg-elevated), var(--bg-card))',
        padding: 22,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      <div style={{ width: 42, height: 42, borderRadius: 'var(--r-md)', display: 'grid', placeItems: 'center', color: 'var(--cyan)', background: 'var(--cyan-dim)', border: '1px solid var(--border-cyan)' }}>
        <Icon name={icon} size={20} />
      </div>
      <div>
        <p className="t-label" style={{ color: 'var(--cyan)', marginBottom: 7 }}>{eyebrow}</p>
        <h2 className="t-h2" style={{ marginBottom: 8 }}>{title}</h2>
        <p className="t-sm" style={{ color: 'var(--text-2)' }}>{body}</p>
      </div>
      {cta && (
        <div style={{ marginTop: 'auto' }}>
          <Button size="sm" variant={href ? 'primary' : 'secondary'}>{cta}</Button>
        </div>
      )}
    </article>
  );

  if (!href) return content;
  return <Link href={href} style={{ textDecoration: 'none' }}>{content}</Link>;
}
