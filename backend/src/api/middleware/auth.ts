import type { NextFunction, Request, Response } from 'express';
import type { PrivyService, PrivyVerifiedIdentity } from '../../services/wallet/PrivyService';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      privyUser?: PrivyVerifiedIdentity;
    }
  }
}

/** Bearer-token auth middleware. Attaches `req.privyUser` on success.
 *  Returns 401 if missing/invalid; never logs the token. */
export function privyAuth(service: PrivyService) {
  return async function privyAuthMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
    const header = req.headers.authorization;
    if (!header) {
      res.status(401).json({ success: false, error: 'Missing Authorization header' });
      return;
    }
    const identity = await service.verifyBearerToken(header);
    if (!identity) {
      res.status(401).json({ success: false, error: 'Invalid or expired token' });
      return;
    }
    req.privyUser = identity;
    next();
  };
}

/** Returns 403 if `req.privyUser` does not own a wallet matching `walletField`
 *  in the request body. Use after `privyAuth` on routes that act on a
 *  specific wallet (e.g. POST /communities expects `creatorWallet`). */
export function requireWalletOwner(walletField: string) {
  return function requireWalletOwnerMiddleware(req: Request, res: Response, next: NextFunction): void {
    const user = req.privyUser;
    if (!user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }
    const claimed = (req.body as Record<string, unknown> | undefined)?.[walletField];
    if (typeof claimed !== 'string') {
      res.status(400).json({ success: false, error: `Body field '${walletField}' is required` });
      return;
    }
    const claimedLower = claimed.toLowerCase();
    const linked = user.linkedWallets.some(
      (w) => w.address.toLowerCase() === claimedLower,
    );
    if (!linked) {
      res.status(403).json({ success: false, error: 'Wallet not linked to authenticated identity' });
      return;
    }
    next();
  };
}
