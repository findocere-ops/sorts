import { Context } from 'grammy';
import { WalletService } from '../../services/wallet/WalletService';
import type { Database } from 'better-sqlite3';

export function startHandler(db: Database) {
  const walletService = new WalletService(db);

  return async (ctx: Context) => {
    const telegramId = ctx.from?.id?.toString();
    if (!telegramId) return;

    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';

    if (walletService.isLinked(telegramId)) {
      await ctx.reply(
        '✅ Your wallet is linked.\n\n' +
        'Commands:\n' +
        '/status — View membership status\n' +
        '/content — Access gated content\n' +
        '/subscribe — Browse communities\n' +
        '/help — All commands'
      );
      return;
    }

    const code = walletService.createChallenge(telegramId);
    const linkUrl = `${frontendUrl}/link?code=${code}&tg=${telegramId}`;

    await ctx.reply(
      '👋 Welcome to Sorts.\n\n' +
      'Sorts is a private community platform. Your membership tier and wallet address are cryptographically hidden from community creators.\n\n' +
      `🔗 Link your wallet:\n${linkUrl}\n\n` +
      '_This link expires in 10 minutes. Run /start again to generate a new one._'
    );
  };
}
