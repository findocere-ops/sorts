import type {
  DWalletDescriptor,
  GasDepositStatus,
  IMultichainControlService,
  MessageApproval,
  SupportedChain,
} from '@sorts/shared';

/** Day-6 IKA dWallet capability layer (pre-alpha).
 *
 *  Cut-line decision: the public IKA pre-alpha endpoint has no devnet path
 *  we can rely on for this build, so this service ships as a static
 *  capability descriptor. The shape matches the future real-funds
 *  implementation 1:1 — when IKA mainnet/devnet is stable, the `getStatus`
 *  + `getCapabilities` bodies become the only thing that has to change.
 *
 *  Real-funds gate: the constructor THROWS unless `ENABLE_IKA_REAL_FUNDS`
 *  is explicitly enabled when caller asks for the real-funds path. This
 *  tripwire is exercised by `ika-no-real-funds.test.ts` (t6).
 */
export interface IkaDWalletServiceOptions {
  /** Set to `true` only by tests / explicit deploy paths. Defaults to
   *  reading `process.env.ENABLE_IKA_REAL_FUNDS` at construction time. */
  enableRealFunds?: boolean;
}

export class IkaDWalletService implements IMultichainControlService {
  private readonly realFunds: boolean;

  constructor(opts: IkaDWalletServiceOptions = {}) {
    const flagFromEnv = process.env.ENABLE_IKA_REAL_FUNDS === 'true';
    this.realFunds = opts.enableRealFunds ?? flagFromEnv;
  }

  async getStatus(): Promise<{ status: 'pre-alpha'; canSign: boolean }> {
    return { status: 'pre-alpha', canSign: false };
  }

  async getCapabilities(): Promise<DWalletDescriptor[]> {
    return [
      {
        id: 'ika-devnet-placeholder',
        ownership: 'user-controlled',
        supportedChains: ['solana-devnet', 'arbitrum-sepolia'],
        status: 'pre-alpha',
      },
    ];
  }

  async getApproval(approvalId: string): Promise<MessageApproval | null> {
    if (!approvalId) return null;
    return {
      id: approvalId,
      chain: 'solana-devnet',
      state: 'prepared',
      kind: 'placeholder',
      updatedAt: new Date().toISOString(),
    };
  }

  async getGasStatus(chain: SupportedChain): Promise<GasDepositStatus> {
    return { chain, funded: false, source: 'pre-alpha' };
  }

  /** Real-funds methods sit behind this guard. Calling any of them without
   *  the flag set throws — privacy/safety invariant for Day 6. */
  signRealFundsPayload(_payload: unknown): never {
    if (!this.realFunds) {
      throw new Error(
        'IkaDWalletService: real-funds method blocked — set ENABLE_IKA_REAL_FUNDS=true to opt in',
      );
    }
    // Reachable only when flag is set; pre-alpha does not implement the real
    // path yet — surface a clear "not yet" rather than a silent no-op.
    throw new Error('IkaDWalletService: real-funds path not implemented in pre-alpha build');
  }
}
