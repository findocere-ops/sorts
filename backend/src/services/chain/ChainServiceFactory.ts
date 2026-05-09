import type { IChainService } from '@sorts/shared';
import type { ChainId } from '@sorts/shared';
import { ArbitrumService } from './ArbitrumService';
import { SolanaService } from './SolanaService';

export class ChainServiceFactory {
  static forChain(chainId: ChainId | string = 'arbitrum-sepolia'): IChainService {
    switch (chainId) {
      case 'arbitrum-sepolia':
        return new ArbitrumService();
      case 'solana-devnet':
      case 'solana-mainnet':
        return new SolanaService();
      default:
        throw new Error(`Unsupported chain: ${chainId}`);
    }
  }
}
