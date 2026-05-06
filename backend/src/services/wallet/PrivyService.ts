import { PrivyClient } from '@privy-io/server-auth';

export interface PrivyVerifiedIdentity {
  privyUserId: string;
  linkedWallets: { chain: 'evm' | 'solana'; address: string }[];
  email?: string;
}

/**
 * PrivyService — server-side bearer-token verification.
 *
 * Wraps the upstream `@privy-io/server-auth` client and projects results onto
 * our app-specific `PrivyVerifiedIdentity` shape. The wrapper exists so we can
 * audit two things in one place:
 *   1. We never leak the raw token, claims object, or app secret beyond this
 *      file (no logs, no error messages, no return values).
 *   2. We never store a wallet ↔ Telegram link inside Privy — Privy is used
 *      only for Web3 identity / SIWE-style auth.
 */
export class PrivyService {
  private client: PrivyClient;
  private appId: string;

  constructor(appId: string, appSecret: string) {
    if (!appId || !appSecret) {
      throw new Error('PrivyService requires both appId and appSecret');
    }
    this.appId = appId;
    this.client = new PrivyClient(appId, appSecret);
  }

  /** Verify a bearer token and return the linked identity, or null on failure. */
  async verifyBearerToken(token: string): Promise<PrivyVerifiedIdentity | null> {
    if (!token || typeof token !== 'string') return null;
    const trimmed = token.startsWith('Bearer ') ? token.slice('Bearer '.length).trim() : token.trim();
    if (!trimmed) return null;

    let claims: { userId: string };
    try {
      claims = (await this.client.verifyAuthToken(trimmed)) as { userId: string };
    } catch {
      // Invalid signature, expired, wrong issuer, etc. — opaque failure on purpose.
      return null;
    }
    if (!claims?.userId) return null;

    let user;
    try {
      user = await this.client.getUserById(claims.userId);
    } catch {
      // Token verified but user lookup failed — treat as unauthenticated.
      return null;
    }
    if (!user) return null;

    const linkedWallets: PrivyVerifiedIdentity['linkedWallets'] = [];
    for (const account of user.linkedAccounts ?? []) {
      if (account.type === 'wallet') {
        const w = account as { type: 'wallet'; address?: string; chainType?: string };
        if (!w.address) continue;
        const chain: 'evm' | 'solana' = w.chainType === 'solana' ? 'solana' : 'evm';
        linkedWallets.push({ chain, address: w.address });
      }
    }

    let email: string | undefined;
    for (const account of user.linkedAccounts ?? []) {
      if (account.type === 'email') {
        email = (account as { type: 'email'; address?: string }).address;
        break;
      }
    }

    return {
      privyUserId: claims.userId,
      linkedWallets,
      email,
    };
  }

  /** App id exposed only for telemetry / health probes — never the secret. */
  getAppId(): string {
    return this.appId;
  }
}
