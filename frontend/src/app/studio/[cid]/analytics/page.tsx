'use client';

import { Suspense, useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { CreatorStudioLayout } from '@/components/layout/CreatorStudioLayout';
import { AggregateStatsCard, type AggregateStats } from '@/components/studio/AggregateStatsCard';
import { CreatorPayrollWithdraw } from '@/components/studio/CreatorPayrollWithdraw';

export default function StudioAnalyticsPage({ params }: { params: { cid: string } }) {
  return (
    <CreatorStudioLayout title="Analytics">
      <Suspense fallback={null}>
        <AnalyticsInner cid={params.cid} />
      </Suspense>
    </CreatorStudioLayout>
  );
}

function AnalyticsInner({ cid }: { cid: string }) {
  const [stats, setStats] = useState<AggregateStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { publicKey } = useWallet();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
        const res = await fetch(`${apiUrl}/api/analytics/community/${cid}`);
        if (!res.ok) throw new Error(`status ${res.status}`);
        const json = (await res.json()) as { success: boolean; data?: AggregateStats };
        if (cancelled) return;
        if (json.success && json.data) setStats(json.data);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'failed');
      }
    })();
    return () => { cancelled = true; };
  }, [cid]);

  return (
    <div style={{ maxWidth: 980, margin: '0 auto', padding: '32px 24px', display: 'grid', gap: 18 }}>
      <header>
        <p className="t-label" style={{ color: 'var(--cyan)' }}>Studio</p>
        <h1 className="t-h1">Analytics</h1>
        <p className="t-sm" style={{ color: 'var(--text-2)', maxWidth: 720 }}>
          Aggregate-only stats for this community. Subscriber wallets, tier ownership lists, and
          per-member tables are never rendered here — by design.
        </p>
      </header>
      <AggregateStatsCard stats={stats} />
      {error && <p className="t-sm" style={{ color: 'var(--danger)' }}>{error}</p>}
      {publicKey && <CreatorPayrollWithdraw recipient={publicKey.toBase58()} />}
    </div>
  );
}
