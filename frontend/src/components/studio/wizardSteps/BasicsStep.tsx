import type { BasicsDraft, CommunityCategory } from '@/lib/validation/createCommunity';
import { COMMUNITY_CATEGORIES } from '@/lib/validation/createCommunity';

interface BasicsStepProps {
  value: BasicsDraft;
  fieldErrors: Record<string, string>;
  onChange: (value: BasicsDraft) => void;
}

const categoryLabels: Record<CommunityCategory, string> = {
  alpha: 'Alpha',
  research: 'Research',
  education: 'Education',
  institution: 'Institution',
  protocol: 'Protocol',
  other: 'Other',
};

export function BasicsStep({ value, fieldErrors, onChange }: BasicsStepProps) {
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div className="field">
        <label className="field-label" htmlFor="community-name">Community name</label>
        <input
          id="community-name"
          className="input"
          value={value.name}
          onChange={(event) => onChange({ ...value, name: event.target.value })}
          placeholder="Alpha Traders"
        />
        <FieldError message={fieldErrors.name} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
        <div className="field">
          <label className="field-label" htmlFor="community-symbol">Symbol</label>
          <input
            id="community-symbol"
            className="input"
            value={value.symbol}
            onChange={(event) => onChange({ ...value, symbol: event.target.value.toUpperCase().slice(0, 5) })}
            placeholder="ALPHA"
            maxLength={5}
          />
          <p className="field-hint">Up to 5 uppercase characters.</p>
          <FieldError message={fieldErrors.symbol} />
        </div>

        <div className="field">
          <label className="field-label" htmlFor="community-category">Category</label>
          <select
            id="community-category"
            className="select"
            value={value.category}
            onChange={(event) => onChange({ ...value, category: event.target.value as CommunityCategory })}
          >
            {COMMUNITY_CATEGORIES.map((category) => (
              <option key={category} value={category}>{categoryLabels[category]}</option>
            ))}
          </select>
          <FieldError message={fieldErrors.category} />
        </div>
      </div>

      <div className="field">
        <label className="field-label" htmlFor="community-description">Description</label>
        <textarea
          id="community-description"
          className="textarea"
          value={value.description}
          onChange={(event) => onChange({ ...value, description: event.target.value })}
          placeholder="What members unlock inside this community."
        />
      </div>
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="field-hint" style={{ color: 'var(--danger)' }}>{message}</p>;
}
