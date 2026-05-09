import type { MessageApproval, MessageApprovalState, SupportedChain } from '@sorts/shared';

/** Day-6 message-approval lifecycle service.
 *
 *  Read-only on Day 6: surfaces the current `MessageApproval` for any pending
 *  cross-chain transaction the dWallet has prepared. The interactive sign +
 *  broadcast flow is post-MVP.
 */
export class CrossChainSigningService {
  private store = new Map<string, MessageApproval>();

  prepare(id: string, chain: SupportedChain, kind: string): MessageApproval {
    const m: MessageApproval = {
      id,
      chain,
      kind,
      state: 'prepared',
      updatedAt: new Date().toISOString(),
    };
    this.store.set(id, m);
    return m;
  }

  transition(id: string, state: MessageApprovalState): MessageApproval | null {
    const existing = this.store.get(id);
    if (!existing) return null;
    const next: MessageApproval = { ...existing, state, updatedAt: new Date().toISOString() };
    this.store.set(id, next);
    return next;
  }

  get(id: string): MessageApproval | null {
    return this.store.get(id) ?? null;
  }

  list(): MessageApproval[] {
    return Array.from(this.store.values());
  }
}
