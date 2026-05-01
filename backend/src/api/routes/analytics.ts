import { Router, Request, Response } from 'express';
import { AnalyticsService } from '../../services/analytics';
import { ChainServiceFactory } from '../../services/chain/ChainServiceFactory';
import type { Database } from 'better-sqlite3';

export function analyticsRouter(db: Database): Router {
  const router = Router();
  const chain = ChainServiceFactory.forChain();
  const svc = new AnalyticsService(db, chain);

  // GET /api/analytics/community/:communityId
  // Returns aggregate stats only — never per-member data.
  router.get('/community/:communityId', async (req: Request, res: Response) => {
    try {
      const community = db.prepare(
        'SELECT contract_address FROM communities WHERE id = ?'
      ).get(req.params.communityId) as { contract_address: string } | undefined;

      if (!community) {
        return res.status(404).json({ success: false, error: 'Community not found' });
      }

      const stats = await svc.getCommunityStats(req.params.communityId, community.contract_address);
      res.json({ success: true, data: stats });
    } catch {
      res.status(500).json({ success: false, error: 'Failed to fetch stats' });
    }
  });

  // GET /api/analytics/dashboard/:wallet
  // Aggregate stats across all communities created by this wallet.
  router.get('/dashboard/:wallet', async (req: Request, res: Response) => {
    try {
      const stats = await svc.getDashboardStats(req.params.wallet);
      res.json({ success: true, data: stats });
    } catch {
      res.status(500).json({ success: false, error: 'Failed to fetch dashboard stats' });
    }
  });

  return router;
}
