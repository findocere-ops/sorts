import type { TierLevel } from '@/lib/chain/types';
import { parseUsdc } from '@/lib/chain/usdc';

export const COMMUNITY_CATEGORIES = ['alpha', 'research', 'education', 'institution', 'protocol', 'other'] as const;

export type CommunityCategory = typeof COMMUNITY_CATEGORIES[number];
export type WizardStep = 'basics' | 'tiers' | 'review' | 'deploy';

export interface BasicsDraft {
  name: string;
  symbol: string;
  description: string;
  category: CommunityCategory;
}

export interface TierDraft {
  id: TierLevel;
  name: string;
  price: string;
  durationDays: string;
}

export interface CreateCommunityDraft extends BasicsDraft {
  tiers: TierDraft[];
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  fieldErrors: Record<string, string>;
}

export const DEFAULT_TIERS: TierDraft[] = [
  { id: 1, name: 'Basic', price: '10', durationDays: '30' },
  { id: 2, name: 'Pro', price: '25', durationDays: '30' },
  { id: 3, name: 'VIP', price: '50', durationDays: '30' },
];

export function validateBasics(draft: BasicsDraft): ValidationResult {
  const fieldErrors: Record<string, string> = {};

  if (!draft.name.trim()) {
    fieldErrors.name = 'Community name is required.';
  }

  if (!draft.symbol.trim()) {
    fieldErrors.symbol = 'Symbol is required.';
  } else if (draft.symbol.length > 5) {
    fieldErrors.symbol = 'Symbol must be 5 characters or fewer.';
  } else if (draft.symbol !== draft.symbol.toUpperCase()) {
    fieldErrors.symbol = 'Symbol must be uppercase.';
  }

  if (!COMMUNITY_CATEGORIES.includes(draft.category)) {
    fieldErrors.category = 'Choose a valid category.';
  }

  return toResult(fieldErrors);
}

export function validateTiers(tiers: TierDraft[]): ValidationResult {
  const fieldErrors: Record<string, string> = {};

  if (tiers.length < 1 || tiers.length > 3) {
    fieldErrors.tiers = 'Create between 1 and 3 tiers.';
  }

  const seen = new Set<TierLevel>();
  tiers.forEach((tier, index) => {
    const prefix = `tiers.${index}`;

    if (seen.has(tier.id)) {
      fieldErrors[`${prefix}.id`] = 'Tier IDs must be unique.';
    }
    seen.add(tier.id);

    if (!tier.name.trim()) {
      fieldErrors[`${prefix}.name`] = 'Tier name is required.';
    }

    try {
      if (parseUsdc(tier.price) <= 0n) {
        fieldErrors[`${prefix}.price`] = 'Price must be greater than 0 USDC.';
      }
    } catch (error) {
      fieldErrors[`${prefix}.price`] = error instanceof Error ? error.message : 'Enter a valid USDC price.';
    }

    if (!/^\d+$/.test(tier.durationDays.trim()) || BigInt(tier.durationDays.trim() || '0') <= 0n) {
      fieldErrors[`${prefix}.durationDays`] = 'Duration must be a positive whole number of days.';
    }
  });

  return toResult(fieldErrors);
}

export function validateCreateCommunityDraft(draft: CreateCommunityDraft): ValidationResult {
  const basics = validateBasics(draft);
  const tiers = validateTiers(draft.tiers);
  const fieldErrors = { ...basics.fieldErrors, ...tiers.fieldErrors };
  return toResult(fieldErrors);
}

function toResult(fieldErrors: Record<string, string>): ValidationResult {
  const errors = Object.values(fieldErrors);
  return {
    valid: errors.length === 0,
    errors,
    fieldErrors,
  };
}
