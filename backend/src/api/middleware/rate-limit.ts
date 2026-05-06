import rateLimit, { type RateLimitRequestHandler } from 'express-rate-limit';

/** Global rate limit: 60 requests / minute / IP.
 *
 *  Factory — each call returns a fresh middleware with its own in-memory
 *  store. Production uses one (created in `index.ts`); tests create as many
 *  as they need so per-IP counters do not leak across test cases.
 *
 *  CORS preflight (OPTIONS) is excluded from the count so browsers do not
 *  get throttled by their own preflight chatter.
 *
 *  The limiter is intentionally permissive — a stricter per-route policy
 *  can be layered on top (e.g. for auth endpoints) without disturbing this
 *  floor.
 */
export function createApiRateLimit(): RateLimitRequestHandler {
  return rateLimit({
    windowMs: 60 * 1000,
    limit: 60,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skip: (req) => req.method === 'OPTIONS',
    message: { success: false, error: 'Too many requests, please retry later' },
  });
}

/** Default singleton kept for backwards compatibility with existing imports.
 *  Prefer `createApiRateLimit()` when wiring or testing. */
export const apiRateLimit = createApiRateLimit();
