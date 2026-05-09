# SORTS — Infrastructure (Day 7)

## Database

**Choice:** Supabase (free tier) with the pooled connection string.

| Criterion | Supabase free | Render Postgres ($7/mo) |
|---|---|---|
| Cost | $0 | $7/mo |
| Connection pooling | yes (transaction mode) | yes |
| TLS by default | yes | yes |
| Connection limit on free | 60 | n/a (paid) |
| Region selection | yes | yes |
| Setup time | ~3 min | ~3 min |

We chose Supabase free because:
1. The MVP demo footprint fits well within the free row + connection limits.
2. The pooled DSN handles Render's serverless-style backend reconnects without DIY pgbouncer.
3. If we need higher throughput later, switching to Render Postgres is a `DATABASE_URL` swap — the schema and adapter are vendor-neutral.

**Required env var name:** `DATABASE_URL` (do not paste the value into PR descriptions, commits, or chat — see Rollback below for the empty-string fallback).

## Code surface

| File | Role |
|---|---|
| [`backend/src/db/postgres.ts`](../backend/src/db/postgres.ts) | pg adapter exposing the same `prepare/all/get/run + exec + close` shape as better-sqlite3 so existing route code keeps compiling unchanged. |
| [`backend/src/db/schema.ts`](../backend/src/db/schema.ts) | `selectDriver()` returns `'postgres'` when `DATABASE_URL` is set, otherwise `'sqlite'`. `openDb()` dispatches accordingly. |
| [`backend/scripts/migrate-to-postgres.ts`](../backend/scripts/migrate-to-postgres.ts) | Idempotent schema migration. Every statement is `CREATE TABLE / INDEX IF NOT EXISTS`. No DROP, no ALTER COLUMN, no RENAME. |
| [`backend/scripts/seed-devnet-demo.ts`](../backend/scripts/seed-devnet-demo.ts) | Seeds 2 demo communities + 3 posts (1 preview-eligible per community). All `INSERT … ON CONFLICT DO NOTHING`. |
| [`backend/src/config/env.ts`](../backend/src/config/env.ts) | Adds `DATABASE_URL` field + production refinement: `NODE_ENV=production` requires `DATABASE_URL`. |

## Deployment plan (Render backend + Vercel frontend)

### Backend → Render

1. Render → New + Web Service → connect this repo.
2. Build Command:
   ```
   pnpm install --frozen-lockfile && pnpm --filter @sorts/backend build
   ```
3. Start Command:
   ```
   node backend/dist/index.js
   ```
4. Runtime: Node 20.
5. Environment variables (NEVER paste values; reference by name only):
   - `NODE_ENV=production`
   - `PORT=10000` (Render binds $PORT automatically; set to its default).
   - `FRONTEND_URL` — the Vercel deploy URL.
   - `DATABASE_URL` — Supabase pooled DSN.
   - `SOLANA_DEVNET_RPC_URL` — your Alchemy/QuickNode/Helius devnet endpoint.
   - `SOLANA_PROGRAM_ID=AEp6VuJqfctTRQpZP3LDjKcua4C1jGP8YT721AMSBkFV` (Day-1 deploy).
   - `PRIVY_APP_ID`, `PRIVY_APP_SECRET` — server-side Privy credentials.
   - `TELEGRAM_BOT_TOKEN` — bot token (optional; bot disabled when unset).
   - Feature flags default safe; set `ENABLE_IKA_REAL_FUNDS=true` only if you mean it.
6. After the first successful deploy, run the migration once from the Render shell:
   ```
   pnpm --filter @sorts/backend run migrate
   pnpm --filter @sorts/backend run seed:devnet-demo
   ```

### Frontend → Vercel

1. Vercel → New Project → import this repo.
2. Framework: Next.js (auto-detected).
3. Root Directory: `frontend`.
4. Build Command (override): `pnpm --filter @sorts/frontend build`.
5. Install Command (override): `pnpm install --frozen-lockfile`.
6. Environment variables (names only):
   - `NEXT_PUBLIC_API_URL` — Render backend URL.
   - `NEXT_PUBLIC_PRIVY_APP_ID`.
   - `NEXT_PUBLIC_SOLANA_DEVNET_RPC_URL`.
   - `NEXT_PUBLIC_SOLANA_PROGRAM_ID=AEp6VuJqfctTRQpZP3LDjKcua4C1jGP8YT721AMSBkFV`.
   - `NEXT_PUBLIC_DEMO_MODE=false` (set `true` only for Privy-less dry runs).
7. After the first deploy, smoke the public URL against the 14-step demo
   script in `Priority.md`.

## Rollback plan

If a Postgres migration breaks reads from existing routes:

1. **Render**: open the service → Environment → unset `DATABASE_URL` (or set to empty string).
2. Trigger a redeploy. The backend boots into SQLite + Render Persistent Disk ($1/mo addon) automatically — `selectDriver()` returns `'sqlite'` when `DATABASE_URL` is empty.
3. Local-dev rollback: `unset DATABASE_URL` + restart `pnpm --filter @sorts/backend dev`.

Confirmed locally: `selectDriver()` returns `'sqlite'` whenever `DATABASE_URL` is unset; the SQLite path runs the existing migrations on `runMigrations(db)` start without touching the new pg adapter.

## Privacy invariants preserved across the migration

| Invariant (Day 1–6) | Where enforced post-migration |
|---|---|
| No `members` table | `migrate-to-postgres.ts` does not create it |
| No tier-level history column | `content` table mirrors SQLite shape; no new history columns |
| `preview_quota` and `wallet_links` never joined in any API response | route layer (`/api/content`, `/api/analytics`) — unchanged |
| `nonces` table single-use within 5-min TTL | DDL preserves `(nonce, wallet)` PK + `expires_at BIGINT` |
| Aggregate-only creator analytics | `analytics_cache` shape unchanged |

## Smoke checklist (run after deploy)

```
curl https://<backend>.onrender.com/health
curl https://<backend>.onrender.com/api/communities
curl https://<backend>.onrender.com/api/wallet/capabilities
```

Then walk the 14 demo-script steps from `Priority.md` against the public URLs and record timestamps in this file as evidence:

| # | Step | Result | Timestamp |
|---|---|---|---|
| 1 | Visit landing | | |
| 2 | Sign in via Privy | | |
| 3 | Connect Solana wallet | | |
| 4 | Open `/studio/create` | | |
| 5 | Fill wizard | | |
| 6 | Devnet tx confirms | | |
| 7 | New community visible in list | | |
| 8 | Open `/join/<cid>` | | |
| 9 | Subscribe → tx confirms | | |
| 10 | `/app/<cid>/feed` shows unlocked posts | | |
| 11 | Studio analytics live aggregate | | |
| 12 | Mark a post preview-eligible | | |
| 13 | Non-member sees the preview only | | |
| 14 | Telegram `/status` returns active line | | |

## What is NOT done in this commit

- The actual Render service is **not provisioned** by this commit. The user must connect the repo and click deploy.
- The Vercel project is **not provisioned**.
- The migration script has been **typechecked** but not run against a live Postgres (no local Postgres on the build machine; documented in the Day-7 commit).
- `frontend/.env.example` already lists all `NEXT_PUBLIC_*` names; check that the Vercel project mirrors them.
