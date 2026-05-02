import { Button } from '@/components/ui/Button';
import { formatUsdc, parseUsdc } from '@/lib/chain/usdc';
import type { CreateCommunityDraft } from '@/lib/validation/createCommunity';

interface DeployStepProps {
  draft: CreateCommunityDraft;
  error?: string | null;
  deploying: boolean;
  canDeploy: boolean;
  onDeploy: () => void;
}

export function DeployStep({ draft, error, deploying, canDeploy, onDeploy }: DeployStepProps) {
  const totalMonthly = draft.tiers.reduce((sum, tier) => sum + parseUsdc(tier.price), 0n);

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <section className="card-sm" style={{ display: 'grid', gap: 12 }}>
        <div>
          <p className="t-label" style={{ color: 'var(--orange)', marginBottom: 8 }}>Ready to deploy</p>
          <h2 className="t-h2" style={{ marginBottom: 8 }}>{draft.name}</h2>
          <p className="t-sm" style={{ color: 'var(--text-2)', maxWidth: 620 }}>
            This will deploy a new SortsMembership contract from SortsFactory. Subscriber payments are priced in USDC base units.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
          <Metric label="Symbol" value={draft.symbol} />
          <Metric label="Tiers" value={String(draft.tiers.length)} />
          <Metric label="Listed prices" value={`${formatUsdc(totalMonthly)} USDC`} />
        </div>

        {error && (
          <div className="card-sm" style={{ borderColor: 'rgba(239,68,68,0.28)', color: 'var(--danger)' }}>
            {error}
          </div>
        )}

        <div>
          <Button type="button" size="lg" loading={deploying} disabled={!canDeploy || deploying} onClick={onDeploy}>
            Deploy community
          </Button>
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric-card">
      <p className="stat-lbl">{label}</p>
      <p className="t-mono" style={{ color: 'var(--text-1)', marginTop: 6 }}>{value}</p>
    </div>
  );
}
