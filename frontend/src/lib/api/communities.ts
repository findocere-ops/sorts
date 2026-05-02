import { apiRequest } from './client';
import type { ChainId, Community, Tier } from '@/lib/types';

export function creatorActionMessage(scope: string, wallet: string): string {
  return `SORTS creator action\nScope: ${scope}\nWallet: ${wallet}`;
}

export interface CreateCommunityPayload {
  contractAddress: string;
  name: string;
  symbol: string;
  description?: string;
  category?: Community['category'];
  creatorWallet: string;
  chainId?: ChainId | number;
  isInstitution?: boolean;
  tiers: Array<{
    level: Tier['level'];
    name: string;
    priceWei: string;
    priceDisplay: string;
    durationDays: number;
  }>;
}

export function listCommunities(category?: string) {
  return apiRequest<Community[]>('/api/communities', {
    query: { category },
  });
}

export function getCommunity(communityId: string) {
  return apiRequest<Community>(`/api/communities/${communityId}`);
}

export function getCreatorCommunities(wallet: string) {
  return apiRequest<Community[]>(`/api/communities/creator/${wallet}`);
}

export function createCommunityMetadata(payload: CreateCommunityPayload, creatorSig: string) {
  return apiRequest<{ id: string }>('/api/communities', {
    method: 'POST',
    body: payload,
    headers: { 'x-sorts-creator-sig': creatorSig },
  });
}
