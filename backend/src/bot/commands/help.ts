import { Context } from 'grammy';

export function helpHandler() {
  const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';

  return async (ctx: Context) => {
    await ctx.reply(
      '📖 *Sorts Bot*\n\n' +
      'Commands:\n\n' +
      '/start — Link your wallet to enable content delivery\n' +
      '/status — View your active and expired memberships\n' +
      '/content — Access gated posts from your communities\n' +
      '/subscribe — Browse communities to join\n' +
      '/help — This message\n\n' +
      `Web app: ${frontendUrl}\n\n` +
      '_Privacy: Your tier and wallet are cryptographically hidden. Not even community creators can see them._',
      { parse_mode: 'Markdown' }
    );
  };
}
