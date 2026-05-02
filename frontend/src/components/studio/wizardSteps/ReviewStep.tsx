import { formatUsdc, parseUsdc } from '@/lib/chain/usdc';
import type { CreateCommunityDraft } from '@/lib/validation/createCommunity';

interface ReviewStepProps {
  draft: CreateCommunityDraft;
}

export function ReviewStep({ draft }: ReviewStepProps) {
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <section className="card-sm">
        <p className="t-label" style={{ color: 'var(--cyan)', marginBottom: 10 }}>Community</p>
        <div style={{ display: 'grid', gap: 8 }}>
          <SummaryRow label="Name" value={draft.name} />
          <SummaryRow label="Symbol" value={draft.symbol} />
          <SummaryRow label="Category" value={draft.category} />
          <SummaryRow label="Description" value={draft.description || 'No description'} />
        </div>
      </section>

      <section className="card-sm">
        <p className="t-label" style={{ color: 'var(--cyan)', marginBottom: 10 }}>Membership tiers</p>
        <div style={{ overflowX: 'auto' }}>
          <table className="dtable" style={{ minWidth: 560 }}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Price</th>
                <th>Duration</th>
              </tr>
            </thead>
            <tbody>
              {draft.tiers.map((tier) => (
                <tr key={tier.id}>
                  <td><span className="t-mono">{tier.id}</span></td>
                  <td>{tier.name}</td>
                  <td><span className="t-mono">{formatUsdc(parseUsdc(tier.price))} USDC</span></td>
                  <td>{tier.durationDays} days</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '120px minmax(0, 1fr)', gap: 12 }}>
      <span className="t-sm" style={{ color: 'var(--text-3)' }}>{label}</span>
      <span className="t-sm" style={{ color: 'var(--text-1)' }}>{value}</span>
    </div>
  );
}
