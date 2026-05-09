'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { getCommunity } from '@/lib/api/communities';
import type { Community, Tier } from '@/lib/types';
import { useChain } from '@/lib/chain/useChain';
import { SolanaWalletButton } from '@/components/wallet/SolanaWalletButton';
import { UmbraMembershipCard } from '@/components/privacy/UmbraMembershipCard';
import { useUmbraPrivacy } from '@/hooks/useUmbraPrivacy';
import { Button } from '@/components/ui/Button';
import { PrivacyModeBadge } from '@/components/badges/PrivacyModeBadge';

export default function SubscribePage({ params }: { params: { cid: string } }) {
  return (
    <PublicLayout>
      <Suspense fallback={null}>
        <SubscribeInner cid={params.cid} />
      </Suspense>
    </PublicLayout>
  );
}

function SubscribeInner({ cid }: { cid: string }) {
  const router = useRouter();
  const adapter = useChain();
  const subscriber = adapter.address ?? null;
  const privacy = useUmbraPrivacy(subscriber);

  const [community, setCommunity] = useState<Community | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getCommunity(cid)
      .then((c) => { if (!cancelled) setCommunity(c); })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : 'failed'); });
    return () => { cancelled = true; };
  }, [cid]);

  const tier1: Tier | undefined = community?.tiers?.find((t: Tier) => t.level === 1);

  const onSubscribe = async () => {
    if (!community || !subscriber) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await adapter.subscribe({
        communityAddress: community.contract_address,
        tier: 1,
        paymentWei: tier1 ? BigInt(tier1.price_wei ?? '0') : 0n,
        creatorAddress: community.creator_wallet,
      });
      if (result.txHash) router.push(`/app/${cid}/feed`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'transaction failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (error && !community) {
    return <Shell><p className="t-sm" style={{ color: 'var(--danger)' }}>{error}</p></Shell>;
  }
  if (!community) {
    return <Shell><p className="t-sm" style={{ color: 'var(--text-2)' }}>Loading…</p></Shell>;
  }

  return (
    <Shell>
      <header style={{ display: 'grid', gap: 6 }}>
        <p className="t-label" style={{ color: 'var(--cyan)' }}>Subscribe</p>
        <h1 className="t-h1">{community.name}</h1>
        {tier1 && (
          <p className="t-sm" style={{ color: 'var(--text-2)' }}>
            Tier 1 — {tier1.price_display} for {tier1.duration_days} days.
          </p>
        )}
      </header>

      <UmbraMembershipCard
        privacyMode={privacy.privacyMode}
        registered={privacy.registered}
        active={false}
        previewMode={false}
      />

      <PrivacyModeBadge variant="full" />

      <section className="card-elevated" style={{ display: 'grid', gap: 12, padding: 18 }}>
        {!subscriber ? (
          <>
            <p className="t-sm" style={{ color: 'var(--text-2)' }}>
              Connect a Solana wallet to subscribe.
            </p>
            <SolanaWalletButton />
          </>
        ) : (
          <Button variant="primary" onClick={onSubscribe} disabled={submitting}>
            {submitting ? 'Awaiting signature…' : 'Sign + send subscribe transaction'}
          </Button>
        )}
        {error && <p className="t-sm" style={{ color: 'var(--danger)' }}>{error}</p>}
      </section>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 24px', display: 'grid', gap: 18 }}>
      {children}
    </div>
  );
}
