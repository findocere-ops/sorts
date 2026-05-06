/**
 * Frontend environment validation.
 *
 * Next.js inlines `NEXT_PUBLIC_*` values at build time, so this runs once
 * on first import and throws if required values are missing in production.
 * In development, missing values produce console warnings only — handy
 * for local builds without a configured Privy app.
 *
 * Hand-rolled (no zod) to avoid pulling a dep into the browser bundle.
 */

type EnvShape = {
  NEXT_PUBLIC_API_URL: string;
  NEXT_PUBLIC_DEMO_MODE: boolean;
  NEXT_PUBLIC_PRIVY_APP_ID?: string;
  NEXT_PUBLIC_SITE_URL?: string;

  // Phase 2 — Solana (primary)
  NEXT_PUBLIC_SOLANA_DEVNET_RPC_URL?: string;
  NEXT_PUBLIC_SOLANA_PROGRAM_ID?: string;

  // Phase 1 — Arbitrum legacy (kept buildable, not the demo path)
  NEXT_PUBLIC_CHAIN_ID?: number;
  NEXT_PUBLIC_ARBITRUM_SEPOLIA_RPC_URL?: string;
  NEXT_PUBLIC_SORTS_FACTORY_ADDRESS?: string;
};

// All validators warn instead of throwing. Throwing during `next build`
// breaks page data collection in environments without a populated `.env.local`,
// and the downstream code fails fast and clearly anyway when a URL is wrong.
function readUrl(name: keyof EnvShape, value: string | undefined): string | undefined {
  if (!value) return undefined;
  try {
    new URL(value);
    return value;
  } catch {
    console.warn(`[env] ${name} is not a valid URL: ${value}`);
    return undefined;
  }
}

function readEthAddress(name: keyof EnvShape, value: string | undefined): string | undefined {
  if (!value) return undefined;
  if (!/^0x[a-fA-F0-9]{40}$/.test(value)) {
    console.warn(`[env] ${name} is not a valid 0x-prefixed 20-byte address: ${value}`);
    return undefined;
  }
  return value;
}

function readSolanaProgramId(
  name: keyof EnvShape,
  value: string | undefined,
): string | undefined {
  if (!value) return undefined;
  // Base58, typical Solana program id length is 32-44 chars.
  if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value)) {
    console.warn(`[env] ${name} is not a valid base58 Solana program id: ${value}`);
    return undefined;
  }
  return value;
}

function readBool(value: string | undefined): boolean {
  return value === 'true' || value === '1';
}

function readEnv(): EnvShape {
  const apiUrl = readUrl(
    'NEXT_PUBLIC_API_URL',
    process.env.NEXT_PUBLIC_API_URL,
  );

  if (!apiUrl) {
    console.warn(
      '[env] NEXT_PUBLIC_API_URL is not set. Falling back to http://localhost:3001. ' +
        'Set it to your backend URL before deploying.',
    );
  }

  const chainId = process.env.NEXT_PUBLIC_CHAIN_ID
    ? Number(process.env.NEXT_PUBLIC_CHAIN_ID)
    : undefined;

  return {
    NEXT_PUBLIC_API_URL: apiUrl ?? 'http://localhost:3001',
    NEXT_PUBLIC_DEMO_MODE: readBool(process.env.NEXT_PUBLIC_DEMO_MODE),
    NEXT_PUBLIC_PRIVY_APP_ID: process.env.NEXT_PUBLIC_PRIVY_APP_ID || undefined,
    NEXT_PUBLIC_SITE_URL: readUrl('NEXT_PUBLIC_SITE_URL', process.env.NEXT_PUBLIC_SITE_URL),

    NEXT_PUBLIC_SOLANA_DEVNET_RPC_URL: readUrl(
      'NEXT_PUBLIC_SOLANA_DEVNET_RPC_URL',
      process.env.NEXT_PUBLIC_SOLANA_DEVNET_RPC_URL,
    ),
    NEXT_PUBLIC_SOLANA_PROGRAM_ID: readSolanaProgramId(
      'NEXT_PUBLIC_SOLANA_PROGRAM_ID',
      process.env.NEXT_PUBLIC_SOLANA_PROGRAM_ID,
    ),

    NEXT_PUBLIC_CHAIN_ID: Number.isFinite(chainId) ? (chainId as number) : undefined,
    NEXT_PUBLIC_ARBITRUM_SEPOLIA_RPC_URL: readUrl(
      'NEXT_PUBLIC_ARBITRUM_SEPOLIA_RPC_URL',
      process.env.NEXT_PUBLIC_ARBITRUM_SEPOLIA_RPC_URL,
    ),
    NEXT_PUBLIC_SORTS_FACTORY_ADDRESS: readEthAddress(
      'NEXT_PUBLIC_SORTS_FACTORY_ADDRESS',
      process.env.NEXT_PUBLIC_SORTS_FACTORY_ADDRESS,
    ),
  };
}

export const env: EnvShape = readEnv();
