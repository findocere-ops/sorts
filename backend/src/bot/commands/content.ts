import { Context } from 'grammy';
import { WalletService } from '../../services/wallet/WalletService';
import { ChainServiceFactory } from '../../services/chain/ChainServiceFactory';
import type { IChainService } from '@sorts/shared';
import type { Database } from 'better-sqlite3';

/*
 * /content [communityId?]
 *
 * Input:    /content           → list accessible communities
 *           /content <id>      → list recent posts in that community
 * Lookup:   wallet_links → wallet, then communities in DB
 * Chain:    checkAccess(contractAddress, wallet) to verify membership
 * Success:  post titles and links (no full body in bot; deep link to web)
 * Failure:  no wallet → link prompt
 * Expiry:   explicit renewal message, no content leaked
 */
export function contentHandler(db: Database) {
  const walletService = new WalletService(db);
  const chain = ChainServiceFactory.forChain();
  const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';

  return async (ctx: Context) => {
    const telegramId = ctx.from?.id?.toString();
    if (!telegramId) return;

    const wallet = walletService.getLinkedWallet(telegramId);
    if (!wallet) {
      await ctx.reply(
        '🔗 No wallet linked.\n\nRun /start to link your wallet first.'
      );
      return;
    }

    // Parse optional community ID from command args
    const args = ctx.message?.text?.split(' ').slice(1) ?? [];
    const communityId = args[0]?.trim();

    if (communityId) {
      await handleCommunityContent(ctx, db, chain, wallet, communityId, frontendUrl);
    } else {
      await handleContentList(ctx, db, chain, wallet, frontendUrl);
    }
  };
}

async function handleContentList(
  ctx: Context,
  db: Database,
  chain: IChainService,
  wallet: string,
  frontendUrl: string,
) {
  const communities = db.prepare(
    'SELECT id, name, contract_address FROM communities ORDER BY name'
  ).all() as { id: string; name: string; contract_address: string }[];

  const accessible: string[] = [];

  for (const c of communities) {
    try {
      const hasAccess = await chain.checkAccess(c.contract_address, wallet, 1);
      if (hasAccess) {
        accessible.push(`• *${c.name}* — /content ${c.id}`);
      }
    } catch {
      // Skip
    }
  }

  if (accessible.length === 0) {
    await ctx.reply(
      'No active memberships found.\n\nDiscover and subscribe at ' + frontendUrl + '/discover'
    );
    return;
  }

  await ctx.reply(
    'Your communities:\n\n' + accessible.join('\n') + '\n\nTap a command to view recent posts.',
    { parse_mode: 'Markdown' }
  );
}

async function handleCommunityContent(
  ctx: Context,
  db: Database,
  chain: IChainService,
  wallet: string,
  communityId: string,
  frontendUrl: string,
) {
  const community = db.prepare(
    'SELECT id, name, contract_address FROM communities WHERE id = ?'
  ).get(communityId) as { id: string; name: string; contract_address: string } | undefined;

  if (!community) {
    await ctx.reply('Community not found. Check the ID and try again.');
    return;
  }

  // Chain access check — always authoritative
  let hasAccess = false;
  let isExpired = false;
  try {
    const status = await chain.getMembershipStatus(community.contract_address, wallet);
    hasAccess = status.hasAccess;
    isExpired = status.isExpired;
  } catch {
    await ctx.reply('Unable to verify membership. The network may be unavailable. Try again shortly.');
    return;
  }

  if (isExpired) {
    await ctx.reply(
      `⚠️ Your membership in *${community.name}* has expired.\n\n` +
      `Renew to restore access: ${frontendUrl}/join/${community.id}`,
      { parse_mode: 'Markdown' }
    );
    return;
  }

  if (!hasAccess) {
    await ctx.reply(
      `🔒 You don't have access to *${community.name}*.\n\nSubscribe at: ${frontendUrl}/join/${community.id}`,
      { parse_mode: 'Markdown' }
    );
    return;
  }

  // Fetch recent posts — body is NOT sent via Telegram; members click through
  const posts = db.prepare(`
    SELECT id, title, tier_required, created_at
    FROM content
    WHERE community_id = ? AND published = 1
    ORDER BY pinned DESC, created_at DESC
    LIMIT 5
  `).all(communityId) as { id: string; title: string; tier_required: number; created_at: string }[];

  if (posts.length === 0) {
    await ctx.reply(`No posts yet in *${community.name}*.`, { parse_mode: 'Markdown' });
    return;
  }

  const lines = [
    `*${community.name}* — recent posts:\n`,
    ...posts.map(p => `• ${p.title}\n  ${frontendUrl}/community/${communityId}`),
    `\nView all: ${frontendUrl}/community/${communityId}`,
  ];

  await ctx.reply(lines.join('\n'), { parse_mode: 'Markdown' });
}
