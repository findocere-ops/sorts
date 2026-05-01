export const factoryAbi = [
  {
    type: 'function',
    name: 'createCommunity',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'name_', type: 'string' },
      { name: 'symbol_', type: 'string' },
      { name: 'tierIds', type: 'uint8[]' },
      { name: 'prices', type: 'uint256[]' },
      { name: 'durations', type: 'uint256[]' },
    ],
    outputs: [
      { name: 'communityId', type: 'uint256' },
      { name: 'contractAddress', type: 'address' },
    ],
  },
  {
    type: 'function',
    name: 'getCommunity',
    stateMutability: 'view',
    inputs: [{ name: 'communityId', type: 'uint256' }],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    type: 'function',
    name: 'getCommunityCount',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'getCreatorCommunities',
    stateMutability: 'view',
    inputs: [{ name: 'creator', type: 'address' }],
    outputs: [{ name: '', type: 'address[]' }],
  },
  {
    type: 'event',
    name: 'CommunityCreated',
    inputs: [
      { name: 'communityId', type: 'uint256', indexed: true },
      { name: 'creator', type: 'address', indexed: true },
      { name: 'contractAddress', type: 'address', indexed: false },
      { name: 'name', type: 'string', indexed: false },
      { name: 'symbol', type: 'string', indexed: false },
    ],
    anonymous: false,
  },
] as const;
