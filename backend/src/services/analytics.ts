import type { Database } from 'better-sqlite3';
import type { IChainService } from '@sorts/shared';
import { ChainServiceFactory } from './chain/ChainServiceFactory';
import { formatUnits } from 'viem';

export interface CommunityStats {
  communityId: string;
  // Aggregate only — never per-member data
  totalMembers: number;
  activeMembers: number;
  expiredMemberships: number;
  activeRatio: number;
  totalRevenueWei: string;
  totalRevenueDisplay: string;
  contentCount: number;
  cachedAt: string;
}

export interface DashboardStats {
  totalCommunities: number;
  totalRevenue: string;  // sum across all creator communities, aggregate only
  totalMembers: number;  // aggregate sum — no breakdown
}

/**
 * AnalyticsService — aggregate-only statistics.
 *
 * Invariants enforced here:
 * - No method returns data that could be attributed to an individual member.
 * - Wallet addresses are never included in any return value.
 * - Tier distributions are never returned (would narrow down individual identity).
 */
export class AnalyticsService {
  constructor(
    private db: Database,
    private chain: IChainService,
  ) {}

  /** Returns chain-aware aggregate stats. The per-community chain id is read
   *  from the `communities.chain_id` column (Day 5) so Solana communities go
   *  through SolanaService.getAggregateStats. The aggregate-only contract
   *  (no per-member fields) holds across both adapters. */
  async getCommunityStats(communityId: string, contractAddress: string): Promise<CommunityStats> {
    const chainRow = this.db.prepare(
      'SELECT chain_id FROM communities WHERE id = ?'
    ).get(communityId) as { chain_id: string } | undefined;
    const chainId = chainRow?.chain_id ?? 'arbitrum-sepolia';
    const adapter: IChainService =
      this.chain && (chainId === 'arbitrum-sepolia')
        ? this.chain
        : ChainServiceFactory.forChain(chainId);
    const isSolana = chainId === 'solana-devnet' || chainId === 'solana-mainnet';
    // Try cache first (5 min TTL)
    const cached = this.db.prepare(
      "SELECT * FROM analytics_cache WHERE community_id = ? AND cached_at > datetime('now', '-5 minutes')"
    ).get(communityId) as {
      total_members: number; active_members: number;
      total_revenue_wei: string; content_count: number; cached_at: string;
    } | undefined;

    const contentCount = (this.db.prepare(
      'SELECT COUNT(*) as n FROM content WHERE community_id = ? AND published = 1'
    ).get(communityId) as { n: number }).n;

    if (cached) {
      const totalMembers = cached.total_members;
      const activeMembers = cached.active_members;
      return {
        communityId,
        totalMembers,
        activeMembers,
        expiredMemberships: totalMembers - activeMembers,
        activeRatio: totalMembers > 0 ? activeMembers / totalMembers : 0,
        totalRevenueWei: cached.total_revenue_wei,
        totalRevenueDisplay: isSolana
          ? formatLamports(cached.total_revenue_wei)
          : formatUsdc(cached.total_revenue_wei),
        contentCount,
        cachedAt: cached.cached_at,
      };
    }

    // Fetch from chain
    let chainStats = { totalMembers: 0, activeMemberships: 0, totalRevenueWei: '0', activeRatio: 0 };
    try {
      chainStats = await adapter.getAggregateStats(contractAddress);
    } catch {
      // Chain unreachable — return zeros rather than fail
    }

    // Update cache
    this.db.prepare(`
      INSERT INTO analytics_cache (community_id, total_members, active_members, total_revenue_wei, content_count)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(community_id) DO UPDATE SET
        total_members = excluded.total_members,
        active_members = excluded.active_members,
        total_revenue_wei = excluded.total_revenue_wei,
        content_count = excluded.content_count,
        cached_at = datetime('now')
    `).run(communityId, chainStats.totalMembers, chainStats.activeMemberships, chainStats.totalRevenueWei, contentCount);

    return {
      communityId,
      totalMembers: chainStats.totalMembers,
      activeMembers: chainStats.activeMemberships,
      expiredMemberships: chainStats.totalMembers - chainStats.activeMemberships,
      activeRatio: chainStats.activeRatio,
      totalRevenueWei: chainStats.totalRevenueWei,
      totalRevenueDisplay: isSolana
        ? formatLamports(chainStats.totalRevenueWei)
        : formatUsdc(chainStats.totalRevenueWei),
      contentCount,
      cachedAt: new Date().toISOString(),
    };
  }

  /** Aggregate dashboard stats across all of a creator's communities. */
  async getDashboardStats(creatorWallet: string): Promise<DashboardStats> {
    const communities = this.db.prepare(
      'SELECT id, contract_address FROM communities WHERE LOWER(creator_wallet) = LOWER(?)'
    ).all(creatorWallet) as { id: string; contract_address: string }[];

    let totalMembers = 0;
    let totalRevenueWei = BigInt(0);

    for (const c of communities) {
      try {
        const stats = await this.getCommunityStats(c.id, c.contract_address);
        totalMembers += stats.totalMembers;
        totalRevenueWei += BigInt(stats.totalRevenueWei);
      } catch {
        // Skip unreachable contracts
      }
    }

    return {
      totalCommunities: communities.length,
      totalMembers,
      totalRevenue: formatUsdc(totalRevenueWei.toString()),
    };
  }
}

function formatUsdc(value: string): string {
  try {
    return `${formatUnits(BigInt(value), 6)} USDC`;
  } catch {
    return '0 USDC';
  }
}

function formatLamports(value: string): string {
  try {
    const n = BigInt(value);
    return `${formatUnits(n, 9)} SOL`;
  } catch {
    return '0 SOL';
  }
}
