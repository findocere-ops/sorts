import type { NextFunction, Request, Response } from 'express';
import {
  PREVIEW_QUOTA_LIMIT,
  PreviewQuotaService,
  type PreviewQuotaIdentity,
} from '../../services/community/preview-quota';

/** Builds an Express middleware that enforces the Day-5 preview quota.
 *
 *  Identity resolution: prefers `?wallet=` query, falls back to
 *  `X-Session-Token` header (anonymous browser sessions). The 3rd distinct
 *  community in a rolling 7-day window returns 403 with
 *  `{ error: 'preview_quota_exceeded', limit: 2 }`.
 *
 *  Identity is matched per-call only — the quota table is never joined to
 *  any other table in API responses (privacy invariant). */
export function previewQuota(svc: PreviewQuotaService) {
  return function previewQuotaMiddleware(req: Request, res: Response, next: NextFunction): void {
    const communityId = req.params.communityId;
    if (!communityId) {
      next();
      return;
    }

    const wallet = typeof req.query.wallet === 'string' ? req.query.wallet : null;
    const sessionHeader = req.headers['x-session-token'];
    const sessionToken =
      typeof sessionHeader === 'string'
        ? sessionHeader
        : Array.isArray(sessionHeader)
          ? sessionHeader[0] ?? null
          : null;

    const identity: PreviewQuotaIdentity = { wallet, sessionToken };
    const result = svc.consume(identity, communityId);
    if (result.allowed) {
      next();
      return;
    }
    if (result.reason === 'no_identity') {
      // No wallet and no session → cannot enforce per-caller quota; allow
      // the request to fall through to the public lock-state response.
      next();
      return;
    }
    res.status(403).json({
      success: false,
      error: 'preview_quota_exceeded',
      limit: PREVIEW_QUOTA_LIMIT,
    });
  };
}
