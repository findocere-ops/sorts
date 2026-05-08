'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { PublicLayout } from '@/components/layout/PublicLayout';
import type { Community } from '@/lib/types';
import { getCommunity } from '@/lib/api/communities';
import { useChain } from '@/lib/chain/useChain';
import { useUmbraPrivacy } from '@/hooks/useUmbraPrivacy';
import { useSolanaMembership } from '@/hooks/useSolanaMembership';
import { UmbraMembershipCard } from '@/components/privacy/UmbraMembershipCard';
import { Button } from '@/components/ui/Button';
import { TipButton } from '@/components/tip/TipButton';
import { SkeletonCard } from '@/components/ui/Skeleton';

export default function JoinCommunityPage({ params }: { params: { cid: string } }) {
  return (
    <PublicLayout>
      <Suspense fallback={null}>
        <JoinInner cid={params.cid} />
      </Suspense>
    </PublicLayout>
  );
}

function JoinInner({ cid }: { cid: string }) {
  const adapter = useChain();
  const subscriber = adapter.address ?? null;
  const [community, setCommunity] = useState<Community | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getCommunity(cid)
      .then((c) => { if (!cancelled) setCommunity(c); })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : 'failed'); });
    return () => { cancelled = true; };
  }, [cid]);

  const contractAddress = community?.contract_address ?? null;
  const privacy = useUmbraPrivacy(subscriber);
  const membership = useSolanaMembership(contractAddress);

  if (error) {
    return (
      <Shell>
        <h1 className="t-h1">Community not found</h1>
        <p className="t-sm" style={{ color: 'var(--text-2)' }}>{error}</p>
      </Shell>
    );
  }
  if (!community) {
    // Day-10 B3 — skeleton instead of bare "Loading…" so layout stable.
    return (
      <Shell>
        <SkeletonCard rows={2} />
        <SkeletonCard rows={4} />
      </Shell>
    );
  }

  const isActive = membership.entitlement?.active ?? false;

  return (
    <Shell>
      {/* Day-10 B6 — privacy card moved above the description block. The card
          is the load-bearing differentiation against Patreon/Skool, so a
          first-time visitor sees it before the long description scrolls
          off the fold on mobile. */}
      <header style={{ display: 'grid', gap: 6 }}>
        <p className="t-label" style={{ color: 'var(--cyan)' }}>Community</p>
        <h1 className="t-h1">{community.name}</h1>
      </header>

      <UmbraMembershipCard
        privacyMode={privacy.privacyMode}
        registered={privacy.registered}
        active={isActive}
        expiresAt={membership.entitlement?.expiresAt}
        previewMode
      />

      {community.description && (
        <p className="t-sm" style={{ color: 'var(--text-2)', maxWidth: 720, margin: 0 }}>
          {community.description}
        </p>
      )}

      <section className="card-elevated" style={{ display: 'grid', gap: 12, padding: 18 }}>
        <p className="t-label" style={{ color: 'var(--cyan)' }}>Preview</p>
        <p className="t-sm" style={{ color: 'var(--text-2)' }}>
          Posts marked preview-eligible by the creator are visible without an active subscription.
          Locked posts show metadata only — bodies unlock after subscribing.
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {isActive ? (
            <Link href={`/app/${cid}/feed`}>
              <Button variant="primary">Open feed</Button>
            </Link>
          ) : (
            <Link href={`/join/${cid}/subscribe`}>
              <Button variant="primary">Subscribe</Button>
            </Link>
          )}
          {community.creator_wallet && (
            <TipButton
              recipient={community.creator_wallet}
              label={community.name}
            />
          )}
        </div>
      </section>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 24px', display: 'grid', gap: 18 }}>
      {children}
    </div>
  );
}
