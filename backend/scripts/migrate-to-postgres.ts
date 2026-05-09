/**
 * Day-7 idempotent Postgres schema migration.
 *
 *  Run:    DATABASE_URL=postgres://… pnpm --filter @sorts/backend exec \
 *            ts-node backend/scripts/migrate-to-postgres.ts
 *
 *  All statements are CREATE TABLE IF NOT EXISTS / CREATE INDEX IF NOT
 *  EXISTS. There are no DROP / ALTER COLUMN / RENAME steps — running
 *  this twice is a no-op.
 *
 *  Privacy invariants preserved across the SQLite → Postgres translation:
 *    - No `members` table, no per-user payment log, no tier history.
 *    - `preview_quota` and `wallet_links` are isolated tables; the
 *      route layer enforces "never joined in any API response" (Day 5).
 *    - `nonces` (Day 2.5) keeps its 5-min TTL semantic via a
 *      `expires_at` BIGINT (unix seconds), matching the SQLite shape.
 */

import { Pool } from 'pg';

const SQL = `
CREATE TABLE IF NOT EXISTS communities (
  id                 TEXT PRIMARY KEY,
  chain_id           TEXT NOT NULL DEFAULT 'arbitrum-sepolia',
  contract_address   TEXT NOT NULL UNIQUE,
  name               TEXT NOT NULL,
  symbol             TEXT NOT NULL,
  description        TEXT,
  category           TEXT NOT NULL DEFAULT 'other',
  creator_wallet     TEXT NOT NULL,
  is_institution     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tiers (
  id            TEXT PRIMARY KEY,
  community_id  TEXT NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  level         INT NOT NULL CHECK (level IN (1,2,3)),
  name          TEXT NOT NULL,
  price_wei     TEXT NOT NULL,
  price_display TEXT NOT NULL,
  duration_days INT NOT NULL DEFAULT 30,
  UNIQUE (community_id, level)
);

CREATE TABLE IF NOT EXISTS membership_cache (
  id              TEXT PRIMARY KEY,
  community_id    TEXT NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  wallet_address  TEXT NOT NULL,
  expires_at      TIMESTAMPTZ,
  synced_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (community_id, wallet_address)
);

CREATE TABLE IF NOT EXISTS content (
  id                     TEXT PRIMARY KEY,
  community_id           TEXT NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  creator_wallet         TEXT NOT NULL,
  title                  TEXT NOT NULL,
  body                   TEXT,
  content_type           TEXT NOT NULL DEFAULT 'post',
  tier_required          INT NOT NULL DEFAULT 1,
  pinned                 BOOLEAN NOT NULL DEFAULT FALSE,
  published              BOOLEAN NOT NULL DEFAULT TRUE,
  preview_eligible       BOOLEAN NOT NULL DEFAULT FALSE,
  likes_count            INT NOT NULL DEFAULT 0,
  comments_count         INT NOT NULL DEFAULT 0,
  protected_data_address TEXT,
  protected_data_name    TEXT,
  protection_provider    TEXT NOT NULL DEFAULT 'none',
  iapp_address           TEXT,
  protection_status      TEXT NOT NULL DEFAULT 'plain',
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wallet_links (
  id               TEXT PRIMARY KEY,
  telegram_user_id TEXT NOT NULL UNIQUE,
  wallet_address   TEXT NOT NULL,
  linked_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS link_challenges (
  code             TEXT PRIMARY KEY,
  telegram_user_id TEXT NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at       TIMESTAMPTZ NOT NULL,
  used             BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS analytics_cache (
  community_id      TEXT PRIMARY KEY REFERENCES communities(id) ON DELETE CASCADE,
  total_members     INT NOT NULL DEFAULT 0,
  active_members    INT NOT NULL DEFAULT 0,
  total_revenue_wei TEXT NOT NULL DEFAULT '0',
  content_count     INT NOT NULL DEFAULT 0,
  cached_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS nonces (
  nonce      TEXT NOT NULL,
  wallet     TEXT NOT NULL,
  expires_at BIGINT NOT NULL,
  PRIMARY KEY (nonce, wallet)
);
CREATE INDEX IF NOT EXISTS idx_nonces_expires_at ON nonces (expires_at);

CREATE TABLE IF NOT EXISTS preview_quota (
  id            TEXT PRIMARY KEY,
  wallet        TEXT,
  session_token TEXT,
  community_id  TEXT NOT NULL,
  created_at    BIGINT NOT NULL,
  UNIQUE (wallet, session_token, community_id)
);
CREATE INDEX IF NOT EXISTS idx_preview_quota_created ON preview_quota (created_at);
CREATE INDEX IF NOT EXISTS idx_preview_quota_wallet  ON preview_quota (wallet);
CREATE INDEX IF NOT EXISTS idx_preview_quota_session ON preview_quota (session_token);
`;

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('[migrate] DATABASE_URL not set — refusing to migrate.');
    process.exit(2);
  }

  const pool = new Pool({
    connectionString: url,
    ssl:
      url.includes('sslmode=disable') || url.includes('localhost')
        ? false
        : { rejectUnauthorized: true },
  });

  console.log('[migrate] applying schema (idempotent)…');
  // Issue each top-level statement separately — pg rejects multi-statement
  // strings under simple-query protocol in some drivers.
  const stmts = SQL.split(/;\s*\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  for (const stmt of stmts) {
    await pool.query(stmt);
  }
  console.log(`[migrate] ok — ${stmts.length} statements applied`);
  await pool.end();
}

main().catch((err) => {
  // Do not echo the whole error in case the DSN appears in a traceback.
  const message = err instanceof Error ? err.message : 'unknown error';
  console.error(`[migrate] failed: ${message}`);
  process.exit(1);
});
