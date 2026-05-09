/** Day-6 wallet capability + lifecycle types.
 *
 *  These are pre-alpha placeholders for the IKA dWallet integration. Every
 *  service that consumes them MUST gate any real-funds path behind the
 *  `ENABLE_IKA_REAL_FUNDS` environment flag.
 */

export type SupportedChain = 'solana-devnet' | 'arbitrum-sepolia';

export type DWalletStatus = 'available' | 'pre-alpha' | 'unavailable';

export interface DWalletDescriptor {
  id: string;
  ownership: 'user-controlled' | 'program-controlled';
  supportedChains: SupportedChain[];
  status: DWalletStatus;
}

/** 6-state message-approval lifecycle. UI reflects the current state in
 *  `MessageApprovalLifecycle`. */
export type MessageApprovalState =
  | 'prepared'
  | 'awaiting-approval'
  | 'pending-signature'
  | 'signed'
  | 'broadcasted'
  | 'failed';

export interface MessageApproval {
  id: string;
  chain: SupportedChain;
  state: MessageApprovalState;
  /** Free-form message kind (e.g. `community-create`, `subscribe`). */
  kind: string;
  /** ISO timestamp when the approval entered the current state. */
  updatedAt: string;
}

export interface GasDepositStatus {
  chain: SupportedChain;
  /** True once the dWallet's gas tank for this chain is provisioned. */
  funded: boolean;
  /** Stable label: `pre-alpha`, `simulated`, etc. */
  source: 'pre-alpha' | 'simulated' | 'real';
}
