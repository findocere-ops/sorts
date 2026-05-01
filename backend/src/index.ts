import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Bot } from 'grammy';
import { openDb, runMigrations } from './db/schema';
import { communityRouter } from './api/routes/community';
import { analyticsRouter } from './api/routes/analytics';
import { contentRouter } from './api/routes/content';
import { linkRouter } from './api/routes/link';
import { startHandler } from './bot/commands/start';
import { statusHandler } from './bot/commands/status';
import { contentHandler } from './bot/commands/content';
import { subscribeHandler } from './bot/commands/subscribe';
import { helpHandler } from './bot/commands/help';

dotenv.config();

const PORT = parseInt(process.env.PORT ?? '3001', 10);
const FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://localhost:3000';

// ── Database ──────────────────────────────────────────────────────────────────
const db = openDb();
runMigrations(db);
console.log('[db] Migrations complete');

// ── Express API ───────────────────────────────────────────────────────────────
const app = express();
app.use(cors({ origin: FRONTEND_URL }));
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));
app.use('/api/communities', communityRouter(db));
app.use('/api/content', contentRouter(db));
app.use('/api/link', linkRouter(db));
app.use('/api/analytics', analyticsRouter(db));

app.listen(PORT, () => console.log(`[api] Sorts backend running on :${PORT}`));

// ── Telegram Bot ──────────────────────────────────────────────────────────────
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
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
