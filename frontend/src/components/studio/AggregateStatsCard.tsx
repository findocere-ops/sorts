'use client';

/** Aggregate-only analytics card.
 *
 *  Privacy contract:
 *    - NEVER renders any wallet address, ENS name, or member identifier.
 *    - NEVER renders any tier breakdown or "top N" subscriber list.
 *    - Only the four scalar counters + the "no individual data" disclosure.
 */
export interface AggregateStats {
  totalMembers: number;
  activeMembers: number;
  expiredMemberships: number;
  activeRatio: number;
  totalRevenueDisplay: string;
  contentCount: number;
}

export function AggregateStatsCard({ stats }: { stats: AggregateStats | null }) {
  return (
    <section
      className="card-elevated"
      style={{
        display: 'grid',
        gap: 14,
        padding: '20px 22px',
        borderRadius: 14,
      }}
    >
      <header style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <p className="t-label" style={{ color: 'var(--cyan)' }}>Aggregate analytics</p>
          <h3 className="t-h3">Community totals</h3>
        </div>
        <span className="t-xs" style={{ color: 'var(--text-3, #999)', alignSelf: 'center' }}>
          Aggregate-only — never renders subscriber wallets, tier breakdowns, or member lists.
        </span>
      </header>
      <dl
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: 14,
          margin: 0,
        }}
      >
        <Stat label="Total members" value={stats?.totalMembers ?? 0} />
        <Stat label="Active members" value={stats?.activeMembers ?? 0} />
        <Stat label="Expired" value={stats?.expiredMemberships ?? 0} />
        <Stat
          label="Active ratio"
          value={stats ? `${(stats.activeRatio * 100).toFixed(1)}%` : '0%'}
        />
        <Stat label="Revenue" value={stats?.totalRevenueDisplay ?? '0'} mono />
        <Stat label="Posts" value={stats?.contentCount ?? 0} />
      </dl>
    </section>
  );
}

function Stat({ label, value, mono }: { label: string; value: string | number; mono?: boolean }) {
  return (
    <div>
      <dt className="t-label" style={{ color: 'var(--text-3, #999)', fontSize: 11, marginBottom: 4 }}>
        {label}
      </dt>
      <dd className={mono ? 't-mono' : undefined} style={{ margin: 0, fontSize: 18 }}>
        {value}
      </dd>
    </div>
  );
}
