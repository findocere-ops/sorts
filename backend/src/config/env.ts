import { z } from 'zod';

/**
 * Single source of truth for backend environment configuration.
 *
 * Validation runs once at startup. Failures throw before the HTTP server
 * binds, so a misconfigured deployment fails fast rather than serving
 * 500s on every request.
 *
 * Optional Phase-2 fields stay optional until the corresponding service
 * lands; their absence does not crash the server.
 */
const EnvSchema = z.object({
  // Runtime
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3001),
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),
  DATABASE_PATH: z.string().min(1).default('./data/sorts.db'),
  // Day 7: managed Postgres URL. When set, the DAL switches to the pg
  // driver via `selectDriver()`. Production deploys MUST set this.
  DATABASE_URL: z.string().url().optional(),

  // Phase 1 — Arbitrum legacy adapter (kept buildable)
  ARBITRUM_SEPOLIA_RPC_URL: z.string().url().optional(),
  SORTS_FACTORY_ADDRESS: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/u, 'must be a 0x-prefixed 20-byte hex address')
    .optional(),

  // Phase 2 — Solana primary chain
  SOLANA_DEVNET_RPC_URL: z.string().url().optional(),
  SOLANA_PROGRAM_ID: z
    .string()
    .min(32, 'must be a base58 program id')
    .max(64, 'must be a base58 program id')
    .optional(),

  // Phase 2 — Privy server-side identity verification
  PRIVY_APP_ID: z.string().min(1).optional(),
  PRIVY_APP_SECRET: z.string().min(1).optional(),

  // Phase 2 — Umbra Privacy SDK
  UMBRA_NETWORK: z.enum(['solana-devnet', 'solana-mainnet']).default('solana-devnet'),
  UMBRA_INDEXER_URL: z.string().url().optional(),

  // Phase 2 — IKA dWallet pre-alpha
  IKA_API_URL: z.string().url().optional(),

  // Telegram
  TELEGRAM_BOT_TOKEN: z.string().min(1).optional(),

  // iExec DataProtector (optional content protection)
  IEXEC_PRIVATE_KEY: z.string().optional(),
  IEXEC_SORTS_IAPP_ADDRESS: z.string().optional(),

  // Feature flags — default conservative
  ENABLE_SOLANA_PHASE2: z.coerce.boolean().default(true),
  ENABLE_UMBRA_ENCRYPTED_BALANCES: z.coerce.boolean().default(false),
  ENABLE_UMBRA_MIXER: z.coerce.boolean().default(false),
  ENABLE_IKA_DWALLET: z.coerce.boolean().default(false),
  ENABLE_IKA_REAL_FUNDS: z.coerce.boolean().default(false),
  ENABLE_REAL_FHE: z.coerce.boolean().default(false),
  ENABLE_REAL_MPC_SIGNING: z.coerce.boolean().default(false),

  // Tier 1.3 — Cloak private payment rail. Default false because Cloak's
  // program is mainnet-only; flipping to true on a devnet build would have
  // no effect (no Cloak program at the address). Backend reads this flag
  // mainly to decide whether the (planned-v2) cron verifier should poll for
  // recorded sigs and validate them against Cloak's mainnet program.
  ENABLE_CLOAK_MAINNET: z.coerce.boolean().default(false),
}).superRefine((env, ctx) => {
  // Production must use managed Postgres; SQLite is local-dev only.
  if (env.NODE_ENV === 'production' && !env.DATABASE_URL) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['DATABASE_URL'],
      message: 'DATABASE_URL is required when NODE_ENV=production',
    });
  }
});

export type Env = z.infer<typeof EnvSchema>;

let cachedEnv: Env | null = null;

export function loadEnv(): Env {
  if (cachedEnv) return cachedEnv;

  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('\n');
    throw new Error(
      `Invalid backend environment configuration:\n${issues}\n` +
        'Copy backend/.env.example to backend/.env and fill the required values.',
    );
  }

  cachedEnv = parsed.data;

  // Operator visibility for silent fallbacks
  if (!cachedEnv.TELEGRAM_BOT_TOKEN) {
    console.warn('[env] TELEGRAM_BOT_TOKEN not set — Telegram bot will be disabled.');
  }
  if (cachedEnv.NODE_ENV === 'production' && !cachedEnv.PRIVY_APP_ID) {
    console.warn(
      '[env] PRIVY_APP_ID not set in production — protected routes cannot verify identity.',
    );
  }
  if (
    cachedEnv.ENABLE_IKA_REAL_FUNDS ||
    cachedEnv.ENABLE_REAL_FHE ||
    cachedEnv.ENABLE_REAL_MPC_SIGNING
  ) {
    console.warn(
      '[env] A "real-funds" or "real-crypto-primitive" feature flag is enabled. ' +
        'This is not the safe default — confirm this is intended.',
    );
  }
  if (cachedEnv.ENABLE_CLOAK_MAINNET) {
    console.warn(
      "[env] ENABLE_CLOAK_MAINNET=true — Cloak private payment rail is active. " +
        "Cloak's program is mainnet-only, so this flag has no effect on devnet builds. " +
        'On mainnet, ensure a backend cron verifier is running before accepting subscribes ' +
        '(see docs/SUBMISSION_RISKS.md "Cloak cron verifier").',
    );
  }

  return cachedEnv;
}
