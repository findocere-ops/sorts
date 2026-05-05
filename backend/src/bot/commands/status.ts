import { Context } from 'grammy';
import { WalletService } from '../../services/wallet/WalletService';
import { ChainServiceFactory } from '../../services/chain/ChainServiceFactory';
import type { Database } from 'better-sqlite3';

// Privacy invariants for the /status reply:
// - NEVER contains the substring "tier" or any tier number (1/2/3).
// - NEVER includes a community member count.
// - Per-community chain dispatch routes Solana communities through
//   SolanaService.getMembershipStatus.

export function statusHandler(db: Database) {
  const walletService = new WalletService(db);
  const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';

  return async (ctx: Context) => {
    const telegramId = ctx.from?.id?.toString();
    if (!telegramId) return;

    const wallet = walletService.getLinkedWallet(telegramId);
    if (!wallet) {
      await ctx.reply(
        '🔗 No wallet linked.\n\nRun /start to link your wallet and check your memberships.',
      );
      return;
    }

    const communities = db.prepare(
      'SELECT id, name, contract_address, chain_id FROM communities ORDER BY name',
    ).all() as { id: string; name: string; contract_address: string; chain_id: string }[];

    if (communities.length === 0) {
      await ctx.reply('No communities exist yet. Discover them at ' + frontendUrl + '/discover');
      return;
    }

    const lines: string[] = [`Wallet: \`${wallet.slice(0, 8)}…${wallet.slice(-6)}\`\n`];
    let hasAny = false;

    for (const c of communities) {
      try {
        const adapter = ChainServiceFactory.forChain(c.chain_id ?? 'arbitrum-sepolia');
        const status = await adapter.getMembershipStatus(c.contract_address, wallet);
        if (status.hasAccess) {
          hasAny = true;
          const expStr = status.expiresAt
            ? new Date(status.expiresAt).toLocaleDateString()
            : 'unknown';
          lines.push(`✅ *${c.name}* — active (expires ${expStr})`);
        } else if (status.isExpired) {
          hasAny = true;
          lines.push(`⚠️ *${c.name}* — expired\nRenew: ${frontendUrl}/join/${c.id}`);
        }
      } catch {
        // Skip unreachable contracts silently
      }
    }

    if (!hasAny) {
      lines.push('No active memberships found.\nDiscover communities at ' + frontendUrl + '/discover');
    }

    await ctx.reply(lines.join('\n'), { parse_mode: 'Markdown' });
  };
}
