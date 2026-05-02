import { createPublicClient, formatUnits, http, parseAbi } from 'viem';
import { arbitrumSepolia } from 'viem/chains';
import type { IChainService, CreateCommunityConfig, SubscribeParams } from '@sorts/shared';
import type { AggregateStats } from '@sorts/shared';
import type { MembershipStatus } from '@sorts/shared';

const FACTORY_ABI = parseAbi([
  'function createCommunity(string name, string symbol, uint8[] tierIds, uint256[] prices, uint64[] durations) returns (uint256 communityId, address contractAddress)',
  'function getCommunity(uint256 communityId) view returns (address)',
  'function getCommunityCount() view returns (uint256)',
  'function getCreatorCommunities(address creator) view returns (address[])',
  'event CommunityCreated(uint256 indexed communityId, address indexed creator, address contractAddress, string name, string symbol)',
]);

const MEMBERSHIP_ABI = parseAbi([
  'function subscribe(uint8 tier)',
  'function renewSubscription()',
  'function checkAccess(address user) view returns (bool)',
  'function checkTierAccess(address user, uint8 requiredTier) view returns (bool)',
  'function getMemberExpiry(address user) view returns (uint256)',
  'function getRenewalPrice(address user) view returns (uint256)',
  'function getAggregateStats() view returns (uint256 members, uint256 revenue, uint256 active)',
  'function paymentToken() view returns (address)',
  'function tierPrices(uint8 tier) view returns (uint256)',
  'function memberExpiry(address user) view returns (uint256)',
]);

/**
 * ArbitrumService — Phase 1 chain adapter for Arbitrum Sepolia.
 * Implements IChainService using viem for on-chain reads.
 * Write operations require wallet signing (handled by frontend via wagmi/viem).
 */
export class ArbitrumService implements IChainService {
  private client = createPublicClient({
    chain: arbitrumSepolia,
    transport: http(
      process.env.ARBITRUM_SEPOLIA_RPC_URL ??
      process.env.ARBITRUM_SEPOLIA_RPC ??
      'https://sepolia-rollup.arbitrum.io/rpc'
    ),
  });

  private factoryAddress = (process.env.SORTS_FACTORY_ADDRESS ?? '0x0') as `0x${string}`;

  async createCommunity(_config: CreateCommunityConfig): Promise<{ communityId: string; contractAddress: string; txHash: string }> {
    // Write operations are initiated by the frontend (wagmi). Backend records the result.
    throw new Error('createCommunity must be called from the frontend via wagmi');
  }

  async subscribe(_params: SubscribeParams): Promise<{ txHash: string; expiresAt: string }> {
    throw new Error('subscribe must be called from the frontend via wagmi');
  }

  async renewSubscription(_communityAddress: string, _memberWallet: string, _paymentWei: string): Promise<{ txHash: string; expiresAt: string }> {
    throw new Error('renewSubscription must be called from the frontend via wagmi');
  }

  async checkAccess(communityAddress: string, memberWallet: string, requiredTier: 1 | 2 | 3): Promise<boolean> {
    try {
      return await this.client.readContract({
        address: communityAddress as `0x${string}`,
        abi: MEMBERSHIP_ABI,
        functionName: 'checkTierAccess',
        args: [memberWallet as `0x${string}`, requiredTier],
      }) as boolean;
    } catch {
      return false;
    }
  }

  async getAggregateStats(communityAddress: string): Promise<AggregateStats> {
    const result = await this.client.readContract({
      address: communityAddress as `0x${string}`,
      abi: MEMBERSHIP_ABI,
      functionName: 'getAggregateStats',
    }) as [bigint, bigint, bigint];

    const [members, revenue, active] = result;
    return {
      totalMembers: Number(members),
      activeMemberships: Number(active),
      expiredMemberships: Number(members) - Number(active),
      totalRevenueWei: revenue.toString(),
      totalRevenueDisplay: `${formatUsdc(revenue)} USDC`,
      activeRatio: Number(members) > 0 ? Number(active) / Number(members) : 0,
    };
  }

  async getMembershipStatus(communityAddress: string, memberWallet: string): Promise<MembershipStatus> {
    const expiry = await this.client.readContract({
      address: communityAddress as `0x${string}`,
      abi: MEMBERSHIP_ABI,
      functionName: 'getMemberExpiry',
      args: [memberWallet as `0x${string}`],
    }) as bigint;

    const nowSec = Math.floor(Date.now() / 1000);
    const expirySec = Number(expiry);

    if (expirySec === 0) {
      return { hasAccess: false, isExpired: false, tierLevel: null, expiresAt: null, expiresInDays: null };
    }

    const isExpired = expirySec < nowSec;
    const expiresAt = new Date(expirySec * 1000).toISOString();
    const expiresInDays = isExpired ? 0 : Math.ceil((expirySec - nowSec) / 86400);

    return {
      hasAccess: !isExpired,
      isExpired,
      tierLevel: null, // tier deliberately hidden — privacy requirement
      expiresAt,
      expiresInDays,
    };
  }

  async getCreatorCommunities(creatorWallet: string): Promise<string[]> {
    return await this.client.readContract({
      address: this.factoryAddress,
      abi: FACTORY_ABI,
      functionName: 'getCreatorCommunities',
      args: [creatorWallet as `0x${string}`],
    }) as string[];
  }
}

function formatUsdc(value: bigint): string {
  return formatUnits(value, 6);
}
