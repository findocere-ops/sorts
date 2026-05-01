import type { ChainId } from './chain';

export interface Tier {
  id: string;
  communityId: string;
  level: 1 | 2 | 3;          // 1=Basic, 2=Pro, 3=VIP
  name: string;
  priceWei: string;           // price in smallest unit (wei / lamport)
  priceDisplay: string;       // human-readable: "0.005 ETH"
  durationDays: number;
  benefits: string[];
}

export interface Community {
  id: string;
  chainId: ChainId;
  contractAddress: string;
  name: string;
  symbol: string;
  description: string;
  coverImageUrl?: string;
  category: string;
  creatorPrivyId: string;
  creatorWallet: string;
  tiers: Tier[];
  createdAt: string;
}

export interface AggregateStats {
  totalMembers: number;
  activeMemberships: number;
  expiredMemberships: number;
  totalRevenueWei: string;
  totalRevenueDisplay: string;
  activeRatio: number;         // 0–1
}

export interface Content {
  id: string;
  communityId: string;
  creatorPrivyId: string;
  title: string;
  body?: string;
  encryptedRef?: string;       // iExec DataProtector ref (Phase 1) / Umbra ref (Phase 2)
  contentType: 'post' | 'announcement' | 'research_note' | 'lesson' | 'resource' | 'event_recap';
  tierRequired: 1 | 2 | 3;
  category?: string;
  pinned: boolean;
  likesCount: number;
  commentsCount: number;
  createdAt: string;
}
