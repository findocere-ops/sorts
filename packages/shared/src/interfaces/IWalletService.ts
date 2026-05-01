import type { ChainId } from '../types/chain';

export type WalletMode = 'embedded' | 'external';
export type ChainFamily = 'evm' | 'solana';

export interface UserIdentity {
  privyUserId: string;
  email?: string;
  wallets: WalletDescriptor[];
}

export interface WalletDescriptor {
  id: string;
  source: WalletMode;
  chainFamily: ChainFamily;
  address: string;
  chainId: ChainId;
  isActive: boolean;
}

export interface IWalletService {
  /** Authenticate a user and return their identity. */
  authenticate(method: 'email' | 'wallet'): Promise<UserIdentity>;

  /** Return the wallet address for a user on a given chain. */
  getWalletAddress(userId: string, chainId: ChainId, walletMode?: WalletMode): Promise<string | null>;

  /** List all wallets associated with a user. */
  listWallets(userId: string): Promise<WalletDescriptor[]>;

  /** Sign a message — delegates to the user's active wallet. */
  signMessage(userId: string, chainId: ChainId, message: string): Promise<string>;
}
