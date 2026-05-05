import rateLimit from 'express-rate-limit';

/** Global rate limit: 60 requests / minute / IP.
 *
 *  Mounted in index.ts before route handlers. CORS preflight (OPTIONS) is
 *  excluded from the count so browsers do not get throttled by their own
 *  preflight chatter.
 *
 *  The limiter is intentionally permissive — a stricter per-route policy can
 *  be layered on top (e.g. for auth endpoints) without disturbing this floor.
 */
export const apiRateLimit = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: (req) => req.method === 'OPTIONS',
  message: { success: false, error: 'Too many requests, please retry later' },
});
