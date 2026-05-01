import type { Community, Tier, AggregateStats } from '../types/community';
import type { MembershipStatus } from '../types/membership';

export interface CreateCommunityConfig {
  name: string;
  symbol: string;
  description: string;
  tiers: Array<{ name: string; priceWei: string; durationDays: number; benefits: string[] }>;
  creatorWallet: string;
}

export interface SubscribeParams {
  communityAddress: string;
  tierLevel: 1 | 2 | 3;
  paymentWei: string;
  memberWallet: string;
}

export interface IChainService {
  /** Deploy a new community contract and return the contract address. */
  createCommunity(config: CreateCommunityConfig): Promise<{ communityId: string; contractAddress: string; txHash: string }>;

  /** Mint a membership token for the given tier. */
  subscribe(params: SubscribeParams): Promise<{ txHash: string; expiresAt: string }>;

  /** Renew an existing membership. */
  renewSubscription(communityAddress: string, memberWallet: string, paymentWei: string): Promise<{ txHash: string; expiresAt: string }>;

  /** Check whether a wallet has valid access (active + tier sufficient). */
  checkAccess(communityAddress: string, memberWallet: string, requiredTier: 1 | 2 | 3): Promise<boolean>;

  /** Return aggregate-only stats — never individual member data. */
  getAggregateStats(communityAddress: string): Promise<AggregateStats>;

  /** Return membership status for a specific wallet. */
  getMembershipStatus(communityAddress: string, memberWallet: string): Promise<MembershipStatus>;

  /** Return all communities created by a wallet. */
  getCreatorCommunities(creatorWallet: string): Promise<string[]>;
}
