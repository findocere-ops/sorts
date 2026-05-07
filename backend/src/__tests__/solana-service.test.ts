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

    it('derives a deterministic Subscription PDA for (community, commitment)', () => {
      const community = new PublicKey('11111111111111111111111111111112');
      const commitment = new Uint8Array(32).fill(0xab);
      const a = svc.subscriptionPda(community, commitment);
      const b = svc.subscriptionPda(community, commitment);
      expect(a.pda.toBase58()).toBe(b.pda.toBase58());
    });

    it('rejects a non-32-byte commitment', () => {
      const community = new PublicKey('11111111111111111111111111111112');
      expect(() => svc.subscriptionPda(community, new Uint8Array(31))).toThrow(
        /must be exactly 32 bytes/,
      );
      expect(() => svc.subscriptionPda(community, new Uint8Array(33))).toThrow(
        /must be exactly 32 bytes/,
      );
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
    it('decodes a well-formed v3 Subscription buffer; exposes commitment + cloak sigs slot, never plaintext subscriber or level', () => {
      const data = Buffer.alloc(202);
      let off = 0;
      data.writeUInt8(3, off); off += 1; // discriminator
      const community = new PublicKey('11111111111111111111111111111112');
      // v2: byte 33-65 holds subscriber_commitment, NOT subscriber pubkey.
      const subscriberCommitment = Buffer.alloc(32, 0xa5);
      const salt = new PublicKey('11111111111111111111111111111114');
      // v3: bytes 137-201 hold cloak_payment_sigs. Use a non-zero pattern so
      // the test catches a layout drift if the slot is read at the wrong offset.
      const cloakSigs = Buffer.alloc(64, 0xee);
      Buffer.from(community.toBuffer()).copy(data, off); off += 32;
      subscriberCommitment.copy(data, off); off += 32;
      data.writeBigInt64LE(1_800_000_000n, off); off += 8;
      Buffer.alloc(32, 0xcc).copy(data, off); off += 32; // tier_commitment
      Buffer.from(salt.toBuffer()).copy(data, off); off += 32;
      cloakSigs.copy(data, off); off += 64;
      data.writeUInt8(255, off);

      const out = decodeSubscription(data)!;
      expect(out.community.toBase58()).toBe(community.toBase58());
      expect(Array.from(out.subscriberCommitment)).toEqual(Array.from(subscriberCommitment));
      expect(out.expiryTs).toBe(1_800_000_000n);
      expect(out.tierCommitment.length).toBe(32);
      expect(out.saltPubkey.toBase58()).toBe(salt.toBase58());
      expect(out.cloakPaymentSigs.length).toBe(64);
      expect(Array.from(out.cloakPaymentSigs)).toEqual(Array.from(cloakSigs));
      expect(out.bump).toBe(255);

      // Privacy assertion: the decoded type has NO `tier`, `level`, `tierLevel`,
      // or plaintext `subscriber` field. Only `subscriberCommitment` (Tier 1.2)
      // plus the tier commitment, salt, and Tier 1.3 Cloak sigs slot.
      expect(Object.keys(out)).toEqual(
        expect.arrayContaining([
          'community', 'subscriberCommitment', 'expiryTs',
          'tierCommitment', 'saltPubkey', 'cloakPaymentSigs', 'bump',
        ]),
      );
      expect(Object.keys(out)).not.toEqual(
        expect.arrayContaining(['tier', 'level', 'tierLevel', 'subscriber']),
      );
    });

    it('decodes the all-zero (devnet, transparent) Cloak sigs slot without errors', () => {
      const data = Buffer.alloc(202);
      let off = 0;
      data.writeUInt8(3, off); off += 1;
      const community = new PublicKey('11111111111111111111111111111112');
      const subscriberCommitment = Buffer.alloc(32, 0x77);
      const salt = new PublicKey('11111111111111111111111111111114');
      Buffer.from(community.toBuffer()).copy(data, off); off += 32;
      subscriberCommitment.copy(data, off); off += 32;
      data.writeBigInt64LE(1_800_000_000n, off); off += 8;
      Buffer.alloc(32, 0).copy(data, off); off += 32;
      Buffer.from(salt.toBuffer()).copy(data, off); off += 32;
      // cloak_payment_sigs intentionally left as zeros (devnet default)
      off += 64;
      data.writeUInt8(254, off);

      const out = decodeSubscription(data)!;
      expect(out.cloakPaymentSigs.length).toBe(64);
      expect(out.cloakPaymentSigs.every((b) => b === 0)).toBe(true);
    });

    it('rejects pre-v3 buffers (138 bytes) — layout drift guard', () => {
      const old = Buffer.alloc(138);
      old.writeUInt8(3, 0);
      expect(decodeSubscription(old)).toBeNull();
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

  describe('checkAccess privacy carve-out (v2 — commitment-based)', () => {
    it('rejects wallet-based checkAccess on Solana with a clear redirect message', async () => {
      const svc = new SolanaService({ rpcUrl: 'https://invalid.local', programId: PROGRAM_ID });
      await expect(
        svc.checkAccess('11111111111111111111111111111112', '11111111111111111111111111111113', 1),
      ).rejects.toThrow(/checkAccessByCommitment/);
    });

    it('checkAccessByCommitment returns false on missing PDA, regardless of commitment bytes', async () => {
      const svc = new SolanaService({ rpcUrl: 'https://invalid.local', programId: PROGRAM_ID });
      // Spy: replace fetchSubscriptionByCommitment so we never hit the network.
      jest.spyOn(svc, 'fetchSubscriptionByCommitment').mockResolvedValue(null);
      const r1 = await svc.checkAccessByCommitment(
        '11111111111111111111111111111112',
        new Uint8Array(32).fill(0x11),
      );
      const r2 = await svc.checkAccessByCommitment(
        '11111111111111111111111111111112',
        new Uint8Array(32).fill(0x99),
      );
      expect(r1).toBe(false);
      expect(r2).toBe(false);
    });
  });
});
