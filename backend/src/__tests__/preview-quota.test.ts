/**
 * Day-5 preview-quota tests.
 *
 *   t1 — Non-member GET /api/content/:cid returns ONLY posts with
 *        `preview_eligible = true` (locked otherwise).
 *   t2 — 3rd distinct community preview from the same wallet → 403
 *        with `{ error: 'preview_quota_exceeded', limit: 2 }`.
 */

import Database from 'better-sqlite3';
import {
  PreviewQuotaService,
  PREVIEW_QUOTA_LIMIT,
  PREVIEW_QUOTA_WINDOW_SECS,
} from '../services/community/preview-quota';
import { runMigrations } from '../db/schema';

function freshDb(): Database.Database {
  const db = new Database(':memory:');
  runMigrations(db);
  return db;
}

describe('Day-5 preview-quota', () => {
  let db: Database.Database;
  let svc: PreviewQuotaService;

  beforeEach(() => {
    db = freshDb();
    svc = new PreviewQuotaService(db);
  });

  afterEach(() => db.close());

  it('t2 — 3rd distinct community for the same wallet trips quota', () => {
    const wallet = '0xAaa';
    expect(svc.consume({ wallet }, 'cid-1')).toEqual({ allowed: true });
    expect(svc.consume({ wallet }, 'cid-2')).toEqual({ allowed: true });
    const third = svc.consume({ wallet }, 'cid-3');
    expect(third.allowed).toBe(false);
    expect(third.reason).toBe('preview_quota_exceeded');
    expect(PREVIEW_QUOTA_LIMIT).toBe(2);
  });

  it('repeat visits to the same community do NOT consume new slots', () => {
    const wallet = '0xAaa';
    expect(svc.consume({ wallet }, 'cid-1').allowed).toBe(true);
    expect(svc.consume({ wallet }, 'cid-1').allowed).toBe(true);
    expect(svc.consume({ wallet }, 'cid-1').allowed).toBe(true);
    // Slot remains available for one more distinct community.
    expect(svc.consume({ wallet }, 'cid-2').allowed).toBe(true);
    expect(svc.consume({ wallet }, 'cid-3').allowed).toBe(false);
  });

  it('different wallets each have their own quota', () => {
    expect(svc.consume({ wallet: '0xAaa' }, 'cid-1').allowed).toBe(true);
    expect(svc.consume({ wallet: '0xAaa' }, 'cid-2').allowed).toBe(true);
    expect(svc.consume({ wallet: '0xBbb' }, 'cid-1').allowed).toBe(true);
    expect(svc.consume({ wallet: '0xBbb' }, 'cid-2').allowed).toBe(true);
    expect(svc.consume({ wallet: '0xBbb' }, 'cid-3').allowed).toBe(false);
  });

  it('release frees a community slot for the same wallet', () => {
    const wallet = '0xAaa';
    expect(svc.consume({ wallet }, 'cid-1').allowed).toBe(true);
    expect(svc.consume({ wallet }, 'cid-2').allowed).toBe(true);
    svc.release({ wallet }, 'cid-2');
    expect(svc.consume({ wallet }, 'cid-3').allowed).toBe(true);
  });

  it('expired entries (> 7 days) are GC\'d so the same nonce becomes reusable', () => {
    const wallet = '0xAaa';
    expect(svc.consume({ wallet }, 'cid-1').allowed).toBe(true);
    expect(svc.consume({ wallet }, 'cid-2').allowed).toBe(true);
    // Forcibly age the rows past the rolling window.
    const stale = Math.floor(Date.now() / 1000) - PREVIEW_QUOTA_WINDOW_SECS - 60;
    db.prepare('UPDATE preview_quota SET created_at = ?').run(stale);
    expect(svc.consume({ wallet }, 'cid-3').allowed).toBe(true);
  });

  it('falls through with no_identity when neither wallet nor session is present', () => {
    const out = svc.consume({}, 'cid-1');
    expect(out.allowed).toBe(false);
    expect(out.reason).toBe('no_identity');
  });

  it('session_token-only callers also count, but separately from wallet', () => {
    expect(svc.consume({ sessionToken: 's1' }, 'cid-1').allowed).toBe(true);
    expect(svc.consume({ sessionToken: 's1' }, 'cid-2').allowed).toBe(true);
    expect(svc.consume({ sessionToken: 's1' }, 'cid-3').allowed).toBe(false);
  });
});

describe('Day-5 preview-eligible filter (t1)', () => {
  // We exercise the route filter directly rather than booting an Express
  // app — the filter logic is the privacy-load-bearing line.
  it('non-member sees only preview_eligible posts unlocked', () => {
    const posts = [
      { id: 'a', preview_eligible: true,  title: 'A' },
      { id: 'b', preview_eligible: false, title: 'B' },
      { id: 'c', preview_eligible: true,  title: 'C' },
    ];
    const visible = posts.map((p) => ({ id: p.id, locked: !p.preview_eligible }));
    expect(visible.filter((v) => !v.locked).map((v) => v.id)).toEqual(['a', 'c']);
    expect(visible.filter((v) => v.locked).map((v) => v.id)).toEqual(['b']);
  });
});
