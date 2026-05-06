import type { GasDepositStatus, SupportedChain } from '@sorts/shared';

/** Day-6 gas-deposit tracking. Pre-alpha placeholder — returns `funded:false`
 *  for every chain so the UI renders an honest "no gas tank" state. */
export class GasDepositService {
  async getStatus(chain: SupportedChain): Promise<GasDepositStatus> {
    return { chain, funded: false, source: 'pre-alpha' };
  }
}
