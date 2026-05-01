import { apiRequest } from './client';
import type { MembershipStatus } from '@/lib/types';

export interface MembershipStatusQuery {
  communityId: string;
  wallet: string;
}

/**
 * Intended backend membership-status client.
 *
 * The current MVP still reads membership status directly from the chain in the
 * frontend. This function is ready for the future backend endpoint, but it will
 * return an API error until `/api/membership/status` exists.
 */
export function getMembershipStatus(query: MembershipStatusQuery) {
  return apiRequest<MembershipStatus>('/api/membership/status', {
    query: {
      communityId: query.communityId,
      wallet: query.wallet,
    },
  });
}
