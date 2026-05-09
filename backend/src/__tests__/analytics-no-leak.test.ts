/**
 * Day-5 analytics privacy assertions (t3 + t5).
 *
 *   t3 — GET /api/analytics/community/:cid response carries NO array fields
 *        and NO wallet-shaped strings (0x… EVM, base58 Solana).
 *   t5 — Telegram /status reply does not include the word "tier" or any
 *        tier number. We exercise the handler against an in-memory DB
 *        seeded with one community + a linked wallet, capture every
 *        ctx.reply payload, and assert the privacy invariants.
 */

import Database from 'better-sqlite3';
import { runMigrations } from '../db/schema';
import { AnalyticsService } from '../services/analytics';
import { SolanaService } from '../services/chain/SolanaService';

const EVM_WALLET_RE = /\b0x[a-fA-F0-9]{40}\b/;
const BASE58_WALLET_RE = /\b[1-9A-HJ-NP-Za-km-z]{32,44}\b/;

describe('Day-5 analytics — no per-member leak (t3)', () => {
  let db: Database.Database;
  let svc: AnalyticsService;
  let chain: SolanaService;

  beforeEach(() => {
    db = freshDb();
    chain = new SolanaService({ rpcUrl: 'https://invalid.local', programId: 'AEp6VuJqfctTRQpZP3LDjKcua4C1jGP8YT721AMSBkFV' });
    jest.spyOn(chain, 'getAggregateStats').mockResolvedValue({
      totalMembers: 7,
      activeMemberships: 5,
      expiredMemberships: 2,
      totalRevenueWei: '7000000000',
      totalRevenueDisplay: '7.0000 SOL',
      activeRatio: 5 / 7,
    });
    svc = new AnalyticsService(db, chain);
  });

  afterEach(() => db.close());

  it('community stats response shape has no array fields', async () => {
    seedSolanaCommunity(db, 'cid-1', '11111111111111111111111111111112');
    const stats = await svc.getCommunityStats('cid-1', '11111111111111111111111111111112');
    const json = JSON.stringify(stats);
    // No JSON array literal anywhere in the response.
    expect(json).not.toMatch(/:\s*\[/);
    // No EVM wallet shape.
    expect(json).not.toMatch(EVM_WALLET_RE);
    // The community PDA itself is base58 — strip it out before the wallet
    // shape check, since the route handler echoes communityId by construction.
    const scrubbed = json.replace(/"communityId"\s*:\s*"[^"]*"/g, '');
    expect(scrubbed).not.toMatch(BASE58_WALLET_RE);
    // Allowed shape only.
    expect(Object.keys(stats).sort()).toEqual([
      'activeMembers',
      'activeRatio',
      'cachedAt',
      'communityId',
      'contentCount',
      'expiredMemberships',
      'totalMembers',
      'totalRevenueDisplay',
      'totalRevenueWei',
    ]);
  });
});

describe('Day-5 telegram /status — no tier, no member count (t5)', () => {
  let db: Database.Database;

  beforeEach(() => {
    db = freshDb();
  });

  afterEach(() => db.close());

  it('reply text never includes the word "tier" or a tier number', async () => {
    seedSolanaCommunity(db, 'cid-1', '11111111111111111111111111111112');
    db.prepare('INSERT INTO wallet_links (id, telegram_user_id, wallet_address) VALUES (?, ?, ?)')
      .run('id-1', '999', '11111111111111111111111111111113');

    // Mock the chain factory to a fake getMembershipStatus.
    jest.resetModules();
    jest.doMock('../services/chain/ChainServiceFactory', () => ({
      ChainServiceFactory: {
        forChain: () => ({
          getMembershipStatus: async () => ({
            hasAccess: true,
            isExpired: false,
            tierLevel: null, // privacy invariant on Solana
            expiresAt: new Date('2026-12-31').toISOString(),
            expiresInDays: 200,
          }),
        }),
      },
    }));
    const { statusHandler } = await import('../bot/commands/status');
    const replies: string[] = [];
    const ctx = {
      from: { id: 999 },
      reply: async (text: string) => { replies.push(text); },
    } as unknown as import('grammy').Context;
    const handler = statusHandler(db);
    await handler(ctx);

    expect(replies.length).toBeGreaterThan(0);
    for (const r of replies) {
      expect(r.toLowerCase()).not.toContain('tier');
      // Numbers 1/2/3 may appear inside dates/wallet prefixes; check that
      // none stand alone as tier-shape: " 1 ", " 2 ", " 3 " near the word
      // "membership" or "level".
      expect(r).not.toMatch(/level\s*[123]/i);
      expect(r).not.toMatch(/member count/i);
    }
  });
});

function freshDb(): Database.Database {
  const db = new Database(':memory:');
  runMigrations(db);
  return db;
}

function seedSolanaCommunity(db: Database.Database, id: string, contractAddress: string) {
  db.prepare(`
    INSERT INTO communities (id, chain_id, contract_address, name, symbol, creator_wallet)
    VALUES (?, 'solana-devnet', ?, 'Test community', 'TST', 'creator-pubkey')
  `).run(id, contractAddress);
}
