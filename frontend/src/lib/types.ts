export type ChainId = 'arbitrum-sepolia';

export interface Tier {
  id?: string;
  community_id?: string;
  level: 1 | 2 | 3;
  name: string;
  price_wei: string;
  price_display: string;
  duration_days: number;
}

export interface Community {
  id: string;
  chain_id: ChainId | string;
  contract_address: string;
  name: string;
  symbol: string;
  description: string | null;
  category: 'alpha' | 'research' | 'education' | 'institution' | 'protocol' | 'other' | string;
  creator_wallet: string;
  is_institution: number;
  created_at: string;
  tiers: Tier[];
}

export interface ContentItem {
  id: string;
  community_id: string;
  creator_wallet: string;
  title: string;
  body?: string | null;
  content_type: 'post' | 'report' | 'signal' | 'event' | 'announcement' | string;
  tier_required: 1 | 2 | 3 | number;
  pinned: number;
  published: number;
  likes_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
  protected_data_address?: string | null;
  protected_data_name?: string | null;
  protection_provider?: 'none' | 'iexec-dataprotector' | string;
  iapp_address?: string | null;
  protection_status?: 'plain' | 'protected' | string;
  locked?: boolean;
}

export interface CommunityStats {
  communityId: string;
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
  totalMembers: number;
  totalRevenue: string;
}

export interface MembershipStatus {
  hasAccess: boolean;
  isExpired: boolean;
  tierLevel: 1 | 2 | 3 | null;
  expiresAt: string | null;
  expiresInDays: number | null;
  messageToSign?: string;
}

export type TransactionStatus =
  | 'idle'
  | 'wallet-not-connected'
  | 'wrong-network'
  | 'factory-not-configured'
  | 'awaiting-signature'
  | 'transaction-pending'
  | 'transaction-confirmed'
  | 'transaction-failed';

export interface ApiError {
  code:
    | 'backend_offline'
    | 'timeout'
    | 'invalid_json'
    | 'api_error'
    | 'http_error'
    | 'unknown_error';
  message: string;
  status?: number;
  details?: unknown;
}

export interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: string | Record<string, unknown>;
  messageToSign?: string;
}
