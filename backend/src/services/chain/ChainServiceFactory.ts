import type { IChainService } from '@sorts/shared';
import type { ChainId } from '@sorts/shared';
import { ArbitrumService } from './ArbitrumService';

export class ChainServiceFactory {
  static forChain(chainId: ChainId | string = 'arbitrum-sepolia'): IChainService {
    switch (chainId) {
      case 'arbitrum-sepolia':
        return new ArbitrumService();
      default:
        throw new Error(`Unsupported chain: ${chainId}`);
    }
  }
}
