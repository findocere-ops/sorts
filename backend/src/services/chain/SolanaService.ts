import { Connection, PublicKey } from '@solana/web3.js';
import type {
  IChainService,
  CreateCommunityConfig,
  SubscribeParams,
  AggregateStats,
  MembershipStatus,
} from '@sorts/shared';
import {
  COMMUNITY_DISCRIMINATOR,
  SUBSCRIPTION_DISCRIMINATOR,
  type CommunityAccount,
  type SubscriptionAccount,
} from './idl/types';

/**
 * SolanaService — Phase 2 chain adapter targeting the deployed sorts_community
 * program on Solana devnet. Mirrors the IChainService surface exposed by
 * ArbitrumService so route handlers stay chain-agnostic.
 *
 * Privacy invariants enforced here (must match programs/sorts-community/src):
 *  - `checkAccess` ignores `requiredTier` (the on-chain program never returns a
 *    tier — only liveness). Returns true iff the subscription PDA exists and
 *    `expiry_ts > now`. `requiredTier` is accepted only to satisfy the EVM
 *    interface signature.
 *  - `getAggregateStats` returns counters only — no per-member data.
 *  - `getCreatorCommunities` uses a `getProgramAccounts` memcmp filter against
 *    the `creator` field of Community; it returns Community PDAs, never any
 *    subscriber list.
 *
 * Writes (`createCommunity`, `subscribe`, `renewSubscription`) throw — writes
 * are signed on the client via the wallet adapter, never on the backend.
 */
export class SolanaService implements IChainService {
  private connection: Connection;
  private programId: PublicKey;

  constructor(opts?: { rpcUrl?: string; programId?: string }) {
    const rpc =
      opts?.rpcUrl ??
      process.env.SOLANA_DEVNET_RPC_URL ??
      'https://api.devnet.solana.com';
    const pid =
      opts?.programId ??
      process.env.SOLANA_PROGRAM_ID ??
      'AEp6VuJqfctTRQpZP3LDjKcua4C1jGP8YT721AMSBkFV';
    this.connection = new Connection(rpc, 'confirmed');
    this.programId = new PublicKey(pid);
  }

  // ── Writes (client-only) ─────────────────────────────────────────────────

  async createCommunity(_config: CreateCommunityConfig): Promise<{
    communityId: string;
    contractAddress: string;
    txHash: string;
  }> {
    throw new Error('createCommunity must be called from the frontend via the Solana wallet adapter');
  }

  async subscribe(_params: SubscribeParams): Promise<{ txHash: string; expiresAt: string }> {
    throw new Error('subscribe must be called from the frontend via the Solana wallet adapter');
  }

  async renewSubscription(
    _communityAddress: string,
    _memberWallet: string,
    _paymentWei: string,
  ): Promise<{ txHash: string; expiresAt: string }> {
    throw new Error('renewSubscription must be called from the frontend via the Solana wallet adapter');
  }

  // ── Reads ────────────────────────────────────────────────────────────────

  /** True iff the (community, member) Subscription PDA exists and has not expired.
   *  `requiredTier` is intentionally ignored — the on-chain program does not
   *  expose a member's tier. */
  async checkAccess(
    communityAddress: string,
    memberWallet: string,
    _requiredTier: 1 | 2 | 3,
  ): Promise<boolean> {
    const sub = await this.fetchSubscription(communityAddress, memberWallet);
    if (!sub) return false;
    const nowSec = BigInt(Math.floor(Date.now() / 1000));
    return sub.expiryTs > nowSec;
  }

  async getAggregateStats(communityAddress: string): Promise<AggregateStats> {
    const community = await this.fetchCommunity(communityAddress);
    if (!community) {
      return {
        totalMembers: 0,
        activeMemberships: 0,
        expiredMemberships: 0,
        totalRevenueWei: '0',
        totalRevenueDisplay: '0.0000 SOL',
        activeRatio: 0,
      };
    }
    const total = Number(community.totalMembersCounter);
    const active = Number(community.activeMembersCounter);
    const revenue = community.totalRevenueLamports;
    return {
      totalMembers: total,
      activeMemberships: active,
      expiredMemberships: Math.max(0, total - active),
      totalRevenueWei: revenue.toString(),
      totalRevenueDisplay: `${formatSol(revenue)} SOL`,
      activeRatio: total > 0 ? active / total : 0,
    };
  }

  async getMembershipStatus(
    communityAddress: string,
    memberWallet: string,
  ): Promise<MembershipStatus> {
    const sub = await this.fetchSubscription(communityAddress, memberWallet);
    if (!sub) {
      return { hasAccess: false, isExpired: false, tierLevel: null, expiresAt: null, expiresInDays: null };
    }
    const nowSec = BigInt(Math.floor(Date.now() / 1000));
    const expirySec = Number(sub.expiryTs);
    const isExpired = sub.expiryTs <= nowSec;
    const expiresAt = new Date(expirySec * 1000).toISOString();
    const expiresInDays = isExpired
      ? 0
      : Math.ceil((expirySec - Number(nowSec)) / 86400);
    return {
      hasAccess: !isExpired,
      isExpired,
      tierLevel: null, // privacy invariant — never expose
      expiresAt,
      expiresInDays,
    };
  }

  /** Filter Community accounts by the `creator` field via memcmp.
   *  Layout: byte 0 = discriminator (u8 = 1), bytes 1..33 = creator pubkey. */
  async getCreatorCommunities(creatorWallet: string): Promise<string[]> {
    let creatorPk: PublicKey;
    try {
      creatorPk = new PublicKey(creatorWallet);
    } catch {
      return [];
    }
    const accounts = await this.connection.getProgramAccounts(this.programId, {
      filters: [
        { memcmp: { offset: 0, bytes: discriminatorBase58(COMMUNITY_DISCRIMINATOR) } },
        { memcmp: { offset: 1, bytes: creatorPk.toBase58() } },
      ],
    });
    return accounts.map((a) => a.pubkey.toBase58());
  }

  // ── PDA helpers ──────────────────────────────────────────────────────────

  communityPda(creator: PublicKey): { pda: PublicKey; bump: number } {
    const [pda, bump] = PublicKey.findProgramAddressSync(
      [Buffer.from('community'), creator.toBuffer()],
      this.programId,
    );
    return { pda, bump };
  }

  subscriptionPda(community: PublicKey, subscriber: PublicKey): { pda: PublicKey; bump: number } {
    const [pda, bump] = PublicKey.findProgramAddressSync(
      [Buffer.from('subscription'), community.toBuffer(), subscriber.toBuffer()],
      this.programId,
    );
    return { pda, bump };
  }

  // ── Account fetch + decode ───────────────────────────────────────────────

  async fetchCommunity(address: string): Promise<CommunityAccount | null> {
    const info = await this.connection.getAccountInfo(new PublicKey(address));
    if (!info) return null;
    return decodeCommunity(info.data);
  }

  /** Resolves the Subscription PDA for `(community, subscriber)` and decodes it. */
  async fetchSubscription(
    communityAddress: string,
    subscriberWallet: string,
  ): Promise<SubscriptionAccount | null> {
    let community: PublicKey;
    let subscriber: PublicKey;
    try {
      community = new PublicKey(communityAddress);
      subscriber = new PublicKey(subscriberWallet);
    } catch {
      return null;
    }
    const { pda } = this.subscriptionPda(community, subscriber);
    const info = await this.connection.getAccountInfo(pda);
    if (!info) return null;
    return decodeSubscription(info.data);
  }
}

// ── Decoders (hand-written; Quasar uses single-byte account discriminators) ──

function decodeCommunity(data: Buffer): CommunityAccount | null {
  if (data.length < 179) return null;
  if (data.readUInt8(0) !== COMMUNITY_DISCRIMINATOR) return null;
  let off = 1;
  const creator = new PublicKey(data.subarray(off, off + 32)); off += 32;
  const nameHash = new Uint8Array(data.subarray(off, off + 32)); off += 32;
  const symbolHash = new Uint8Array(data.subarray(off, off + 32)); off += 32;
  const createdAt = data.readBigInt64LE(off); off += 8;
  const tierCount = data.readUInt8(off); off += 1;
  const tier1PriceLamports = data.readBigUInt64LE(off); off += 8;
  const tier1DurationSecs = data.readBigInt64LE(off); off += 8;
  const tier2PriceLamports = data.readBigUInt64LE(off); off += 8;
  const tier2DurationSecs = data.readBigInt64LE(off); off += 8;
  const tier3PriceLamports = data.readBigUInt64LE(off); off += 8;
  const tier3DurationSecs = data.readBigInt64LE(off); off += 8;
  const totalMembersCounter = data.readBigUInt64LE(off); off += 8;
  const activeMembersCounter = data.readBigUInt64LE(off); off += 8;
  const totalRevenueLamports = data.readBigUInt64LE(off); off += 8;
  const bump = data.readUInt8(off);
  return {
    creator, nameHash, symbolHash, createdAt, tierCount,
    tier1PriceLamports, tier1DurationSecs,
    tier2PriceLamports, tier2DurationSecs,
    tier3PriceLamports, tier3DurationSecs,
    totalMembersCounter, activeMembersCounter, totalRevenueLamports, bump,
  };
}

function decodeSubscription(data: Buffer): SubscriptionAccount | null {
  if (data.length < 138) return null;
  if (data.readUInt8(0) !== SUBSCRIPTION_DISCRIMINATOR) return null;
  let off = 1;
  const community = new PublicKey(data.subarray(off, off + 32)); off += 32;
  const subscriber = new PublicKey(data.subarray(off, off + 32)); off += 32;
  const expiryTs = data.readBigInt64LE(off); off += 8;
  const tierCommitment = new Uint8Array(data.subarray(off, off + 32)); off += 32;
  const saltPubkey = new PublicKey(data.subarray(off, off + 32)); off += 32;
  const bump = data.readUInt8(off);
  return { community, subscriber, expiryTs, tierCommitment, saltPubkey, bump };
}

function discriminatorBase58(disc: number): string {
  // memcmp filter takes a base58 string. Wrap a single byte as base58.
  const b = Buffer.from([disc]);
  // 1-byte base58: hand-encode (avoids pulling in bs58 separately).
  const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  if (b[0] === 0) return '1';
  const result: string[] = [];
  let n = b[0];
  while (n > 0) {
    result.unshift(ALPHABET[n % 58]);
    n = Math.floor(n / 58);
  }
  return result.join('');
}

function formatSol(lamports: bigint): string {
  // 9 decimals — render to 4dp without floating-point loss.
  const whole = lamports / 1_000_000_000n;
  const frac = lamports % 1_000_000_000n;
  const fracStr = (frac + 1_000_000_000n).toString().slice(1).padStart(9, '0');
  return `${whole.toString()}.${fracStr.slice(0, 4)}`;
}

export { decodeCommunity, decodeSubscription, formatSol };
