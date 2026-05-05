import { v4 as uuid } from 'uuid';
import type { Database } from 'better-sqlite3';

/** Day-5 preview-quota tracker.
 *
 *  Caller identity is `(wallet OR session_token)`. The same identifier
 *  preview-checking the same community more than once does not consume a
 *  new slot. A 3rd distinct community within the rolling 7-day window
 *  trips the quota.
 *
 *  The quota table is intentionally NOT joined with membership_cache or
 *  wallet_links anywhere in the API. The only surface that touches it is
 *  this service plus its middleware.
 */

export const PREVIEW_QUOTA_LIMIT = 2;
export const PREVIEW_QUOTA_WINDOW_SECS = 7 * 24 * 60 * 60; // 7 days

export interface PreviewQuotaIdentity {
  wallet?: string | null;
  sessionToken?: string | null;
}

export class PreviewQuotaService {
  private insertStmt: import('better-sqlite3').Statement;
  private cleanupStmt: import('better-sqlite3').Statement;
  private countWalletStmt: import('better-sqlite3').Statement;
  private countSessionStmt: import('better-sqlite3').Statement;
  private existsWalletStmt: import('better-sqlite3').Statement;
  private existsSessionStmt: import('better-sqlite3').Statement;

  constructor(private db: Database) {
    this.insertStmt = db.prepare(
      'INSERT OR IGNORE INTO preview_quota (id, wallet, session_token, community_id, created_at) VALUES (?, ?, ?, ?, ?)',
    );
    this.cleanupStmt = db.prepare('DELETE FROM preview_quota WHERE created_at <= ?');
    this.countWalletStmt = db.prepare(
      'SELECT COUNT(DISTINCT community_id) AS n FROM preview_quota WHERE wallet = ? AND created_at > ?',
    );
    this.countSessionStmt = db.prepare(
      'SELECT COUNT(DISTINCT community_id) AS n FROM preview_quota WHERE session_token = ? AND created_at > ?',
    );
    this.existsWalletStmt = db.prepare(
      'SELECT 1 FROM preview_quota WHERE wallet = ? AND community_id = ? AND created_at > ? LIMIT 1',
    );
    this.existsSessionStmt = db.prepare(
      'SELECT 1 FROM preview_quota WHERE session_token = ? AND community_id = ? AND created_at > ? LIMIT 1',
    );
  }

  /** Returns true if `id` may proceed with a preview of `communityId`.
   *  Increments the slot atomically when allowed; idempotent for repeat
   *  visits to the same community. */
  consume(identity: PreviewQuotaIdentity, communityId: string): { allowed: boolean; reason?: 'no_identity' | 'preview_quota_exceeded' } {
    const wallet = identity.wallet?.toLowerCase().trim() || null;
    const sessionToken = identity.sessionToken?.trim() || null;
    if (!wallet && !sessionToken) {
      return { allowed: false, reason: 'no_identity' };
    }

    const nowSec = Math.floor(Date.now() / 1000);
    const cutoff = nowSec - PREVIEW_QUOTA_WINDOW_SECS;
    this.cleanupStmt.run(cutoff);

    // Repeat visit to the same community → always allowed.
    if (wallet && this.existsWalletStmt.get(wallet, communityId, cutoff)) {
      return { allowed: true };
    }
    if (sessionToken && this.existsSessionStmt.get(sessionToken, communityId, cutoff)) {
      return { allowed: true };
    }

    // Distinct-community count under the rolling window.
    const distinctCount =
      (wallet
        ? (this.countWalletStmt.get(wallet, cutoff) as { n: number }).n
        : 0) +
      (sessionToken && !wallet
        ? (this.countSessionStmt.get(sessionToken, cutoff) as { n: number }).n
        : 0);

    if (distinctCount >= PREVIEW_QUOTA_LIMIT) {
      return { allowed: false, reason: 'preview_quota_exceeded' };
    }

    // Reserve the slot.
    this.insertStmt.run(uuid(), wallet, sessionToken, communityId, nowSec);
    return { allowed: true };
  }

  /** Free quota slots for `communityId` belonging to this identity. Called
   *  when a wallet successfully subscribes — they no longer consume a
   *  preview slot for that community. */
  release(identity: PreviewQuotaIdentity, communityId: string): void {
    const wallet = identity.wallet?.toLowerCase().trim() || null;
    const sessionToken = identity.sessionToken?.trim() || null;
    if (wallet) {
      this.db
        .prepare('DELETE FROM preview_quota WHERE wallet = ? AND community_id = ?')
        .run(wallet, communityId);
    }
    if (sessionToken && !wallet) {
      this.db
        .prepare('DELETE FROM preview_quota WHERE session_token = ? AND community_id = ?')
        .run(sessionToken, communityId);
    }
  }
}
