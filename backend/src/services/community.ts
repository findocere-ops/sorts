import { v4 as uuid } from 'uuid';
import type { Database } from 'better-sqlite3';
import { z } from 'zod';

export interface CommunityRow {
  id: string;
  chain_id: string;
  contract_address: string;
  name: string;
  symbol: string;
  description: string | null;
  category: string;
  creator_wallet: string;
  is_institution: number;
  created_at: string;
}

export interface TierRow {
  id: string;
  community_id: string;
  level: number;
  name: string;
  price_wei: string;
  price_display: string;
  duration_days: number;
}

export const CreateCommunitySchema = z.object({
  contractAddress: z.string().startsWith('0x'),
  name: z.string().min(1).max(100),
  symbol: z.string().min(1).max(5),
  description: z.string().max(1000).optional(),
  category: z.enum(['alpha', 'research', 'education', 'institution', 'protocol', 'other']).default('other'),
  creatorWallet: z.string().startsWith('0x'),
  chainId: z.string().default('arbitrum-sepolia'),
  isInstitution: z.boolean().default(false),
  tiers: z.array(z.object({
    level: z.number().int().min(1).max(3),
    name: z.string().min(1).max(50),
    priceWei: z.string(),
    priceDisplay: z.string(),
    durationDays: z.number().int().min(1).max(365),
  })).min(1).max(3),
});

export type CreateCommunityInput = z.infer<typeof CreateCommunitySchema>;

export class CommunityService {
  constructor(private db: Database) {}

  list(category?: string): (CommunityRow & { tiers: TierRow[] })[] {
    const rows = this.db.prepare(`
      SELECT c.* FROM communities c
      ${category && category !== 'all' ? 'WHERE c.category = ?' : ''}
      ORDER BY c.created_at DESC
    `).all(...(category && category !== 'all' ? [category] : [])) as CommunityRow[];

    return rows.map(c => ({
      ...c,
      tiers: this.db.prepare('SELECT * FROM tiers WHERE community_id = ? ORDER BY level').all(c.id) as TierRow[],
    }));
  }

  getById(id: string): (CommunityRow & { tiers: TierRow[] }) | null {
    const community = this.db.prepare('SELECT * FROM communities WHERE id = ?').get(id) as CommunityRow | undefined;
    if (!community) return null;
    const tiers = this.db.prepare('SELECT * FROM tiers WHERE community_id = ? ORDER BY level').all(id) as TierRow[];
    return { ...community, tiers };
  }

  getByCreator(creatorWallet: string): (CommunityRow & { tiers: TierRow[] })[] {
    const rows = this.db.prepare(
      'SELECT * FROM communities WHERE LOWER(creator_wallet) = LOWER(?) ORDER BY created_at DESC'
    ).all(creatorWallet) as CommunityRow[];

    return rows.map(c => ({
      ...c,
      tiers: this.db.prepare('SELECT * FROM tiers WHERE community_id = ? ORDER BY level').all(c.id) as TierRow[],
    }));
  }

  create(input: CreateCommunityInput): string {
    const communityId = uuid();

    this.db.prepare(`
      INSERT INTO communities (id, chain_id, contract_address, name, symbol, description, category, creator_wallet, is_institution)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      communityId,
      input.chainId,
      input.contractAddress,
      input.name,
      input.symbol,
      input.description ?? '',
      input.category,
      input.creatorWallet.toLowerCase(),
      input.isInstitution ? 1 : 0,
    );

    const insertTier = this.db.prepare(`
      INSERT INTO tiers (id, community_id, level, name, price_wei, price_display, duration_days)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    for (const tier of input.tiers) {
      insertTier.run(uuid(), communityId, tier.level, tier.name, tier.priceWei, tier.priceDisplay, tier.durationDays);
    }

    return communityId;
  }
}
