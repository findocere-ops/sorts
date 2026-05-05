import { Router, Request, Response } from 'express';
import type { IPrivacyComputeService } from '@sorts/shared';

/** Day-4 privacy router. Wraps the IPrivacyComputeService and serves:
 *
 *    GET /api/privacy/status?subscriber=<base58>
 *    GET /api/privacy/entitlement?community=<base58>&subscriber=<base58>
 *
 *  Both responses obey the PrivacyComputeService contract — they NEVER carry
 *  a tier, commitment, salt, or member count. */
export function privacyRouter(svc: IPrivacyComputeService): Router {
  const router = Router();

  router.get('/status', async (req: Request, res: Response) => {
    const subscriber = typeof req.query.subscriber === 'string' ? req.query.subscriber : null;
    if (!subscriber) {
      return res.status(400).json({ success: false, error: 'subscriber query is required' });
    }
    try {
      const data = await svc.getRegistrationStatus(subscriber);
      res.json({ success: true, data });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'failed';
      res.status(500).json({ success: false, error: message });
    }
  });

  router.get('/entitlement', async (req: Request, res: Response) => {
    const community = typeof req.query.community === 'string' ? req.query.community : null;
    const subscriber = typeof req.query.subscriber === 'string' ? req.query.subscriber : null;
    if (!community || !subscriber) {
      return res.status(400).json({ success: false, error: 'community and subscriber queries are required' });
    }
    try {
      const data = await svc.evaluateEntitlement(community, subscriber);
      res.json({ success: true, data });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'failed';
      res.status(500).json({ success: false, error: message });
    }
  });

  return router;
}
