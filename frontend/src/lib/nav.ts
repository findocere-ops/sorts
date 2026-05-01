import type { IconName } from '@/components/icons/Icon';

export interface NavItem {
  href: string;
  label: string;
  icon: IconName;
  exact?: boolean;
}

export function creatorNav(cid?: string): NavItem[] {
  const base = cid ? `/studio/${cid}` : '/studio';
  return [
    { href: '/studio', label: 'Overview', icon: 'grid', exact: true },
    { href: '/studio/communities', label: 'Communities', icon: 'layers' },
    { href: '/studio/create', label: 'Create', icon: 'plus' },
    { href: `${base}/content`, label: 'Content', icon: 'feed' },
    { href: `${base}/classroom`, label: 'Classroom', icon: 'book' },
    { href: `${base}/calendar`, label: 'Calendar', icon: 'calendar' },
    { href: `${base}/tiers`, label: 'Tiers', icon: 'crown' },
    { href: `${base}/invites`, label: 'Invites', icon: 'invite' },
    { href: `${base}/analytics`, label: 'Analytics', icon: 'chart' },
    { href: `${base}/telegram`, label: 'Telegram', icon: 'bot' },
    { href: `${base}/privacy-proof`, label: 'Privacy proof', icon: 'shield' },
    { href: `${base}/settings`, label: 'Settings', icon: 'settings' },
  ];
}

export function subscriberNav(cid: string): NavItem[] {
  const base = `/app/${cid}`;
  return [
    { href: `${base}/feed`, label: 'Feed', icon: 'feed' },
    { href: `${base}/classroom`, label: 'Classroom', icon: 'book' },
    { href: `${base}/library`, label: 'Library', icon: 'library' },
    { href: `${base}/calendar`, label: 'Calendar', icon: 'calendar' },
    { href: `${base}/leaderboard`, label: 'Leaderboard', icon: 'trophy' },
    { href: `${base}/membership`, label: 'Membership', icon: 'lock' },
    { href: `${base}/telegram`, label: 'Telegram', icon: 'bot' },
    { href: `${base}/privacy`, label: 'Privacy', icon: 'shield' },
  ];
}

export const publicNav: NavItem[] = [
  { href: '/', label: 'Home', icon: 'home', exact: true },
  { href: '/role', label: 'Choose role', icon: 'user' },
  { href: '/discover', label: 'Discover', icon: 'search' },
  { href: '/auth', label: 'Sign in', icon: 'wallet' },
];
