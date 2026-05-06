import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Bot } from 'grammy';
import { openDb, runMigrations } from './db/schema';
import { communityRouter } from './api/routes/community';
import { analyticsRouter } from './api/routes/analytics';
import { contentRouter } from './api/routes/content';
import { linkRouter } from './api/routes/link';
import { privacyRouter } from './api/routes/privacy';
import { walletRouter } from './api/routes/wallet';
import { apiRateLimit } from './api/middleware/rate-limit';
import { PrivyService } from './services/wallet/PrivyService';
import { UmbraPrivacyService } from './services/chain/UmbraPrivacyService';
import { IkaDWalletService } from './services/wallet/IkaDWalletService';
import { startHandler } from './bot/commands/start';
import { statusHandler } from './bot/commands/status';
import { contentHandler } from './bot/commands/content';
import { subscribeHandler } from './bot/commands/subscribe';
import { helpHandler } from './bot/commands/help';
import { loadEnv } from './config/env';

dotenv.config();

const env = loadEnv();
const PORT = env.PORT;
const FRONTEND_URL = env.FRONTEND_URL;

// ── Database ──────────────────────────────────────────────────────────────────
const db = openDb();
runMigrations(db);
console.log('[db] Migrations complete');

// ── Privy server-auth (optional — only mounted when configured) ────────────
const privyService =
  env.PRIVY_APP_ID && env.PRIVY_APP_SECRET
    ? new PrivyService(env.PRIVY_APP_ID, env.PRIVY_APP_SECRET)
    : null;
if (!privyService) {
  console.warn('[auth] PRIVY_APP_ID / PRIVY_APP_SECRET not set — auth middleware disabled');
}

// ── Express API ───────────────────────────────────────────────────────────────
const app = express();
app.use(cors({ origin: FRONTEND_URL }));
app.use(express.json());
app.use(apiRateLimit);

app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));
// Day-4 privacy compute service. Cut-line fallback: derives entitlement from
// the on-chain Subscription PDA's commitment (UmbraPrivacyService keeps the
// "Umbra" symbol so the v2 swap is a one-line change).
const privacyService = new UmbraPrivacyService();

app.use('/api/communities', communityRouter(db, { privyService }));
app.use('/api/content', contentRouter(db, { privyService }));
app.use('/api/link', linkRouter(db));
app.use('/api/analytics', analyticsRouter(db));
app.use('/api/privacy', privacyRouter(privacyService));
app.use('/api/wallet', walletRouter(new IkaDWalletService()));

app.listen(PORT, () => console.log(`[api] Sorts backend running on :${PORT}`));

// ── Telegram Bot ──────────────────────────────────────────────────────────────
const BOT_TOKEN = env.TELEGRAM_BOT_TOKEN;
if (BOT_TOKEN) {
  const bot = new Bot(BOT_TOKEN);

  bot.command('start',     startHandler(db));
  bot.command('status',    statusHandler(db));
  bot.command('content',   contentHandler(db));
  bot.command('subscribe', subscribeHandler());
  bot.command('help',      helpHandler());

  // Graceful error handling — never crash on a user message
  bot.catch((err) => {
    console.error('[bot] Unhandled error:', err.message);
  });

  bot.start();
  console.log('[bot] Telegram bot started');
} else {
  console.warn('[bot] TELEGRAM_BOT_TOKEN not set — bot disabled');
}
