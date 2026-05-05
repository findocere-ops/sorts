/**
 * t5 — ChainServiceFactory throws on unsupported chain ids.
 *
 *  This file exists to satisfy the Day-6 minimum-test-set numbering. The
 *  identical assertion is also exercised in `privacy-assertions.test.ts`
 *  (Day-2 follow-up t3); both stay green.
 */

import { ChainServiceFactory } from '../services/chain/ChainServiceFactory';

describe('ChainServiceFactory (t5)', () => {
  it('throws on unknown chain ids — never silently falls back', () => {
    expect(() => ChainServiceFactory.forChain('not-a-chain' as never)).toThrow(/Unsupported chain/);
    expect(() => ChainServiceFactory.forChain('ethereum-mainnet' as never)).toThrow(/ethereum-mainnet/);
  });

  it('routes the legit chain ids', () => {
    expect(ChainServiceFactory.forChain('arbitrum-sepolia').constructor.name).toBe('ArbitrumService');
    expect(ChainServiceFactory.forChain('solana-devnet').constructor.name).toBe('SolanaService');
    expect(ChainServiceFactory.forChain('solana-mainnet').constructor.name).toBe('SolanaService');
  });
});
