import { Router, Request, Response } from 'express';
import type { IPrivacyComputeService, SubscriberRef } from '@sorts/shared';

/** Privacy router. Wraps the IPrivacyComputeService and serves:
 *
 *    GET /api/privacy/status?subscriber=<base58>            (legacy / EVM)
 *    GET /api/privacy/status?commitment=<base64>            (v2 / Solana)
 *    GET /api/privacy/entitlement?community=<base58>&subscriber=<base58>
 *    GET /api/privacy/entitlement?community=<base58>&commitment=<base64>
 *
 *  Both `subscriber` (wallet) and `commitment` (32-byte commitment, base64)
 *  identifiers are accepted at the route layer. The downstream
 *  IPrivacyComputeService decides which path is supported per chain — Solana
 *  v2 rejects `subscriber` and routes only `commitment` (subscriber privacy
 *  invariant Tier 1.2). Legacy Arbitrum still accepts `subscriber`.
 *
 *  Responses obey the PrivacyComputeService contract — they NEVER carry a
 *  tier, commitment, salt, or member count. */
export function privacyRouter(svc: IPrivacyComputeService): Router {
  const router = Router();

  router.get('/status', async (req: Request, res: Response) => {
    const ref = parseSubscriberRef(req);
    if (!ref) {
      return res.status(400).json({
        success: false,
        error: 'one of `subscriber` (wallet) or `commitment` (base64) query params is required',
      });
    }
    try {
      const data = await svc.getRegistrationStatus(ref);
      res.json({ success: true, data });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'failed';
      res.status(privacyErrorStatus(err)).json({ success: false, error: message });
    }
  });

  router.get('/entitlement', async (req: Request, res: Response) => {
    const community = typeof req.query.community === 'string' ? req.query.community : null;
    const ref = parseSubscriberRef(req);
    if (!community || !ref) {
      return res.status(400).json({
        success: false,
        error: 'community query is required, plus one of `subscriber` (wallet) or `commitment` (base64)',
      });
    }
    try {
      const data = await svc.evaluateEntitlement(community, ref);
      res.json({ success: true, data });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'failed';
      res.status(privacyErrorStatus(err)).json({ success: false, error: message });
    }
  });

  return router;
}

function parseSubscriberRef(req: Request): SubscriberRef | null {
  // Prefer commitment when both are present — it is the privacy-preserving
  // identifier on Solana v2 and downstream services may reject the wallet path.
  const commitment =
    typeof req.query.commitment === 'string' ? req.query.commitment : null;
  if (commitment) return { kind: 'commitment', commitmentBase64: commitment };

  const wallet = typeof req.query.subscriber === 'string' ? req.query.subscriber : null;
  if (wallet) return { kind: 'wallet', wallet };

  return null;
}

/** Map common service errors to HTTP statuses. Validation/format failures are
 *  client errors (400); everything else maps to 500. */
function privacyErrorStatus(err: unknown): number {
  if (!(err instanceof Error)) return 500;
  const m = err.message.toLowerCase();
  if (
    m.includes('not supported on solana') ||
    m.includes('must decode to exactly 32 bytes') ||
    m.includes('not valid base64')
  ) {
    return 400;
  }
  return 500;
}
