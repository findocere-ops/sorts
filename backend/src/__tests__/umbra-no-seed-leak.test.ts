/**
 * Day-4 privacy assertion: the Umbra/fallback service path MUST NOT print or
 * leak any seed, master key, ciphertext, signature, or other secret material.
 *
 * The fallback implementation never accepts secret material as an argument
 * and never instantiates a wallet, so the logs are guaranteed clean by
 * construction. Still, this test exercises the public method surface and
 * scans every emitted log line for known-secret token shapes.
 */

import { UmbraPrivacyService } from '../services/chain/UmbraPrivacyService';
import { SolanaService } from '../services/chain/SolanaService';
import type { SubscriberRef } from '@sorts/shared';

const ANY_PUBKEY = '11111111111111111111111111111112';
const ANY_WALLET = '11111111111111111111111111111113';
// 32-byte commitment encoded as base64 — fixed bytes, no derivation needed
// for the no-leak assertions (the byte content is irrelevant to log scanning).
const ANY_COMMITMENT_B64 = Buffer.alloc(32, 0x77).toString('base64');
const COMMITMENT_REF: SubscriberRef = { kind: 'commitment', commitmentBase64: ANY_COMMITMENT_B64 };
const WALLET_REF: SubscriberRef = { kind: 'wallet', wallet: ANY_WALLET };

const FORBIDDEN_TOKENS: RegExp[] = [
  /\bseed\s*[:=]\s*['"][^'"]+['"]/i,
  /\bmaster[_-]?seed\b/i,
  /\bsigning[_-]?key\b/i,
  /\bprivate[_-]?key\b/i,
  /\bsecret[_-]?bytes\b/i,
  /\bsignature[:=]\s*['"]?[A-Za-z0-9+/=]{32,}/i,
  /\bciphertext\b/i,
  /\bencrypted[_-]?balance[:=]\s*['"]?\d/i,
];

function captureConsole(): { logs: string[]; restore: () => void } {
  const logs: string[] = [];
  const orig = {
    log: console.log,
    info: console.info,
    warn: console.warn,
    error: console.error,
    debug: console.debug,
  };
  const sink = (...args: unknown[]) => {
    for (const a of args) {
      if (typeof a === 'string') logs.push(a);
      else logs.push(JSON.stringify(a));
    }
  };
  console.log = sink;
  console.info = sink;
  console.warn = sink;
  console.error = sink;
  console.debug = sink;
  return {
    logs,
    restore: () => {
      console.log = orig.log;
      console.info = orig.info;
      console.warn = orig.warn;
      console.error = orig.error;
      console.debug = orig.debug;
    },
  };
}

describe('UmbraPrivacyService — no-seed-leak', () => {
  let chain: SolanaService;
  let svc: UmbraPrivacyService;

  beforeEach(() => {
    chain = new SolanaService({ rpcUrl: 'https://invalid.local', programId: 'AEp6VuJqfctTRQpZP3LDjKcua4C1jGP8YT721AMSBkFV' });
    jest.spyOn(chain, 'checkAccessByCommitment').mockResolvedValue(false);
    jest.spyOn(chain, 'getMembershipStatusByCommitment').mockResolvedValue({
      hasAccess: false,
      isExpired: false,
      tierLevel: null,
      expiresAt: null,
      expiresInDays: null,
    });
    svc = new UmbraPrivacyService({ chain });
  });

  it('evaluateEntitlement returns {active, privacyMode, expiresAt?} only — no tier / commitment / salt', async () => {
    const result = await svc.evaluateEntitlement(ANY_PUBKEY, COMMITMENT_REF);
    // The privacy mode literal contains the word "commitment" by design
    // (e.g. `on-chain-commitment-fallback`), so strip that key before scanning.
    const scrubbed = JSON.stringify({ ...result, privacyMode: undefined });
    expect(scrubbed).not.toMatch(/\btier\b/i);
    expect(scrubbed).not.toMatch(/tier[_]?level/i);
    expect(scrubbed).not.toMatch(/\bcommitment\b/i);
    expect(scrubbed).not.toMatch(/\bsalt\b/i);
    // `expiresAt` is optional — only present when getMembershipStatus has one.
    const allowedKeys = new Set(['active', 'expiresAt', 'privacyMode']);
    for (const key of Object.keys(result)) {
      expect(allowedKeys.has(key)).toBe(true);
    }
    expect(Object.keys(result)).toEqual(expect.arrayContaining(['active', 'privacyMode']));
  });

  it('privacy mode is "on-chain-commitment-fallback" by default', async () => {
    const result = await svc.evaluateEntitlement(ANY_PUBKEY, COMMITMENT_REF);
    expect(result.privacyMode).toBe('on-chain-commitment-fallback');
  });

  it('produces no log lines containing seed/key/signature/ciphertext tokens', async () => {
    const cap = captureConsole();
    try {
      await svc.evaluateEntitlement(ANY_PUBKEY, COMMITMENT_REF);
      await svc.getRegistrationStatus(COMMITMENT_REF);
    } finally {
      cap.restore();
    }
    for (const line of cap.logs) {
      for (const re of FORBIDDEN_TOKENS) {
        expect(line).not.toMatch(re);
      }
    }
  });

  it('getRegistrationStatus is implicit-registered in fallback mode and exposes no token-shaped fields', async () => {
    const status = await svc.getRegistrationStatus(COMMITMENT_REF);
    expect(status.registered).toBe(true);
    expect(status.privacyMode).toBe('on-chain-commitment-fallback');
    expect(Object.keys(status).sort()).toEqual(['privacyMode', 'registered']);
  });

  it('rejects wallet-based evaluateEntitlement on Solana with a clear redirect (Tier 1.2 mitigation)', async () => {
    await expect(svc.evaluateEntitlement(ANY_PUBKEY, WALLET_REF)).rejects.toThrow(
      /not supported on Solana v2/,
    );
  });

  it('rejects malformed base64 commitment with a 400-class error message', async () => {
    const bad: SubscriberRef = { kind: 'commitment', commitmentBase64: 'not!base64!!' };
    await expect(svc.evaluateEntitlement(ANY_PUBKEY, bad)).rejects.toThrow(
      /must decode to exactly 32 bytes|not valid base64/,
    );
  });

  it('rejects wrong-length commitment payload', async () => {
    const tooShort: SubscriberRef = {
      kind: 'commitment',
      commitmentBase64: Buffer.alloc(31, 0x11).toString('base64'),
    };
    await expect(svc.evaluateEntitlement(ANY_PUBKEY, tooShort)).rejects.toThrow(
      /must decode to exactly 32 bytes/,
    );
  });

  it('retains the "Umbra" symbol so the future v2 swap is a one-line implementation change', () => {
    expect(UmbraPrivacyService.name).toBe('UmbraPrivacyService');
  });
});
