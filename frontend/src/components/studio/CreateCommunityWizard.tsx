'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { createCommunityMetadata, creatorActionMessage } from '@/lib/api/communities';
import type { TierLevel } from '@/lib/chain/types';
import { useChain } from '@/lib/chain/useChain';
import { useSortsSignMessage } from '@/components/providers/PrivyProvider';
import { formatUsdc, parseUsdc } from '@/lib/chain/usdc';
import { CHAINS } from '@/lib/chain/chains';
import {
  DEFAULT_TIERS,
  type BasicsDraft,
  type CreateCommunityDraft,
  type TierDraft,
  type WizardStep,
  validateBasics,
  validateCreateCommunityDraft,
  validateTiers,
} from '@/lib/validation/createCommunity';
import { BasicsStep } from './wizardSteps/BasicsStep';
import { DeployStep } from './wizardSteps/DeployStep';
import { ReviewStep } from './wizardSteps/ReviewStep';
import { TiersStep } from './wizardSteps/TiersStep';

const steps: Array<{ id: WizardStep; label: string }> = [
  { id: 'basics', label: 'Basics' },
  { id: 'tiers', label: 'Tiers' },
  { id: 'review', label: 'Review' },
  { id: 'deploy', label: 'Deploy' },
];

const initialDraft: CreateCommunityDraft = {
  name: '',
  symbol: '',
  description: '',
  category: 'other',
  tiers: DEFAULT_TIERS,
};

export function CreateCommunityWizard() {
  const adapter = useChain();
  const { address, createCommunity, transactionState, chain } = adapter;
  const { signMessageAsync } = useSortsSignMessage();
  const chainEntry = CHAINS[chain];
  const [draft, setDraft] = useState<CreateCommunityDraft>(initialDraft);
  const [stepIndex, setStepIndex] = useState(0);
  const [deployError, setDeployError] = useState<string | null>(null);
  const [deploying, setDeploying] = useState(false);

  const step = steps[stepIndex].id;
  const basicsValidation = useMemo(() => validateBasics(draft), [draft]);
  const tiersValidation = useMemo(() => validateTiers(draft.tiers), [draft.tiers]);
  const fullValidation = useMemo(() => validateCreateCommunityDraft(draft), [draft]);
  const currentValidation = step === 'basics' ? basicsValidation : step === 'tiers' ? tiersValidation : fullValidation;

  const canGoNext = currentValidation.valid;
  const canDeploy = fullValidation.valid && Boolean(address);

  const updateBasics = (basics: BasicsDraft) => {
    setDraft((current) => ({ ...current, ...basics }));
  };

  const updateTiers = (tiers: TierDraft[]) => {
    setDraft((current) => ({ ...current, tiers }));
  };

  const goNext = () => {
    if (!canGoNext) return;
    setStepIndex((current) => Math.min(current + 1, steps.length - 1));
  };

  const goBack = () => {
    setStepIndex((current) => Math.max(current - 1, 0));
  };

  const deploy = async () => {
    const validation = validateCreateCommunityDraft(draft);
    if (!validation.valid || !address) {
      setDeployError(validation.errors[0] ?? 'Connect a wallet before deploying.');
      return;
    }

    setDeploying(true);
    setDeployError(null);

    try {
      // On Solana, the wizard's tier price input is rendered as decimal SOL.
      // Convert to lamports (1 SOL = 1e9 lamports). On EVM, USDC base units (6 dec).
      const parsePrice = (raw: string): bigint => {
        if (chain === 'solana-devnet') {
          const n = Number(raw);
          if (!Number.isFinite(n) || n < 0) return 0n;
          return BigInt(Math.round(n * 1_000_000_000));
        }
        return parseUsdc(raw);
      };

      const tierInputs = draft.tiers.map((tier) => ({
        level: tier.id,
        priceWei: parsePrice(tier.price),
        durationSeconds: BigInt(tier.durationDays.trim()) * 86400n,
      }));

      const result = await createCommunity({
        name: draft.name.trim(),
        symbol: draft.symbol.trim(),
        tiers: tierInputs,
      });

      if (!result.contractAddress) {
        throw new Error('Community deployment confirmed, but the community account address was not found.');
      }

      const creatorSig = await signMessageAsync({
        message: creatorActionMessage(result.contractAddress, address),
      });

      const symbolLabel = chainEntry.nativeCurrency.label;
      await createCommunityMetadata({
        contractAddress: result.contractAddress,
        name: draft.name.trim(),
        symbol: draft.symbol.trim(),
        description: draft.description.trim(),
        category: draft.category,
        creatorWallet: address,
        // Backend treats the chainId field opaquely — pass the discriminator string.
        // The legacy Arbitrum path still records the EVM numeric id when set.
        chainId: chain,
        isInstitution: false,
        tiers: draft.tiers.map((tier) => {
          const price = parsePrice(tier.price);
          return {
            level: tier.id as TierLevel,
            name: tier.name.trim(),
            priceWei: price.toString(),
            priceDisplay:
              chain === 'solana-devnet'
                ? `${tier.price} ${symbolLabel}`
                : `${formatUsdc(price)} USDC`,
            durationDays: Number(tier.durationDays.trim()),
          };
        }),
      }, creatorSig);
    } catch (error) {
      setDeployError(error instanceof Error ? error.message : 'Failed to deploy community.');
    } finally {
      setDeploying(false);
    }
  };

  return (
    <div style={{ maxWidth: 980, margin: '0 auto', padding: '32px 24px' }}>
      <section className="card-elevated" style={{ display: 'grid', gap: 22 }}>
        <header style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <p className="t-label" style={{ color: 'var(--cyan)', marginBottom: 8 }}>Create community</p>
            <h1 className="t-h1" style={{ marginBottom: 8 }}>Deploy a private membership contract</h1>
            <p className="t-sm" style={{ color: 'var(--text-2)', maxWidth: 680 }}>
              Configure metadata and USDC-priced tiers. SORTS keeps creator analytics aggregate-only after deployment.
            </p>
          </div>
          <Badge variant="cyan">USDC</Badge>
        </header>

        <StepIndicator current={stepIndex} />

        <div>
          {step === 'basics' && (
            <BasicsStep value={draft} fieldErrors={basicsValidation.fieldErrors} onChange={updateBasics} />
          )}
          {step === 'tiers' && (
            <TiersStep tiers={draft.tiers} fieldErrors={tiersValidation.fieldErrors} onChange={updateTiers} />
          )}
          {step === 'review' && <ReviewStep draft={draft} />}
          {step === 'deploy' && (
            <DeployStep
              draft={draft}
              error={deployError}
              deploying={deploying || transactionState !== 'idle'}
              canDeploy={canDeploy}
              onDeploy={deploy}
            />
          )}
        </div>

        {currentValidation.errors.length > 0 && step !== 'deploy' && (
          <div className="card-sm" style={{ borderColor: 'rgba(239,68,68,0.28)', color: 'var(--danger)' }}>
            {currentValidation.errors[0]}
          </div>
        )}

        <footer style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <Button type="button" variant="secondary" disabled={stepIndex === 0 || deploying} onClick={goBack}>
            Back
          </Button>
          {step !== 'deploy' && (
            <Button type="button" disabled={!canGoNext} onClick={goNext}>
              Next
            </Button>
          )}
        </footer>
      </section>
    </div>
  );
}

function StepIndicator({ current }: { current: number }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 8 }}>
      {steps.map((step, index) => {
        const active = index === current;
        const complete = index < current;
        return (
          <div
            key={step.id}
            style={{
              border: `1px solid ${active || complete ? 'var(--border-cyan)' : 'var(--border-subtle)'}`,
              borderRadius: 'var(--r-md)',
              background: active ? 'var(--cyan-dim)' : 'var(--bg-card)',
              padding: '10px 12px',
              minWidth: 0,
            }}
          >
            <p className="t-mono" style={{ color: active || complete ? 'var(--cyan)' : 'var(--text-3)', marginBottom: 3 }}>
              {String(index + 1).padStart(2, '0')}
            </p>
            <p className="t-sm" style={{ color: active ? 'var(--text-1)' : 'var(--text-2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {step.label}
            </p>
          </div>
        );
      })}
    </div>
  );
}
