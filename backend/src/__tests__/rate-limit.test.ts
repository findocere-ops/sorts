/**
 * t6 — Global rate limit: 60 req/min/IP. The 61st request from the same IP
 *      within the 60s window must return 429.
 *
 * Mounts the real `apiRateLimit` middleware on a throwaway Express app and
 * hammers it with supertest. No DB, no Privy, no Solana RPC.
 */

import express from 'express';
import request from 'supertest';
import { createApiRateLimit } from '../api/middleware/rate-limit';

function makeApp(): express.Application {
  const app = express();
  // Fresh middleware per app — guarantees no shared per-IP counter across tests.
  app.use(createApiRateLimit());
  app.get('/ping', (_req, res) => res.json({ ok: true }));
  return app;
}

describe('apiRateLimit middleware', () => {
  it('allows the first 60 requests from one IP and 429s the 61st (t6)', async () => {
    const app = makeApp();

    let allowed = 0;
    let limited = 0;
    let firstLimitedStatus: number | null = null;

    for (let i = 0; i < 61; i++) {
      const res = await request(app).get('/ping');
      if (res.status === 200) allowed++;
      else if (res.status === 429) {
        limited++;
        if (firstLimitedStatus === null) firstLimitedStatus = i; // 0-indexed: 60 == 61st request
      }
    }

    expect(allowed).toBe(60);
    expect(limited).toBe(1);
    expect(firstLimitedStatus).toBe(60); // the 61st request (index 60) is the first to be limited
  });

  it('skips OPTIONS preflight from the count', async () => {
    const app = makeApp();

    // Send 70 OPTIONS — not counted by the limiter — then 1 GET should still pass.
    for (let i = 0; i < 70; i++) {
      const res = await request(app).options('/ping');
      // OPTIONS without an explicit handler returns 404 in this minimal app —
      // the point is the limiter does NOT count or 429 it.
      expect(res.status).not.toBe(429);
    }
    const res = await request(app).get('/ping');
    expect(res.status).toBe(200);
  });
});
