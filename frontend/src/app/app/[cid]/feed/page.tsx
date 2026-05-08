'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { SubscriberAppLayout } from '@/components/layout/SubscriberAppLayout';
import { getCommunity } from '@/lib/api/communities';
import type { Community } from '@/lib/types';
import { useChain } from '@/lib/chain/useChain';
import { useUmbraPrivacy } from '@/hooks/useUmbraPrivacy';
import { useSolanaMembership } from '@/hooks/useSolanaMembership';
import { UmbraMembershipCard } from '@/components/privacy/UmbraMembershipCard';
import { TipButton } from '@/components/tip/TipButton';

interface FeedPost {
  id: string;
  title: string;
  body?: string | null;
  preview_eligible?: boolean;
  locked?: boolean;
  tier_required?: 1 | 2 | 3;
  created_at?: string;
}

export default function SubscriberFeedPage({ params }: { params: { cid: string } }) {
  return (
    <SubscriberAppLayout title="Feed">
      <Suspense fallback={null}>
        <FeedInner cid={params.cid} />
      </Suspense>
    </SubscriberAppLayout>
  );
}

function FeedInner({ cid }: { cid: string }) {
  const adapter = useChain();
  const subscriber = adapter.address ?? null;
  const privacy = useUmbraPrivacy(subscriber);
  const [community, setCommunity] = useState<Community | null>(null);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getCommunity(cid)
      .then((c) => { if (!cancelled) setCommunity(c); })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : 'failed'); });
    return () => { cancelled = true; };
  }, [cid]);

  const membership = useSolanaMembership(community?.contract_address ?? null);
  const isActive = membership.entitlement?.active ?? false;

  useEffect(() => {
    if (!cid) return;
    let cancelled = false;
    (async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
        const url = new URL(`${apiUrl}/api/content/${cid}`);
        if (subscriber) url.searchParams.set('wallet', subscriber);
        const res = await fetch(url.toString());
        if (!res.ok) return;
        const json = (await res.json()) as { success: boolean; data?: FeedPost[] };
        if (cancelled) return;
        if (json.success) setPosts(Array.isArray(json.data) ? json.data : []);
      } catch {
        // soft fail
      }
    })();
    return () => { cancelled = true; };
  }, [cid, subscriber]);

  if (error) {
    return <Shell><p className="t-sm" style={{ color: 'var(--danger)' }}>{error}</p></Shell>;
  }
  if (!community) {
    return <Shell><p className="t-sm" style={{ color: 'var(--text-2)' }}>Loading…</p></Shell>;
  }

  return (
    <Shell>
      <header style={{ display: 'grid', gap: 6 }}>
        <p className="t-label" style={{ color: 'var(--cyan)' }}>Feed</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <h1 className="t-h1" style={{ flex: 1, minWidth: 0 }}>{community.name}</h1>
          {community.creator_wallet && (
            <TipButton
              recipient={community.creator_wallet}
              label={community.name}
            />
          )}
        </div>
      </header>

      <UmbraMembershipCard
        privacyMode={privacy.privacyMode}
        registered={privacy.registered}
        active={isActive}
        expiresAt={membership.entitlement?.expiresAt}
        previewMode={!isActive}
      />

      {!isActive && (
        <section className="card-elevated" style={{ padding: 18, display: 'grid', gap: 8 }}>
          <p className="t-sm" style={{ color: 'var(--text-2)' }}>
            Your wallet does not have an active subscription. Posts marked preview-eligible by the
            creator are visible below; everything else is locked.
          </p>
          <Link href={`/join/${cid}/subscribe`} className="t-sm" style={{ color: 'var(--cyan)' }}>
            Subscribe to unlock the full feed →
          </Link>
        </section>
      )}

      <section style={{ display: 'grid', gap: 14 }}>
        {posts.length === 0 && (
          <p className="t-sm" style={{ color: 'var(--text-2)' }}>No posts yet.</p>
        )}
        {posts.map((post) => {
          const previewEligible = Boolean(post.preview_eligible);
          const showBody = isActive || previewEligible;
          return (
            <article
              key={post.id}
              className="card-elevated"
              style={{ padding: 16, display: 'grid', gap: 6, opacity: showBody ? 1 : 0.7 }}
            >
              <h3 className="t-h3">{post.title}</h3>
              {showBody && post.body ? (
                <p className="t-sm" style={{ color: 'var(--text-1)' }}>{post.body}</p>
              ) : (
                <p className="t-xs" style={{ color: 'var(--text-3, #999)' }}>
                  Locked — body hidden until your subscription is active.
                </p>
              )}
              {previewEligible && !isActive && (
                <span className="t-xs" style={{ color: 'var(--cyan)' }}>Preview</span>
              )}
            </article>
          );
        })}
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
