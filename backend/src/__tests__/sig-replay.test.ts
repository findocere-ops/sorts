/**
 * Signature replay protection — sigNonce middleware tests.
 *
 * Uses an in-memory better-sqlite3 instance (`:memory:`). Asserts:
 *   - First (nonce, wallet) submission passes; second is rejected with 409.
 *   - Different wallets can use the same nonce string (key is composite).
 *   - Expired entries are GC'd lazily so the same nonce becomes reusable.
 *   - Missing nonce or wallet returns 400.
 */

import Database from 'better-sqlite3';
import type { NextFunction, Request, Response } from 'express';
import { sigNonce } from '../api/middleware/sig-nonce';

function fakeRes() {
  const res: Partial<Response> & { _status?: number; _body?: unknown } = {};
  res.status = jest.fn().mockImplementation((code: number) => {
    res._status = code;
    return res as Response;
  });
  res.json = jest.fn().mockImplementation((body: unknown) => {
    res._body = body;
    return res as Response;
  });
  return res as Response & { _status?: number; _body?: unknown };
}

function fakeReq(opts: { headers?: Record<string, string>; body?: Record<string, unknown> } = {}): Request {
  return { headers: opts.headers ?? {}, body: opts.body ?? {} } as unknown as Request;
}

function nextSpy(): jest.MockedFunction<NextFunction> {
  return jest.fn() as unknown as jest.MockedFunction<NextFunction>;
}

describe('sigNonce middleware', () => {
  let db: Database.Database;
  let mw: ReturnType<typeof sigNonce>;

  beforeEach(() => {
    db = new Database(':memory:');
    mw = sigNonce(db);
  });

  afterEach(() => db.close());

  it('accepts a fresh (nonce, wallet) and calls next()', () => {
    const next = nextSpy();
    const res = fakeRes();
    mw(
      fakeReq({ headers: { 'x-nonce': 'n1', 'x-signing-wallet': '0xAA' } }),
      res,
      next,
    );
    expect(next).toHaveBeenCalledTimes(1);
    expect(res._status).toBeUndefined();

    const row = db.prepare('SELECT * FROM nonces WHERE nonce = ? AND wallet = ?').get('n1', '0xaa');
    expect(row).toBeDefined();
  });

  it('rejects a replay of the same (nonce, wallet) with 409', () => {
    const next1 = nextSpy();
    mw(fakeReq({ headers: { 'x-nonce': 'n1', 'x-signing-wallet': '0xAA' } }), fakeRes(), next1);
    expect(next1).toHaveBeenCalled();

    const next2 = nextSpy();
    const res2 = fakeRes();
    mw(fakeReq({ headers: { 'x-nonce': 'n1', 'x-signing-wallet': '0xAA' } }), res2, next2);
    expect(next2).not.toHaveBeenCalled();
    expect(res2._status).toBe(409);
    expect((res2._body as { error: string }).error).toMatch(/already used/i);
  });

  it('treats wallet addresses case-insensitively', () => {
    mw(fakeReq({ headers: { 'x-nonce': 'n1', 'x-signing-wallet': '0xAA' } }), fakeRes(), nextSpy());
    const next2 = nextSpy();
    const res2 = fakeRes();
    mw(fakeReq({ headers: { 'x-nonce': 'n1', 'x-signing-wallet': '0xaa' } }), res2, next2);
    expect(res2._status).toBe(409);
    expect(next2).not.toHaveBeenCalled();
  });

  it('allows the same nonce for distinct wallets', () => {
    const r1 = nextSpy();
    mw(fakeReq({ headers: { 'x-nonce': 'shared', 'x-signing-wallet': '0xAA' } }), fakeRes(), r1);
    const r2 = nextSpy();
    mw(fakeReq({ headers: { 'x-nonce': 'shared', 'x-signing-wallet': '0xBB' } }), fakeRes(), r2);
    expect(r1).toHaveBeenCalled();
    expect(r2).toHaveBeenCalled();
  });

  it('lazy-GCs expired rows and lets the same nonce be reused after TTL', () => {
    mw(fakeReq({ headers: { 'x-nonce': 'n1', 'x-signing-wallet': '0xAA' } }), fakeRes(), nextSpy());
    // Forcibly expire the row.
    db.prepare('UPDATE nonces SET expires_at = 0 WHERE nonce = ? AND wallet = ?').run('n1', '0xaa');
    const next2 = nextSpy();
    const res2 = fakeRes();
    mw(fakeReq({ headers: { 'x-nonce': 'n1', 'x-signing-wallet': '0xAA' } }), res2, next2);
    expect(next2).toHaveBeenCalled();
    expect(res2._status).toBeUndefined();
  });

  it('rejects requests missing the nonce with 400', () => {
    const next = nextSpy();
    const res = fakeRes();
    mw(fakeReq({ headers: { 'x-signing-wallet': '0xAA' } }), res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res._status).toBe(400);
  });

  it('rejects requests missing the signing wallet with 400', () => {
    const next = nextSpy();
    const res = fakeRes();
    mw(fakeReq({ headers: { 'x-nonce': 'n1' } }), res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res._status).toBe(400);
  });

  it('accepts the nonce/wallet from the JSON body when headers are absent', () => {
    const next = nextSpy();
    const res = fakeRes();
    mw(fakeReq({ body: { nonce: 'b-nonce', wallet: '0xCC' } }), res, next);
    expect(next).toHaveBeenCalled();
    const row = db.prepare('SELECT * FROM nonces WHERE nonce = ? AND wallet = ?').get('b-nonce', '0xcc');
    expect(row).toBeDefined();
  });
});
