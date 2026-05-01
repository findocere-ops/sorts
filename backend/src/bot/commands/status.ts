import { Context } from 'grammy';
import { WalletService } from '../../services/wallet/WalletService';
import { ChainServiceFactory } from '../../services/chain/ChainServiceFactory';
import type { Database } from 'better-sqlite3';

/*
 * /status
 *
 * Input:    /status
 * Lookup:   wallet_links by telegram_user_id
 * Chain:    getMembershipStatus(contractAddress, wallet) for each community
 * Success:  list of communities with active / expired status
 * Failure:  wallet not linked → prompt to link
 * Expiry:   shown inline per community with renewal URL
 */
export function statusHandler(db: Database) {
  const walletService = new WalletService(db);
  const chain = ChainServiceFactory.forChain();
  const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';

  return async (ctx: Context) => {
    const telegramId = ctx.from?.id?.toString();
    if (!telegramId) return;

    const wallet = walletService.getLinkedWallet(telegramId);
    if (!wallet) {
      await ctx.reply(
        '🔗 No wallet linked.\n\nRun /start to link your wallet and check your memberships.'
      );
      return;
    }

    const communities = db.prepare(
      'SELECT id, name, contract_address FROM communities ORDER BY name'
    ).all() as { id: string; name: string; contract_address: string }[];

    if (communities.length === 0) {
      await ctx.reply('No communities exist yet. Discover them at ' + frontendUrl + '/discover');
      return;
    }

    const lines: string[] = [`Wallet: \`${wallet.slice(0, 8)}…${wallet.slice(-6)}\`\n`];
    let hasAny = false;

    for (const c of communities) {
      try {
        const status = await chain.getMembershipStatus(c.contract_address, wallet);
        if (status.hasAccess) {
          hasAny = true;
          const expStr = status.expiresAt
            ? new Date(status.expiresAt).toLocaleDateString()
            : 'unknown';
          lines.push(`✅ *${c.name}* — active (expires ${expStr})`);
        } else if (status.isExpired) {
          hasAny = true;
          lines.push(
            `⚠️ *${c.name}* — expired\nRenew: ${frontendUrl}/join/${c.id}`
          );
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
