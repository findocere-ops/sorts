import type {
  DWalletDescriptor,
  GasDepositStatus,
  MessageApproval,
  SupportedChain,
} from '../types/wallet';

/** Day-6 IKA dWallet service boundary.
 *
 *  Every implementation MUST:
 *    - Refuse to instantiate the real-funds path unless
 *      `ENABLE_IKA_REAL_FUNDS === true`.
 *    - Surface `status: 'pre-alpha'` on devnet so the UI can render the
 *      mandatory disclaimer.
 *    - Never log or return seed material, signing keys, or raw signatures.
 */
export interface IMultichainControlService {
  getStatus(): Promise<{ status: 'pre-alpha' | 'available' | 'unavailable'; canSign: boolean }>;

  getCapabilities(): Promise<DWalletDescriptor[]>;

  /** Read-only on Day 6. Returns the latest `MessageApproval` shape for a
   *  given pending tx id. Real interactive flows are post-MVP. */
  getApproval?(approvalId: string): Promise<MessageApproval | null>;

  /** Returns gas-deposit status per supported chain. */
  getGasStatus?(chain: SupportedChain): Promise<GasDepositStatus>;
}
