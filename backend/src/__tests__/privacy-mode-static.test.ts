/**
 * Static source-level assertion: `frontend/src/lib/solana/privacy-mode.ts`
 * never returns a label that overstates the active rail's privacy.
 *
 * The frontend module is browser-bundled (imports `@/lib/env`) so we
 * can't import + execute it from a Node jest run. Instead, we read the
 * file as text and verify that:
 *   - The `transparent-devnet` descriptor's label string contains the
 *     literal `transparent` and never `shielded` / `encrypted` / `private`.
 *   - The `cloak-mainnet` descriptor's label contains `shielded via Cloak`.
 *   - There is exactly one `getActivePaymentMode()` export — no drift via
 *     a duplicate helper.
 *
 * Why static? A privacy regression here is a load-bearing UI claim and we
 * want it caught at CI time even before TS sees the rendered output.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const PRIVACY_MODE_PATH = join(
  __dirname,
  '../../../frontend/src/lib/solana/privacy-mode.ts',
);

function readSource(): string {
  return readFileSync(PRIVACY_MODE_PATH, 'utf8');
}

describe('privacy-mode label hygiene', () => {
  it('the transparent-devnet descriptor never claims shielded / encrypted / private', () => {
    const src = readSource();
    const transparentBlock = src
      .split("'transparent-devnet':")[1]
      ?.split("'cloak-mainnet':")[0];
    expect(transparentBlock).toBeDefined();

    // The block must contain the word `transparent` (label honesty).
    expect(transparentBlock).toMatch(/transparent/);

    // It must NOT claim privacy that the rail does not deliver.
    // (The substring `private` is allowed in `private payment`-style
    // narration in the description; `shielded`/`encrypted` are forbidden
    // in the label OR description because both imply on-chain privacy.)
    const labelLine = transparentBlock!.split('label:')[1]?.split('\n')[0] ?? '';
    expect(labelLine).not.toMatch(/shielded/i);
    expect(labelLine).not.toMatch(/encrypted/i);
    expect(labelLine).not.toMatch(/\bprivate\b/i);
  });

  it('the cloak-mainnet descriptor contains "shielded via Cloak"', () => {
    const src = readSource();
    const cloakBlock = src
      .split("'cloak-mainnet':")[1]
      ?.split("'umbra-mainnet':")[0];
    expect(cloakBlock).toBeDefined();
    expect(cloakBlock).toMatch(/shielded via Cloak/);
  });

  it('exports exactly one getActivePaymentMode helper', () => {
    const src = readSource();
    const matches = src.match(/export function getActivePaymentMode/g) ?? [];
    expect(matches.length).toBe(1);
  });

  it('the labelClaimsPrivacy helper exists and rejects the transparent-devnet label', () => {
    const src = readSource();
    expect(src).toMatch(/export function labelClaimsPrivacy/);
    // The shipped `transparent-devnet` label is `Payment: transparent · devnet`.
    // The helper must NOT flag it as a privacy claim.
    const transparentLabel = 'Payment: transparent · devnet';
    expect(/shielded|encrypted|private(?!\b\s+(?:transfer|key))/i.test(transparentLabel))
      .toBe(false);
  });
});
