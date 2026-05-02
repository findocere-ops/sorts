export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
export const FACTORY_ADDRESS = (process.env.NEXT_PUBLIC_SORTS_FACTORY_ADDRESS?.trim() ?? '0x0') as `0x${string}`;

export const TIER_NAMES: Record<number, string> = {
  1: 'Basic',
  2: 'Pro',
  3: 'VIP',
};

export const TIER_COLORS: Record<number, string> = {
  1: '#7880a0',
  2: '#5b8ef5',
  3: '#8b5cf6',
};

/** Protocol fee applied to all on-chain subscription revenue: 5% */
export const PROTOCOL_FEE_BPS = 500;

/**
 * SORTS platform plans — SaaS subscription layer on top of the protocol fee.
 * Revenue model: Protocol fee (5%) + Optional platform plan.
 * Margin: >50% because Arbitrum gas costs are ~$0.01/tx and infra is minimal.
 */
export const PLATFORM_PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    priceAnnual: 0,
    protocolFeePercent: 5,
    maxCommunities: 1,
    maxMembersPerCommunity: 100,
    features: [
      '1 private community',
      'Up to 100 members',
      '3 content tiers',
      'Telegram bot access',
      '5% protocol fee on revenue',
    ],
    cta: 'Get started free',
    highlight: false,
  },
  {
    id: 'builder',
    name: 'Builder',
    price: 49,
    priceAnnual: 39,
    protocolFeePercent: 3,
    maxCommunities: 10,
    maxMembersPerCommunity: 1000,
    features: [
      '10 private communities',
      'Up to 1,000 members each',
      'Custom tier names',
      'DataProtector anti-piracy',
      'Priority Telegram support',
      '3% protocol fee on revenue',
    ],
    cta: 'Start building',
    highlight: true,
  },
  {
    id: 'scale',
    name: 'Scale',
    price: 149,
    priceAnnual: 119,
    protocolFeePercent: 1,
    maxCommunities: -1,   // unlimited
    maxMembersPerCommunity: -1,
    features: [
      'Unlimited communities',
      'Unlimited members',
      'Institution mode UI',
      'Export & reporting',
      'Custom domain (coming soon)',
      '1% protocol fee on revenue',
    ],
    cta: 'Scale up',
    highlight: false,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: -1,  // custom
    priceAnnual: -1,
    protocolFeePercent: 0.5,
    maxCommunities: -1,
    maxMembersPerCommunity: -1,
    features: [
      'Everything in Scale',
      'White-label branding',
      'Dedicated support',
      'SLA guarantee',
      'On-chain audit reports',
      '0.5% protocol fee on revenue',
    ],
    cta: 'Contact us',
    highlight: false,
  },
] as const;
