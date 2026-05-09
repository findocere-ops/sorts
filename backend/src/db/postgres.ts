/**
 * Day-7 Postgres adapter.
 *
 *  Backs the same operations the route layer runs against
 *  better-sqlite3 today: `prepare(...).all/get/run`. The shape mirrors a
 *  *subset* of the better-sqlite3 API our app actually uses — enough to
 *  keep call sites compiling unchanged when `selectDriver()` returns
 *  Postgres (production) instead of SQLite (local dev).
 *
 *  Privacy invariants: this adapter is a thin DAL only. It never joins
 *  `preview_quota` with `wallet_links` / `membership_cache` (Day-5
 *  invariant). It never persists tier numbers or seed material.
 */

import { Pool, type PoolClient, type QueryResult } from 'pg';

interface PgStatement {
  all: (...args: unknown[]) => unknown[];
  get: (...args: unknown[]) => unknown | undefined;
  run: (...args: unknown[]) => { changes: number };
}

interface PgDatabase {
  prepare: (sql: string) => PgStatement;
  exec: (sql: string) => void;
  pragma: (statement: string) => unknown;
  close: () => void;
}

let cachedPool: Pool | null = null;

function getPool(): Pool {
  if (cachedPool) return cachedPool;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL not set; cannot open Postgres connection');
  cachedPool = new Pool({
    connectionString: url,
    // Render and Supabase managed Postgres require TLS; Node defaults
    // refuse self-signed certs by default. The hosted certs are valid CA-
    // signed, so leave default validation on.
    ssl:
      url.includes('sslmode=disable') || url.includes('localhost')
        ? false
        : { rejectUnauthorized: true },
    max: 10,
  });
  return cachedPool;
}

/** Convert `?` placeholders to `$1, $2, …` for pg. better-sqlite3 uses
 *  `?` everywhere; rewriting at adapter time keeps every call site
 *  unchanged. */
function rewritePlaceholders(sql: string): string {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}

/** Synchronous façade that mirrors better-sqlite3 by using the
 *  `pg-pool`'s callback variant under a deasync-style poll. We only run
 *  this driver inside server boot + route handlers that are themselves
 *  sync today. To stay sync we issue queries through `pool.query` which
 *  resolves a Promise — wrap that in a small `runSync` helper using
 *  Node's `Atomics.wait` workaround. */
export function openPostgres(): PgDatabase {
  const pool = getPool();

  function querySync(sql: string, params: unknown[]): QueryResult {
    // This is a *blocking* convenience for parity with better-sqlite3.
    // We use it during startup migrations and inside route handlers that
    // do tiny lookups. Heavy or hot paths should be moved to the async
    // overload below in a follow-up.
    let resolved: QueryResult | null = null;
    let error: Error | null = null;
    let done = false;
    pool
      .query(sql, params)
      .then((r) => {
        resolved = r;
        done = true;
      })
      .catch((e: Error) => {
        error = e;
        done = true;
      });
    const sab = new SharedArrayBuffer(4);
    const view = new Int32Array(sab);
    while (!done) {
      Atomics.wait(view, 0, 0, 5);
    }
    if (error) throw error;
    if (!resolved) throw new Error('Postgres query returned no result');
    return resolved;
  }

  const db: PgDatabase = {
    prepare(sql: string) {
      const rewritten = rewritePlaceholders(sql);
      return {
        all(...args: unknown[]) {
          const result = querySync(rewritten, args);
          return result.rows;
        },
        get(...args: unknown[]) {
          const result = querySync(rewritten, args);
          return result.rows[0];
        },
        run(...args: unknown[]) {
          const result = querySync(rewritten, args);
          return { changes: result.rowCount ?? 0 };
        },
      };
    },
    exec(sql: string) {
      // Postgres rejects multi-statement strings under simple-query
      // protocol depending on the driver. Split on `;\n` boundaries and
      // run each independently — DDL only.
      const stmts = sql
        .split(/;\s*\n/)
        .map((s) => s.trim())
        .filter(Boolean);
      for (const stmt of stmts) {
        querySync(stmt, []);
      }
    },
    pragma(_statement: string) {
      // pragmas are a SQLite concept — no-op on Postgres.
      return undefined;
    },
    close() {
      pool.end().catch(() => undefined);
      cachedPool = null;
    },
  };
  return db;
}

/** Async variant for callers that prefer to await. Not used on the
 *  call sites today — kept here so the eventual migration off
 *  better-sqlite3 has a proper async path to move to. */
export async function withPostgresClient<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const pool = getPool();
  const client = await pool.connect();
  try {
    return await fn(client);
  } finally {
    client.release();
  }
}
