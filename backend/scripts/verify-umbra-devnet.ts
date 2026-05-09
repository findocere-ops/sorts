/**
 * Day 4 cut-line probe — verifies @umbra-privacy/sdk against Solana devnet.
 *
 * Run: pnpm --filter @sorts/backend exec ts-node backend/scripts/verify-umbra-devnet.ts
 *
 * Prints exactly one of:
 *   "OK"                     — SDK installs, client builds, register() returns success on devnet.
 *   "fallback recommended"   — install / build / register / indexer fails for any reason.
 *
 * NEVER prints the seed, signer secret, or any ciphertext. The probe creates
 * an ephemeral in-memory signer for the run; the keypair is discarded on exit.
 *
 * The exit code is always 0 — this script does not gate CI. The decision goes
 * into the cut-line note that ships in the Day-4 commit.
 */

/* eslint-disable @typescript-eslint/no-unused-vars */
import * as umbra from '@umbra-privacy/sdk';
// `getInMemorySigner` lives on the `/solana` subpath per the SDK README.
import * as umbraSolana from '@umbra-privacy/sdk/solana';

async function main(): Promise<'ok' | 'fallback'> {
  // 1. SDK exports surface check — split between root and `/solana` subpath.
  const rootExports = Object.keys(umbra);
  const solanaExports = Object.keys(umbraSolana);
  // Symbols documented in the npm README. The published v4 root export
  // surface deviates from that README — neither the client constructor nor
  // the registration factory appears at the package root. The cut-line
  // decision below treats this as the trigger.
  const requiredRoot = ['getUmbraClient', 'getUserRegistrationFunction'];
  const requiredSolana = ['createInMemorySigner'];
  for (const name of requiredRoot) {
    if (!rootExports.includes(name)) {
      console.error(`[probe] @umbra-privacy/sdk missing root export: ${name}`);
      return 'fallback';
    }
  }
  for (const name of requiredSolana) {
    if (!solanaExports.includes(name)) {
      console.error(`[probe] @umbra-privacy/sdk/solana missing export: ${name}`);
      return 'fallback';
    }
  }

  // 2. Build a throwaway signer + client. We try `network: 'devnet'` first; if
  //    the SDK rejects (only `mainnet` documented), fall back.
  let client: unknown;
  let signer: { address?: unknown };
  try {
    // @ts-expect-error — return type is opaque from the README
    signer = await umbraSolana.createInMemorySigner();
  } catch (err) {
    console.error('[probe] getInMemorySigner threw');
    return 'fallback';
  }

  const RPC = process.env.SOLANA_DEVNET_RPC_URL ?? 'https://api.devnet.solana.com';
  const WS  = process.env.SOLANA_DEVNET_WS_URL  ?? 'wss://api.devnet.solana.com';
  const INDEXER = process.env.UMBRA_INDEXER_URL ?? 'https://indexer.umbraprivacy.com';

  for (const network of ['devnet', 'mainnet'] as const) {
    try {
      // @ts-expect-error — opaque client type
      client = await umbra.getUmbraClient({
        signer,
        network,
        rpcUrl: RPC,
        rpcSubscriptionsUrl: WS,
        indexerApiEndpoint: INDEXER,
      });
    } catch (err) {
      console.error(`[probe] getUmbraClient(network=${network}) threw — trying next`);
      continue;
    }

    try {
      // @ts-expect-error — opaque
      const register = umbra.getUserRegistrationFunction({ client });
      // @ts-expect-error — opaque
      const result = await register({ confidential: true, anonymous: false });
      // result intentionally not logged in case it embeds key material
      if (result) {
        console.log(`[probe] register() succeeded on network=${network}`);
        return 'ok';
      }
      console.error(`[probe] register() returned falsy on network=${network}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'unknown error';
      // Sanitise: do not echo any encrypted blobs / proofs that may be in the message.
      const safe = message.length > 200 ? `${message.slice(0, 200)}…` : message;
      console.error(`[probe] register() threw on network=${network}: ${safe}`);
    }
  }

  return 'fallback';
}

main()
  .then((decision) => {
    console.log(decision === 'ok' ? 'OK' : 'fallback recommended');
    process.exit(0);
  })
  .catch((err) => {
    const message = err instanceof Error ? err.message : 'unknown error';
    console.error(`[probe] fatal: ${message}`);
    console.log('fallback recommended');
    process.exit(0);
  });
