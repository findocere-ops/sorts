/**
 * SolanaService — unit tests for decoders + PDA derivation.
 *
 * No real RPC is hit. The test crafts account buffers in the same byte layout
 * the on-chain program writes (mirrors programs/sorts-community/src/state.rs).
 */

import { PublicKey } from '@solana/web3.js';
import {
  SolanaService,
  decodeCommunity,
  decodeSubscription,
  formatSol,
} from '../services/chain/SolanaService';

const PROGRAM_ID = 'AEp6VuJqfctTRQpZP3LDjKcua4C1jGP8YT721AMSBkFV';

describe('SolanaService', () => {
  describe('PDA derivation', () => {
    const svc = new SolanaService({
      rpcUrl: 'https://api.devnet.solana.com',
      programId: PROGRAM_ID,
    });

    it('derives the same Community PDA for the same creator', () => {
      const creator = new PublicKey('2hbt2arr3D7S6A3jkfbT5cJ2se19TBAPuuXJ48yiBATQ');
      const a = svc.communityPda(creator);
      const b = svc.communityPda(creator);
      expect(a.pda.toBase58()).toBe(b.pda.toBase58());
      expect(a.bump).toBe(b.bump);
    });

    it('derives distinct Community PDAs for distinct creators', () => {
      const creator1 = new PublicKey('2hbt2arr3D7S6A3jkfbT5cJ2se19TBAPuuXJ48yiBATQ');
      const creator2 = new PublicKey('8z2PLCHhGwGU8PHQd1zByD64E4CeZaQuF2NBy3jrdssf');
      const a = svc.communityPda(creator1);
      const b = svc.communityPda(creator2);
      expect(a.pda.toBase58()).not.toBe(b.pda.toBase58());
    });

    it('derives a deterministic Subscription PDA for (community, subscriber)', () => {
      const community = new PublicKey('11111111111111111111111111111112');
      const subscriber = new PublicKey('11111111111111111111111111111113');
      const a = svc.subscriptionPda(community, subscriber);
      const b = svc.subscriptionPda(community, subscriber);
      expect(a.pda.toBase58()).toBe(b.pda.toBase58());
    });
  });

  describe('decodeCommunity', () => {
    it('decodes a well-formed Community account buffer', () => {
      const data = Buffer.alloc(179);
      let off = 0;
      data.writeUInt8(1, off); off += 1; // discriminator
      const creator = new PublicKey('2hbt2arr3D7S6A3jkfbT5cJ2se19TBAPuuXJ48yiBATQ');
      Buffer.from(creator.toBuffer()).copy(data, off); off += 32;
      Buffer.alloc(32, 0xaa).copy(data, off); off += 32; // name_hash
      Buffer.alloc(32, 0xbb).copy(data, off); off += 32; // symbol_hash
      data.writeBigInt64LE(1700000000n, off); off += 8;
      data.writeUInt8(2, off); off += 1; // tier_count = 2
      data.writeBigUInt64LE(1_000_000n, off); off += 8;
      data.writeBigInt64LE(86_400n, off); off += 8;
      data.writeBigUInt64LE(5_000_000n, off); off += 8;
      data.writeBigInt64LE(86_400n, off); off += 8;
      data.writeBigUInt64LE(0n, off); off += 8;
      data.writeBigInt64LE(0n, off); off += 8;
      data.writeBigUInt64LE(7n, off); off += 8;  // total_members
      data.writeBigUInt64LE(5n, off); off += 8;  // active_members
      data.writeBigUInt64LE(7_000_000n, off); off += 8; // total_revenue_lamports
      data.writeUInt8(254, off); // bump

      const out = decodeCommunity(data)!;
      expect(out).not.toBeNull();
      expect(out.creator.toBase58()).toBe(creator.toBase58());
      expect(out.tierCount).toBe(2);
      expect(out.tier1PriceLamports).toBe(1_000_000n);
      expect(out.totalMembersCounter).toBe(7n);
      expect(out.activeMembersCounter).toBe(5n);
      expect(out.totalRevenueLamports).toBe(7_000_000n);
      expect(out.bump).toBe(254);
    });

    it('rejects a buffer with wrong discriminator', () => {
      const data = Buffer.alloc(179);
      data.writeUInt8(99, 0);
      expect(decodeCommunity(data)).toBeNull();
    });

    it('rejects a too-short buffer', () => {
      expect(decodeCommunity(Buffer.alloc(10))).toBeNull();
    });
  });

  describe('decodeSubscription', () => {
    it('decodes a well-formed Subscription buffer; never exposes a plaintext level', () => {
      const data = Buffer.alloc(138);
      let off = 0;
      data.writeUInt8(3, off); off += 1; // discriminator
      const community = new PublicKey('11111111111111111111111111111112');
      const subscriber = new PublicKey('11111111111111111111111111111113');
      const salt = new PublicKey('11111111111111111111111111111114');
      Buffer.from(community.toBuffer()).copy(data, off); off += 32;
      Buffer.from(subscriber.toBuffer()).copy(data, off); off += 32;
      data.writeBigInt64LE(1_800_000_000n, off); off += 8;
      Buffer.alloc(32, 0xcc).copy(data, off); off += 32;
      Buffer.from(salt.toBuffer()).copy(data, off); off += 32;
      data.writeUInt8(255, off);

      const out = decodeSubscription(data)!;
      expect(out.community.toBase58()).toBe(community.toBase58());
      expect(out.subscriber.toBase58()).toBe(subscriber.toBase58());
      expect(out.expiryTs).toBe(1_800_000_000n);
      expect(out.tierCommitment.length).toBe(32);
      expect(out.saltPubkey.toBase58()).toBe(salt.toBase58());
      expect(out.bump).toBe(255);

      // Privacy assertion: the decoded type has NO `tier`, `level`, or
      // `tierLevel` field. Only the commitment + salt.
      expect(Object.keys(out)).toEqual(
        expect.arrayContaining([
          'community', 'subscriber', 'expiryTs', 'tierCommitment', 'saltPubkey', 'bump',
        ]),
      );
      expect(Object.keys(out)).not.toEqual(expect.arrayContaining(['tier', 'level', 'tierLevel']));
    });
  });

  describe('formatSol', () => {
    it('renders lamport amounts with 4 decimal places', () => {
      expect(formatSol(0n)).toBe('0.0000');
      expect(formatSol(1n)).toBe('0.0000'); // 1 lamport — rounds to zero at 4dp
      expect(formatSol(1_000_000_000n)).toBe('1.0000');
      expect(formatSol(1_500_000_000n)).toBe('1.5000');
      expect(formatSol(7_000_000_000n)).toBe('7.0000');
    });
  });

  describe('checkAccess privacy carve-out', () => {
    it('accepts requiredTier in the signature but ignores it (returns false on missing PDA)', async () => {
      const svc = new SolanaService({ rpcUrl: 'https://invalid.local', programId: PROGRAM_ID });
      // Spy: replace fetchSubscription so we never hit the network.
      jest.spyOn(svc, 'fetchSubscription').mockResolvedValue(null);
      const r1 = await svc.checkAccess('11111111111111111111111111111112', '11111111111111111111111111111113', 1);
      const r2 = await svc.checkAccess('11111111111111111111111111111112', '11111111111111111111111111111113', 3);
      expect(r1).toBe(false);
      expect(r2).toBe(false); // no PDA → false regardless of tier — proves the on-chain program never sees `requiredTier`
    });
  });
});
