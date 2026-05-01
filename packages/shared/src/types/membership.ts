export interface Membership {
  id: string;
  privyUserId: string;
  communityId: string;
  tierLevel: 1 | 2 | 3;
  subscribedAt: string;
  expiresAt: string;
  isActive: boolean;
  totalPoints: number;
  currentLevel: number;
}

export interface MembershipStatus {
  hasAccess: boolean;
  isExpired: boolean;
  tierLevel: 1 | 2 | 3 | null;
  expiresAt: string | null;
  expiresInDays: number | null;
}
