import type { Community, Tier, AggregateStats } from '../types/community';
import type { MembershipStatus } from '../types/membership';
import type { ChainId } from '../types/chain';

export interface CreateCommunityConfig {
  /** Chain discriminator — routes the call to the right IChainService impl. */
  chain?: ChainId;
  name: string;
  symbol: string;
  description: string;
  tiers: Array<{ name: string; priceWei: string; durationDays: number; benefits: string[] }>;
  creatorWallet: string;
}

export interface SubscribeParams {
  /** Chain discriminator — routes the call to the right IChainService impl. */
  chain?: ChainId;
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

  /** Check whether a wallet has valid access (active + tier sufficient).
   *  On Solana, the on-chain program never reveals the tier — `requiredTier`
   *  is honored only for EVM. Solana adapters return active-true regardless
   *  of `requiredTier` (privacy invariant). */
  checkAccess(communityAddress: string, memberWallet: string, requiredTier: 1 | 2 | 3): Promise<boolean>;

  /** Return aggregate-only stats — never individual member data. */
  getAggregateStats(communityAddress: string): Promise<AggregateStats>;

  /** Return membership status for a specific wallet. */
  getMembershipStatus(communityAddress: string, memberWallet: string): Promise<MembershipStatus>;

  /** Return all communities created by a wallet. */
  getCreatorCommunities(creatorWallet: string): Promise<string[]>;
}
