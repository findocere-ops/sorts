import { Router, Request, Response } from 'express';
import type { Database } from 'better-sqlite3';
import { WalletService } from '../../services/wallet/WalletService';

export function linkRouter(db: Database): Router {
  const walletService = new WalletService(db);
  const router: Router = Router();

  // POST /api/link/verify — verify signature and persist wallet↔Telegram link
  router.post('/verify', async (req: Request, res: Response) => {
    const { code, wallet, signature, tgId } = req.body;

    if (!code || !wallet || !signature) {
      return res.status(400).json({ success: false, error: 'code, wallet, and signature are required' });
    }

    const result = await walletService.verifyAndLink({ code, wallet, signature, telegramUserId: tgId });
    if (result.success) {
      res.json({ success: true });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  });

  return router;
}
