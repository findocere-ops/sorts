import { Button } from '@/components/ui/Button';
import type { TierLevel } from '@/lib/chain/types';
import type { TierDraft } from '@/lib/validation/createCommunity';

interface TiersStepProps {
  tiers: TierDraft[];
  fieldErrors: Record<string, string>;
  onChange: (tiers: TierDraft[]) => void;
}

const tierIds: TierLevel[] = [1, 2, 3];

export function TiersStep({ tiers, fieldErrors, onChange }: TiersStepProps) {
  const updateTier = (index: number, patch: Partial<TierDraft>) => {
    onChange(tiers.map((tier, current) => current === index ? { ...tier, ...patch } : tier));
  };

  const removeTier = (index: number) => {
    onChange(tiers.filter((_, current) => current !== index));
  };

  const addTier = () => {
    const used = new Set(tiers.map((tier) => tier.id));
    const nextId = tierIds.find((id) => !used.has(id)) ?? 1;
    onChange([...tiers, { id: nextId, name: nextId === 1 ? 'Basic' : nextId === 2 ? 'Pro' : 'VIP', price: '10', durationDays: '30' }]);
  };

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      {fieldErrors.tiers && <p className="field-hint" style={{ color: 'var(--danger)' }}>{fieldErrors.tiers}</p>}

      {tiers.map((tier, index) => (
        <section key={index} className="card-sm" style={{ display: 'grid', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <div>
              <p className="t-label" style={{ color: 'var(--cyan)', marginBottom: 4 }}>Tier {index + 1}</p>
              <h3 className="t-h3">{tier.name || 'Untitled tier'}</h3>
            </div>
            <Button type="button" variant="ghost" size="sm" disabled={tiers.length <= 1} onClick={() => removeTier(index)}>
              Remove
            </Button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12 }}>
            <div className="field">
              <label className="field-label" htmlFor={`tier-id-${index}`}>ID</label>
              <select
                id={`tier-id-${index}`}
                className="select"
                value={tier.id}
                onChange={(event) => updateTier(index, { id: Number(event.target.value) as TierLevel })}
              >
                {tierIds.map((id) => <option key={id} value={id}>{id}</option>)}
              </select>
              <FieldError message={fieldErrors[`tiers.${index}.id`]} />
            </div>

            <div className="field">
              <label className="field-label" htmlFor={`tier-name-${index}`}>Name</label>
              <input
                id={`tier-name-${index}`}
                className="input"
                value={tier.name}
                onChange={(event) => updateTier(index, { name: event.target.value })}
                placeholder="Basic"
              />
              <FieldError message={fieldErrors[`tiers.${index}.name`]} />
            </div>

            <div className="field">
              <label className="field-label" htmlFor={`tier-price-${index}`}>USDC price</label>
              <input
                id={`tier-price-${index}`}
                className="input"
                value={tier.price}
                onChange={(event) => updateTier(index, { price: event.target.value })}
                inputMode="decimal"
                placeholder="10"
              />
              <FieldError message={fieldErrors[`tiers.${index}.price`]} />
            </div>

            <div className="field">
              <label className="field-label" htmlFor={`tier-duration-${index}`}>Days</label>
              <input
                id={`tier-duration-${index}`}
                className="input"
                value={tier.durationDays}
                onChange={(event) => updateTier(index, { durationDays: event.target.value })}
                inputMode="numeric"
                placeholder="30"
              />
              <FieldError message={fieldErrors[`tiers.${index}.durationDays`]} />
            </div>
          </div>
        </section>
      ))}

      <div>
        <Button type="button" variant="secondary" size="sm" disabled={tiers.length >= 3} onClick={addTier}>
          Add tier
        </Button>
      </div>
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="field-hint" style={{ color: 'var(--danger)' }}>{message}</p>;
}
