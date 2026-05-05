import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = process.env.DATABASE_PATH ?? './data/sorts.db';

/** Picks the active driver. Returns `'postgres'` when `DATABASE_URL` is set,
 *  otherwise `'sqlite'`. Documented in `docs/INFRASTRUCTURE.md` as the
 *  rollback handle: clear `DATABASE_URL` to fall back to SQLite + Render
 *  Persistent Disk. */
export function selectDriver(): 'sqlite' | 'postgres' {
  return process.env.DATABASE_URL ? 'postgres' : 'sqlite';
}

export function openDb(): Database.Database {
  if (selectDriver() === 'postgres') {
    // The Postgres adapter mirrors the better-sqlite3 surface
    // (`prepare(...).all/get/run` + `exec` + `pragma` no-op + `close`).
    // We cast through `unknown` because better-sqlite3's full Database
    // type carries surface our app does not consume.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { openPostgres } = require('./postgres') as typeof import('./postgres');
    return openPostgres() as unknown as Database.Database;
  }
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  return db;
}

/*
 * Schema authority table:
 *
 * | Table              | Authority    | Notes                                                           |
 * |--------------------|--------------|----------------------------------------------------------------|
 * | communities        | off-chain    | metadata cache; on-chain contract is canonical for membership  |
 * | tiers              | off-chain    | cache of on-chain tier config; prices are on-chain authoritative|
 * | membership_cache   | off-chain    | cache only — NEVER use for access decisions; chain is authority |
 * | content            | off-chain    | fully owned by backend; not on-chain                           |
 * | wallet_links       | off-chain    | Telegram delivery link; never exposed to creators              |
 * | link_challenges    | off-chain    | temporary; expires after first use                             |
 * | analytics_cache    | off-chain    | aggregate stats cached from chain; refreshed on demand         |
 *
 * Fields deliberately absent:
 * - membership_cache.tier_level: tier is private — never stored off-chain
 * - Any per-user payment history: never accessible to creators
 */
export function runMigrations(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS communities (
      id                TEXT PRIMARY KEY,
      chain_id          TEXT NOT NULL DEFAULT 'arbitrum-sepolia',
      contract_address  TEXT NOT NULL UNIQUE,
      name              TEXT NOT NULL,
      symbol            TEXT NOT NULL,
      description       TEXT,
      category          TEXT NOT NULL DEFAULT 'other',
      creator_wallet    TEXT NOT NULL,
      is_institution    INTEGER NOT NULL DEFAULT 0,
      created_at        TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Tiers are a cache of on-chain data. Prices on-chain are authoritative.
    CREATE TABLE IF NOT EXISTS tiers (
      id              TEXT PRIMARY KEY,
      community_id    TEXT NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
      level           INTEGER NOT NULL CHECK(level IN (1,2,3)),
      name            TEXT NOT NULL,
      price_wei       TEXT NOT NULL,
      price_display   TEXT NOT NULL,
      duration_days   INTEGER NOT NULL DEFAULT 30,
      UNIQUE(community_id, level)
    );

    -- Off-chain cache only. DO NOT derive access decisions from this table.
    -- Tier level is intentionally omitted — it is private.
    CREATE TABLE IF NOT EXISTS membership_cache (
      id              TEXT PRIMARY KEY,
      community_id    TEXT NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
      wallet_address  TEXT NOT NULL,
      expires_at      TEXT,
      synced_at       TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(community_id, wallet_address)
    );

    CREATE TABLE IF NOT EXISTS content (
      id              TEXT PRIMARY KEY,
      community_id    TEXT NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
      creator_wallet  TEXT NOT NULL,
      title           TEXT NOT NULL,
      body            TEXT,
      content_type    TEXT NOT NULL DEFAULT 'post',
      tier_required   INTEGER NOT NULL DEFAULT 1,
      pinned          INTEGER NOT NULL DEFAULT 0,
      published       INTEGER NOT NULL DEFAULT 1,
      likes_count     INTEGER NOT NULL DEFAULT 0,
      comments_count  INTEGER NOT NULL DEFAULT 0,
      protected_data_address TEXT,
      protected_data_name    TEXT,
      protection_provider    TEXT NOT NULL DEFAULT 'none',
      iapp_address           TEXT,
      protection_status      TEXT NOT NULL DEFAULT 'plain',
      created_at      TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Telegram delivery links. Wallet address is stored for delivery only — never exposed to creators.
    CREATE TABLE IF NOT EXISTS wallet_links (
      id               TEXT PRIMARY KEY,
      telegram_user_id TEXT UNIQUE NOT NULL,
      wallet_address   TEXT NOT NULL,
      linked_at        TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Temporary challenge codes. Expire after 10 minutes or first use.
    CREATE TABLE IF NOT EXISTS link_challenges (
      code             TEXT PRIMARY KEY,
      telegram_user_id TEXT NOT NULL,
      created_at       TEXT NOT NULL DEFAULT (datetime('now')),
      expires_at       TEXT NOT NULL,
      used             INTEGER NOT NULL DEFAULT 0
    );

    -- Aggregate stats cache. Never stores per-member data.
    CREATE TABLE IF NOT EXISTS analytics_cache (
      community_id      TEXT PRIMARY KEY REFERENCES communities(id) ON DELETE CASCADE,
      total_members     INTEGER NOT NULL DEFAULT 0,
      active_members    INTEGER NOT NULL DEFAULT 0,
      total_revenue_wei TEXT NOT NULL DEFAULT '0',
      content_count     INTEGER NOT NULL DEFAULT 0,
      cached_at         TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Signature replay protection. Each (nonce, wallet) is single-use within
    -- the TTL window (5 min by default). Cleanup happens lazily via the
    -- middleware on every request, so this table stays small.
    CREATE TABLE IF NOT EXISTS nonces (
      nonce       TEXT NOT NULL,
      wallet      TEXT NOT NULL,
      expires_at  INTEGER NOT NULL,
      PRIMARY KEY (nonce, wallet)
    );
    CREATE INDEX IF NOT EXISTS idx_nonces_expires_at ON nonces(expires_at);

    -- Day-5 preview-quota. Either wallet OR session_token identifies the
    -- caller; entries older than 7 days are GC'd by the quota service on
    -- every check, so this table stays small. Privacy: NEVER joined with
    -- membership_cache or wallet_links in any API response.
    CREATE TABLE IF NOT EXISTS preview_quota (
      id            TEXT PRIMARY KEY,
      wallet        TEXT,
      session_token TEXT,
      community_id  TEXT NOT NULL,
      created_at    INTEGER NOT NULL,
      UNIQUE(wallet, session_token, community_id)
    );
    CREATE INDEX IF NOT EXISTS idx_preview_quota_created ON preview_quota(created_at);
    CREATE INDEX IF NOT EXISTS idx_preview_quota_wallet ON preview_quota(wallet);
    CREATE INDEX IF NOT EXISTS idx_preview_quota_session ON preview_quota(session_token);
  `);

  // Run additive migrations for columns added after initial release
  const pragmaInfo = db.prepare("PRAGMA table_info(communities)").all() as { name: string }[];
  if (!pragmaInfo.find(c => c.name === 'is_institution')) {
    db.exec("ALTER TABLE communities ADD COLUMN is_institution INTEGER NOT NULL DEFAULT 0");
  }

  const contentInfo = db.prepare("PRAGMA table_info(content)").all() as { name: string }[];
  if (!contentInfo.find(c => c.name === 'published')) {
    db.exec("ALTER TABLE content ADD COLUMN published INTEGER NOT NULL DEFAULT 1");
  }
  if (!contentInfo.find(c => c.name === 'updated_at')) {
    db.exec("ALTER TABLE content ADD COLUMN updated_at TEXT NOT NULL DEFAULT (datetime('now'))");
  }
  if (!contentInfo.find(c => c.name === 'protected_data_address')) {
    db.exec("ALTER TABLE content ADD COLUMN protected_data_address TEXT");
  }
  if (!contentInfo.find(c => c.name === 'protected_data_name')) {
    db.exec("ALTER TABLE content ADD COLUMN protected_data_name TEXT");
  }
  if (!contentInfo.find(c => c.name === 'protection_provider')) {
    db.exec("ALTER TABLE content ADD COLUMN protection_provider TEXT NOT NULL DEFAULT 'none'");
  }
  if (!contentInfo.find(c => c.name === 'iapp_address')) {
    db.exec("ALTER TABLE content ADD COLUMN iapp_address TEXT");
  }
  if (!contentInfo.find(c => c.name === 'protection_status')) {
    db.exec("ALTER TABLE content ADD COLUMN protection_status TEXT NOT NULL DEFAULT 'plain'");
  }
  // Day-5 — per-post preview marker. Creator toggles this per content row;
  // the public GET respects it for non-members.
  if (!contentInfo.find(c => c.name === 'preview_eligible')) {
    db.exec("ALTER TABLE content ADD COLUMN preview_eligible INTEGER NOT NULL DEFAULT 0");
  }
}
