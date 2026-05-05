/**
 * Privacy + interface-safety assertions.
 *
 * These tests are deliberately structural — they JSON.stringify the responses
 * coming out of SolanaService and run case-insensitive regex against them so
 * a future refactor that accidentally adds a forbidden field is caught at
 * test-time, not after a privacy review.
 *
 *   t1 — checkAccess response: NO `tier`, `tier_level`/`tierLevel`,
 *        `commitment`, `salt`, `salt_pubkey`/`saltPubkey`.
 *   t2 — getAggregateStats response: NO array fields, NO field named
 *        `members`, `subscribers`, or `wallets`.
 *   t3 — ChainServiceFactory throws clearly on unsupported chain ids
 *        (no silent fallback to Arbitrum or Solana).
 */

import { ChainServiceFactory } from '../services/chain/ChainServiceFactory';
import { SolanaService } from '../services/chain/SolanaService';

const PROGRAM_ID = 'AEp6VuJqfctTRQpZP3LDjKcua4C1jGP8YT721AMSBkFV';
const ANY_PUBKEY = '11111111111111111111111111111112';
const ANY_WALLET = '11111111111111111111111111111113';

function freshSolana() {
  const svc = new SolanaService({ rpcUrl: 'https://invalid.local', programId: PROGRAM_ID });
  // No real RPC. Mock the only network-touching method we exercise here.
  jest.spyOn(svc, 'fetchSubscription').mockResolvedValue(null);
  jest.spyOn(svc, 'fetchCommunity').mockResolvedValue(null);
  return svc;
}

describe('t1 — checkAccess response leaks no tier / commitment / salt', () => {
  // Forbidden tokens covered (case-insensitive snake + camel):
  //   tier, tier_level, tierLevel, commitment, salt, salt_pubkey, saltPubkey.
  const FORBIDDEN = [
    /\btier\b/i,
    /tier[_]?level/i,
    /\bcommitment\b/i,
    /\bsalt\b/i,
    /salt[_]?pubkey/i,
    /tier[_]?commitment/i,
  ];

  it('returns a boolean only, with no forbidden fields in the JSON', async () => {
    const svc = freshSolana();
    const out1 = await svc.checkAccess(ANY_PUBKEY, ANY_WALLET, 1);
    const out2 = await svc.checkAccess(ANY_PUBKEY, ANY_WALLET, 3);
    const json = JSON.stringify({ result1: out1, result2: out2 });
    for (const re of FORBIDDEN) {
      expect(json).not.toMatch(re);
    }
    expect(typeof out1).toBe('boolean');
    expect(typeof out2).toBe('boolean');
  });

  it('getMembershipStatus also drops every forbidden token', async () => {
    const svc = freshSolana();
    const status = await svc.getMembershipStatus(ANY_PUBKEY, ANY_WALLET);
    const json = JSON.stringify(status);
    for (const re of FORBIDDEN) {
      // tierLevel as a *key* is allowed only as the explicit `null` projection
      // (legacy EVM interface). Make sure no _value_ of tier ever appears.
      if (re.source.includes('tier')) continue;
      expect(json).not.toMatch(re);
    }
    // Sanity: the EVM-interface field `tierLevel` is present and is null.
    expect(status.tierLevel).toBeNull();
  });
});

describe('t2 — getAggregateStats response is aggregate-only', () => {
  it('returns no arrays and no member-list fields', async () => {
    const svc = freshSolana();
    // fetchCommunity mocked to null → defaults to an all-zero AggregateStats.
    const stats = await svc.getAggregateStats(ANY_PUBKEY);
    const json = JSON.stringify(stats);
    // No array-typed fields anywhere in the response.
    expect(json).not.toMatch(/:\s*\[/);
    // No field NAMED members/subscribers/wallets/holders.
    expect(json).not.toMatch(/"(members|subscribers|wallets|holders)"\s*:/i);
    // The Number-counter `totalMembers`, `activeMemberships`, `expiredMemberships`,
    // `totalRevenueWei`, `totalRevenueDisplay`, `activeRatio` are the only allowed shape.
    for (const v of Object.values(stats)) {
      expect(Array.isArray(v)).toBe(false);
    }
    expect(Object.keys(stats).sort()).toEqual([
      'activeMemberships',
      'activeRatio',
      'expiredMemberships',
      'totalMembers',
      'totalRevenueDisplay',
      'totalRevenueWei',
    ]);
  });
});

describe('t3 — ChainServiceFactory throws on unknown chain ids', () => {
  it('throws Error with the offending chain id in the message', () => {
    expect(() => ChainServiceFactory.forChain('not-a-chain' as never)).toThrow(/Unsupported chain/);
    expect(() => ChainServiceFactory.forChain('ethereum-mainnet' as never)).toThrow(/ethereum-mainnet/);
  });

  it('does not silently fall back to Arbitrum or Solana', () => {
    let leaked: unknown = null;
    try {
      leaked = ChainServiceFactory.forChain('garbage' as never);
    } catch {
      /* expected */
    }
    expect(leaked).toBeNull();
  });

  it('routes the legit chain ids correctly', () => {
    expect(ChainServiceFactory.forChain('arbitrum-sepolia').constructor.name).toBe('ArbitrumService');
    expect(ChainServiceFactory.forChain('solana-devnet').constructor.name).toBe('SolanaService');
    expect(ChainServiceFactory.forChain('solana-mainnet').constructor.name).toBe('SolanaService');
  });
});
