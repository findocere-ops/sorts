import { Router, Request, Response } from 'express';
import type { IMultichainControlService, SupportedChain } from '@sorts/shared';

/** Day-6 /api/wallet — dWallet capability + status endpoints.
 *  Every response carries the pre-alpha disclosure so consumers cannot
 *  assume real-funds support. */
export function walletRouter(svc: IMultichainControlService): Router {
  const router = Router();

  router.get('/status', async (_req: Request, res: Response) => {
    try {
      const status = await svc.getStatus();
      res.json({ success: true, data: { ...status, disclosure: 'pre-alpha — not for real funds' } });
    } catch (err) {
      res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'failed' });
    }
  });

  router.get('/capabilities', async (_req: Request, res: Response) => {
    try {
      const caps = await svc.getCapabilities();
      res.json({ success: true, data: caps, disclosure: 'pre-alpha — not for real funds' });
    } catch (err) {
      res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'failed' });
    }
  });

  router.get('/gas/:chain', async (req: Request, res: Response) => {
    if (!svc.getGasStatus) {
      return res.status(501).json({ success: false, error: 'gas status not implemented' });
    }
    try {
      const data = await svc.getGasStatus(req.params.chain as SupportedChain);
      res.json({ success: true, data });
    } catch (err) {
      res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'failed' });
    }
  });

  return router;
}
