'use client';

import { Suspense, useEffect, useState } from 'react';
import { CreatorStudioLayout } from '@/components/layout/CreatorStudioLayout';
import { CreatorTipQrCard } from '@/components/tip/CreatorTipQrCard';
import { getCommunity } from '@/lib/api/communities';
import type { Community } from '@/lib/types';

export default function StudioSettingsPage({ params }: { params: { cid: string } }) {
  return (
    <CreatorStudioLayout title="Settings">
      <Suspense fallback={null}>
        <SettingsInner cid={params.cid} />
      </Suspense>
    </CreatorStudioLayout>
  );
}

function SettingsInner({ cid }: { cid: string }) {
  const [community, setCommunity] = useState<Community | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getCommunity(cid)
      .then((c) => { if (!cancelled) setCommunity(c); })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : 'failed'); });
    return () => { cancelled = true; };
  }, [cid]);

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 24px', display: 'grid', gap: 18 }}>
      <header>
        <p className="t-label" style={{ color: 'var(--cyan)' }}>Studio</p>
        <h1 className="t-h1">Settings</h1>
        <p className="t-sm" style={{ color: 'var(--text-2)', maxWidth: 720 }}>
          Community metadata and creator-owned configuration. Subscriber identity
          data is outside this page&apos;s allowed surface.
        </p>
      </header>

      {error && (
        <p className="t-sm" style={{ color: 'var(--danger)' }}>{error}</p>
      )}

      {community?.creator_wallet && (
        <CreatorTipQrCard
          creator={community.creator_wallet}
          communityName={community.name}
        />
      )}

      {!community && !error && (
        <p className="t-sm" style={{ color: 'var(--text-2)' }}>Loading…</p>
      )}
    </div>
  );
}
