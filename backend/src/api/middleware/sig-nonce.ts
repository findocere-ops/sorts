import type { NextFunction, Request, Response } from 'express';
import type { Database } from 'better-sqlite3';

const NONCE_TTL_SECS = 5 * 60; // 5 minutes
const MAX_NONCE_LEN = 256;

/** Signature replay protection.
 *
 *  Apply on routes that accept a wallet signature. The client passes the
 *  nonce it signed via `X-Nonce` header (or `nonce` field on the JSON body)
 *  along with the wallet address it signed under (`X-Signing-Wallet` or
 *  `wallet` body field).
 *
 *  Behavior:
 *    - First time we see `(nonce, wallet)`: insert into `nonces` with
 *      `expires_at = now + 5 min`, then `next()`.
 *    - Replay (same `(nonce, wallet)` already present and not expired):
 *      respond 401 Unauthorized — the signature has been redeemed.
 *    - Missing nonce/wallet on a route that uses this middleware: 400.
 *    - Expired rows are garbage-collected lazily on every call.
 */
export function sigNonce(db: Database) {
  // Lazily ensure the table exists. Idempotent — also created in db/schema.ts.
  db.exec(`
    CREATE TABLE IF NOT EXISTS nonces (
      nonce       TEXT NOT NULL,
      wallet      TEXT NOT NULL,
      expires_at  INTEGER NOT NULL,
      PRIMARY KEY (nonce, wallet)
    );
    CREATE INDEX IF NOT EXISTS idx_nonces_expires_at ON nonces(expires_at);
  `);

  const insertStmt = db.prepare(
    'INSERT INTO nonces (nonce, wallet, expires_at) VALUES (?, ?, ?)',
  );
  const cleanupStmt = db.prepare('DELETE FROM nonces WHERE expires_at <= ?');

  return function sigNonceMiddleware(req: Request, res: Response, next: NextFunction): void {
    const headerNonce = pickHeader(req, 'x-nonce');
    const bodyNonce = (req.body as Record<string, unknown> | undefined)?.nonce;
    const nonce = (headerNonce ?? (typeof bodyNonce === 'string' ? bodyNonce : null))?.trim();

    const headerWallet = pickHeader(req, 'x-signing-wallet');
    const bodyWallet = (req.body as Record<string, unknown> | undefined)?.wallet;
    const wallet = (headerWallet ?? (typeof bodyWallet === 'string' ? bodyWallet : null))?.toLowerCase();

    if (!nonce || nonce.length === 0 || nonce.length > MAX_NONCE_LEN) {
      res.status(400).json({ success: false, error: 'Missing or invalid nonce' });
      return;
    }
    if (!wallet || wallet.length === 0) {
      res.status(400).json({ success: false, error: 'Missing signing wallet' });
      return;
    }

    const nowSec = Math.floor(Date.now() / 1000);
    cleanupStmt.run(nowSec);

    try {
      insertStmt.run(nonce, wallet, nowSec + NONCE_TTL_SECS);
    } catch (err) {
      // SQLITE_CONSTRAINT_PRIMARYKEY → replay. Treated as an authentication
      // failure (the signature was already redeemed once and is no longer
      // valid for a new request), not a body conflict.
      const e = err as { code?: string; message?: string };
      if (e.code === 'SQLITE_CONSTRAINT_PRIMARYKEY' || (e.message ?? '').includes('UNIQUE')) {
        res.status(401).json({ success: false, error: 'Nonce already used' });
        return;
      }
      throw err;
    }

    next();
  };
}

function pickHeader(req: Request, name: string): string | null {
  const raw = req.headers[name];
  if (typeof raw === 'string' && raw.length > 0) return raw;
  if (Array.isArray(raw) && raw[0]) return raw[0];
  return null;
}
