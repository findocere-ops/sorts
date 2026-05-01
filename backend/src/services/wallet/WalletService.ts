import { v4 as uuid } from 'uuid';
import { verifyMessage } from 'viem';
import type { Database } from 'better-sqlite3';

export interface WalletLink {
  telegramUserId: string;
  walletAddress: string;
  linkedAt: string;
}

export class WalletService {
  constructor(private db: Database) {}

  /** Create a one-time challenge code for wallet linking. */
  createChallenge(telegramUserId: string): string {
    const code = uuid();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 min

    this.db.prepare(`
      INSERT INTO link_challenges (code, telegram_user_id, expires_at)
      VALUES (?, ?, ?)
    `).run(code, telegramUserId, expiresAt);

    return code;
  }

  /** Verify the signature and persist the wallet↔Telegram link. */
  async verifyAndLink(params: {
    code: string;
    wallet: string;
    signature: string;
    telegramUserId?: string;
  }): Promise<{ success: true } | { success: false; error: string }> {
    const challenge = this.db.prepare(
      "SELECT * FROM link_challenges WHERE code = ? AND used = 0 AND expires_at > datetime('now')"
    ).get(params.code) as { code: string; telegram_user_id: string; expires_at: string } | undefined;

    if (!challenge) {
      return { success: false, error: 'Invalid or expired code' };
    }

    const message = this.linkMessage(params.code, params.wallet);
    let valid = false;
    try {
      valid = await verifyMessage({
        address: params.wallet as `0x${string}`,
        message,
        signature: params.signature as `0x${string}`,
      });
    } catch {
      return { success: false, error: 'Invalid signature' };
    }

    if (!valid) {
      return { success: false, error: 'Signature verification failed' };
    }

    const telegramUserId = params.telegramUserId ?? challenge.telegram_user_id;

    this.db.prepare(`
      INSERT INTO wallet_links (id, telegram_user_id, wallet_address)
      VALUES (?, ?, ?)
      ON CONFLICT(telegram_user_id) DO UPDATE SET
        wallet_address = excluded.wallet_address,
        linked_at = datetime('now')
    `).run(uuid(), telegramUserId, params.wallet.toLowerCase());

    this.db.prepare('UPDATE link_challenges SET used = 1 WHERE code = ?').run(params.code);

    return { success: true };
  }

  getLinkedWallet(telegramUserId: string): string | null {
    const row = this.db.prepare(
      'SELECT wallet_address FROM wallet_links WHERE telegram_user_id = ?'
    ).get(telegramUserId) as { wallet_address: string } | undefined;
    return row?.wallet_address ?? null;
  }

  isLinked(telegramUserId: string): boolean {
    return this.getLinkedWallet(telegramUserId) !== null;
  }

  /** The exact message the frontend must also construct for signing. */
  linkMessage(code: string, wallet: string): string {
    return `Link SORTS account\nCode: ${code}\nWallet: ${wallet}`;
  }
}
