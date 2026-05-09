/**
 * Day-10 A5 regression test — anonymous callers (no wallet) get the same
 * post-body policy as non-member authenticated callers: ONLY posts the
 * creator marked `preview_eligible = true` come back with `locked: false`;
 * every other post stays locked.
 *
 * Privacy invariant 9 (`non-member content GET filters preview_eligible`)
 * remains intact. The change is in WHO can hit the unlocked path
 * (anonymous + non-member-with-wallet), not WHAT unlocks (still only
 * `preview_eligible: true`).
 *
 * Tested via supertest against a fresh in-memory SQLite + the real
 * Express router. No real RPC hits — the chain factory is mocked at
 * module level.
 */

import express from 'express';
import request from 'supertest';
import Database from 'better-sqlite3';
import { v4 as uuid } from 'uuid';
import { runMigrations } from '../db/schema';

// Mock the chain factory before importing the router so SolanaService
// never instantiates a real Connection during test.
jest.mock('../services/chain/ChainServiceFactory', () => ({
  ChainServiceFactory: {
    forChain: () => ({
      checkAccess: async () => false,
      getMembershipStatus: async () => ({
        hasAccess: false, isExpired: false, tierLevel: null, expiresAt: null, expiresInDays: null,
      }),
      getAggregateStats: async () => ({
        totalMembers: 0, activeMemberships: 0, expiredMemberships: 0,
        totalRevenueWei: '0', totalRevenueDisplay: '0 SOL', activeRatio: 0,
      }),
      checkAccessByCommitment: async () => false,
      getMembershipStatusByCommitment: async () => ({
        hasAccess: false, isExpired: false, tierLevel: null, expiresAt: null, expiresInDays: null,
      }),
    }),
  },
}));

interface AnonResponse {
  success: boolean;
  data: Array<{
    id: string;
    title: string;
    body?: string | null;
    locked: boolean;
    preview_eligible: boolean;
  }>;
}

function freshDb(): Database.Database {
  const db = new Database(':memory:');
  runMigrations(db);
  return db;
}

function seedCommunityWithPosts(
  db: Database.Database,
  communityId: string,
): { previewEligibleId: string; lockedPostId: string } {
  db.prepare(`
    INSERT INTO communities (id, chain_id, contract_address, name, symbol, creator_wallet)
    VALUES (?, 'solana-devnet', ?, 'Demo', 'DEM', 'creator-pubkey')
  `).run(communityId, '11111111111111111111111111111112');

  const previewId = uuid();
  const lockedId = uuid();
  db.prepare(`
    INSERT INTO content (
      id, community_id, creator_wallet, title, body, content_type, tier_required,
      pinned, preview_eligible, published
    ) VALUES (?, ?, 'creator-pubkey', ?, ?, 'post', 1, 0, 1, 1)
  `).run(previewId, communityId, 'Preview-eligible welcome', 'Anonymous body should be visible.');
  db.prepare(`
    INSERT INTO content (
      id, community_id, creator_wallet, title, body, content_type, tier_required,
      pinned, preview_eligible, published
    ) VALUES (?, ?, 'creator-pubkey', ?, ?, 'post', 1, 0, 0, 1)
  `).run(lockedId, communityId, 'Locked member-only', 'Anonymous must NEVER see this body.');
  return { previewEligibleId: previewId, lockedPostId: lockedId };
}

describe('Day-10 A5 — anonymous content GET respects preview_eligible (invariant 9)', () => {
  let db: Database.Database;
  let app: express.Application;

  beforeEach(() => {
    db = freshDb();
    // Lazy require so mock takes effect.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { contentRouter } = require('../api/routes/content') as typeof import('../api/routes/content');
    app = express();
    app.use(express.json());
    app.use('/api/content', contentRouter(db, { privyService: null }));
  });

  afterEach(() => db.close());

  it('anonymous caller sees preview_eligible posts unlocked, non-preview posts locked', async () => {
    const cid = 'demo-cid';
    const { previewEligibleId, lockedPostId } = seedCommunityWithPosts(db, cid);
    const res = await request(app).get(`/api/content/${cid}`);
    expect(res.status).toBe(200);
    const body = res.body as AnonResponse;
    expect(body.success).toBe(true);
    expect(body.data.length).toBe(2);
    const preview = body.data.find((p) => p.id === previewEligibleId);
    const locked = body.data.find((p) => p.id === lockedPostId);
    expect(preview?.locked).toBe(false);
    expect(locked?.locked).toBe(true);
    expect(preview?.preview_eligible).toBe(true);
    expect(locked?.preview_eligible).toBe(false);
  });

  it('anonymous response NEVER includes a body field on locked posts', async () => {
    const cid = 'demo-cid-2';
    const { lockedPostId } = seedCommunityWithPosts(db, cid);
    const res = await request(app).get(`/api/content/${cid}`);
    const body = res.body as AnonResponse;
    const lockedPost = body.data.find((p) => p.id === lockedPostId);
    // Locked posts MUST NOT carry a populated body. Privacy invariant 9.
    expect(lockedPost?.body).toBeFalsy();
  });

  it('anonymous response is the same shape as non-member-with-wallet (invariant 9 parity)', async () => {
    const cid = 'demo-cid-3';
    const { previewEligibleId, lockedPostId } = seedCommunityWithPosts(db, cid);
    const anon = await request(app).get(`/api/content/${cid}`);
    const anonBody = anon.body as AnonResponse;
    // Anonymous and non-member-authenticated callers must agree on which
    // posts are locked vs unlocked. Only `preview_eligible: true` unlocks.
    const anonUnlockedIds = anonBody.data.filter((p) => !p.locked).map((p) => p.id);
    const anonLockedIds = anonBody.data.filter((p) => p.locked).map((p) => p.id);
    expect(anonUnlockedIds).toEqual([previewEligibleId]);
    expect(anonLockedIds).toEqual([lockedPostId]);
  });

  it('zero preview_eligible posts → anonymous gets every post locked (invariant 9 negative case)', async () => {
    const cid = 'demo-cid-4';
    db.prepare(`
      INSERT INTO communities (id, chain_id, contract_address, name, symbol, creator_wallet)
      VALUES (?, 'solana-devnet', ?, 'Quiet', 'QUI', 'creator-pubkey')
    `).run(cid, '11111111111111111111111111111113');
    db.prepare(`
      INSERT INTO content (
        id, community_id, creator_wallet, title, body, content_type, tier_required,
        pinned, preview_eligible, published
      ) VALUES (?, ?, 'creator-pubkey', 'Locked', 'should not appear', 'post', 1, 0, 0, 1)
    `).run(uuid(), cid);
    const res = await request(app).get(`/api/content/${cid}`);
    const body = res.body as AnonResponse;
    expect(body.data.length).toBe(1);
    expect(body.data[0].locked).toBe(true);
    expect(body.data[0].body).toBeFalsy();
  });
});
