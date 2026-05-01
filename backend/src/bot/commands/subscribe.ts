import { Context } from 'grammy';

/*
 * /subscribe
 *
 * Input:    /subscribe
 * Lookup:   none (subscription happens on-chain via web app)
 * Chain:    none (bot cannot initiate on-chain transactions)
 * Success:  discovery link
 * Failure:  n/a
 *
 * Note: On-chain subscriptions require wallet signing. The bot directs
 * users to the web app where they can connect their wallet and sign.
 */
export function subscribeHandler() {
  const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';

  return async (ctx: Context) => {
    await ctx.reply(
      '🔍 Browse and subscribe to communities:\n' +
      `${frontendUrl}/discover\n\n` +
      'Subscriptions require your wallet signature and happen on-chain. Sorts cannot sign on your behalf — that\'s how privacy is guaranteed.'
    );
  };
}
