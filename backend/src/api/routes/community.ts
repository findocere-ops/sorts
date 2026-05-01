import { Router, Request, Response } from 'express';
import type { Database } from 'better-sqlite3';
import { CommunityService, CreateCommunitySchema } from '../../services/community';

export function communityRouter(db: Database): Router {
  const router = Router();
  const svc = new CommunityService(db);

  // GET /api/communities[?category=alpha]
  router.get('/', (req: Request, res: Response) => {
    try {
      const category = req.query.category as string | undefined;
      const communities = svc.list(category);
      res.json({ success: true, data: communities });
    } catch {
      res.status(500).json({ success: false, error: 'Failed to fetch communities' });
    }
  });

  // GET /api/communities/creator/:wallet — must come before /:id
  router.get('/creator/:wallet', (req: Request, res: Response) => {
    try {
      const communities = svc.getByCreator(req.params.wallet);
      res.json({ success: true, data: communities });
    } catch {
      res.status(500).json({ success: false, error: 'Failed to fetch creator communities' });
    }
  });

  // GET /api/communities/:id
  router.get('/:id', (req: Request, res: Response) => {
    try {
      const community = svc.getById(req.params.id);
      if (!community) return res.status(404).json({ success: false, error: 'Community not found' });
      res.json({ success: true, data: community });
    } catch {
      res.status(500).json({ success: false, error: 'Failed to fetch community' });
    }
  });

  // POST /api/communities — called by frontend after successful on-chain deployment
  router.post('/', (req: Request, res: Response) => {
    const parsed = CreateCommunitySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.flatten() });
    }
    try {
      const id = svc.create(parsed.data);
      res.status(201).json({ success: true, data: { id } });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create community';
      res.status(500).json({ success: false, error: message });
    }
  });

  return router;
}
