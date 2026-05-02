import type { Database } from 'better-sqlite3';
import type { IChainService } from '@sorts/shared';
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

  async getCommunityStats(communityId: string, contractAddress: string): Promise<CommunityStats> {
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
        totalRevenueDisplay: formatUsdc(cached.total_revenue_wei),
        contentCount,
        cachedAt: cached.cached_at,
      };
    }

    // Fetch from chain
    let chainStats = { totalMembers: 0, activeMemberships: 0, totalRevenueWei: '0', activeRatio: 0 };
    try {
      chainStats = await this.chain.getAggregateStats(contractAddress);
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
      totalRevenueDisplay: formatUsdc(chainStats.totalRevenueWei),
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
