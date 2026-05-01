import { apiRequest } from './client';
import type { CommunityStats, DashboardStats } from '@/lib/types';

export function getCommunityStats(communityId: string) {
  return apiRequest<CommunityStats>(`/api/analytics/community/${communityId}`);
}

export function getDashboardStats(wallet: string) {
  return apiRequest<DashboardStats>(`/api/analytics/dashboard/${wallet}`);
}
