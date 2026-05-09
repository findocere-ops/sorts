/**
 * Day-7 demo seed — inserts 2 sample communities + a few posts so a fresh
 * deploy isn't an empty surface.
 *
 *  Run:    DATABASE_URL=postgres://… pnpm --filter @sorts/backend exec \
 *            ts-node backend/scripts/seed-devnet-demo.ts
 *
 *  Idempotent: every INSERT uses ON CONFLICT DO NOTHING.
 *
 *  Privacy: the seed inserts no subscriber data. Communities + posts only.
 */

import { Pool } from 'pg';

const COMMUNITY_1 = {
  id: 'demo-research',
  chain_id: 'solana-devnet',
  contract_address: 'AEp6VuJqfctTRQpZP3LDjKcua4C1jGP8YT721AMSBkFV',
  name: 'On-chain Research Lab',
  symbol: 'OCRL',
  description: 'Demo research community on Solana devnet. Aggregate-only analytics; no subscriber list ever exposed to the creator.',
  category: 'research',
  creator_wallet: '2hbt2arr3D7S6A3jkfbT5cJ2se19TBAPuuXJ48yiBATQ',
};
const COMMUNITY_2 = {
  id: 'demo-alpha',
  chain_id: 'solana-devnet',
  contract_address: 'CxDemoAlpha22222222222222222222222222222222',
  name: 'Devnet Alpha Signals',
  symbol: 'DALP',
  description: 'Devnet experimental community. Mark posts preview-eligible to share with the 2-community/7-day preview cap.',
  category: 'alpha',
  creator_wallet: '2hbt2arr3D7S6A3jkfbT5cJ2se19TBAPuuXJ48yiBATQ',
};

const TIERS = [
  { id: 'demo-research-t1', community_id: 'demo-research', level: 1, name: 'Reader', price_wei: '50000000', price_display: '0.05 SOL', duration_days: 30 },
  { id: 'demo-alpha-t1',    community_id: 'demo-alpha',    level: 1, name: 'Member', price_wei: '50000000', price_display: '0.05 SOL', duration_days: 30 },
];

const POSTS = [
  { id: 'demo-research-p1', community_id: 'demo-research', creator_wallet: COMMUNITY_1.creator_wallet, title: 'Welcome to the On-chain Research Lab', body: 'This is a preview-eligible post. Non-members can read it under the Day-5 quota. Subscribe to unlock the rest of the feed.', preview_eligible: true,  tier_required: 1 },
  { id: 'demo-research-p2', community_id: 'demo-research', creator_wallet: COMMUNITY_1.creator_wallet, title: 'Member-only research note', body: 'Locked post. Only active members see this body.', preview_eligible: false, tier_required: 1 },
  { id: 'demo-alpha-p1',    community_id: 'demo-alpha',    creator_wallet: COMMUNITY_2.creator_wallet, title: 'Preview: weekly devnet rollup', body: 'Devnet experimental — weekly aggregate stats, no per-wallet data.', preview_eligible: true,  tier_required: 1 },
];

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('[seed] DATABASE_URL not set — refusing to seed.');
    process.exit(2);
  }
  const pool = new Pool({
    connectionString: url,
    ssl: url.includes('sslmode=disable') || url.includes('localhost') ? false : { rejectUnauthorized: true },
  });

  for (const c of [COMMUNITY_1, COMMUNITY_2]) {
    await pool.query(
      `INSERT INTO communities (id, chain_id, contract_address, name, symbol, description, category, creator_wallet)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (id) DO NOTHING`,
      [c.id, c.chain_id, c.contract_address, c.name, c.symbol, c.description, c.category, c.creator_wallet],
    );
  }
  for (const t of TIERS) {
    await pool.query(
      `INSERT INTO tiers (id, community_id, level, name, price_wei, price_display, duration_days)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (id) DO NOTHING`,
      [t.id, t.community_id, t.level, t.name, t.price_wei, t.price_display, t.duration_days],
    );
  }
  for (const p of POSTS) {
    await pool.query(
      `INSERT INTO content (id, community_id, creator_wallet, title, body, content_type, tier_required, preview_eligible)
       VALUES ($1,$2,$3,$4,$5,'post',$6,$7)
       ON CONFLICT (id) DO NOTHING`,
      [p.id, p.community_id, p.creator_wallet, p.title, p.body, p.tier_required, p.preview_eligible],
    );
  }

  console.log('[seed] ok — 2 communities, 2 tiers, 3 posts upserted');
  await pool.end();
}

main().catch((err) => {
  const message = err instanceof Error ? err.message : 'unknown error';
  console.error(`[seed] failed: ${message}`);
  process.exit(1);
});
