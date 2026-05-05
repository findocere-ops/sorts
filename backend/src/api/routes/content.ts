import { Router, Request, Response, NextFunction } from 'express';
import type { Database } from 'better-sqlite3';
import { ContentService, CreatePostSchema, UpdatePostSchema, type ContentRow } from '../../services/content/ContentService';
import { ChainServiceFactory } from '../../services/chain/ChainServiceFactory';
import { DataProtectorContentService } from '../../services/content/DataProtectorContentService';
import { contentReadMessage, creatorActionMessage, verifyContentReadProof, verifyCreatorProof } from '../walletProof';
import { privyAuth, requireWalletOwner } from '../middleware/auth';
import { sigNonce } from '../middleware/sig-nonce';
import { previewQuota } from '../middleware/preview-quota';
import { PreviewQuotaService } from '../../services/community/preview-quota';
import type { PrivyService } from '../../services/wallet/PrivyService';

const dataProtector = new DataProtectorContentService();

interface RouterDeps {
  privyService: PrivyService | null;
}

export function contentRouter(db: Database, deps: RouterDeps = { privyService: null }): Router {
  const router: Router = Router();
  const chain = ChainServiceFactory.forChain();
  const svc = new ContentService(db, chain, dataProtector);

  const auth = deps.privyService ? privyAuth(deps.privyService) : passThrough;
  const ownsCreatorWallet = deps.privyService ? requireWalletOwner('creatorWallet') : passThrough;
  const replayGuard = sigNonce(db);
  const previewQuotaSvc = new PreviewQuotaService(db);
  const previewQuotaGate = previewQuota(previewQuotaSvc);

  // Resolve the per-community chain service. For Solana communities the
  // access check goes through SolanaService.checkAccess (Day 2), which keeps
  // privacy invariants — never returns a tier or member count.
  function chainForCommunity(communityId: string) {
    const chainId = svc.getCommunityChain(communityId) ?? 'arbitrum-sepolia';
    return ChainServiceFactory.forChain(chainId);
  }
  async function verifyTierAccessForCommunity(
    communityId: string,
    contractAddress: string,
    wallet: string,
    tierRequired: 1 | 2 | 3,
  ): Promise<boolean> {
    const adapter = chainForCommunity(communityId);
    return adapter.checkAccess(contractAddress, wallet, tierRequired);
  }

  // GET /api/content/:communityId
  // Public callers receive metadata only. Members can include wallet+signature
  // to receive plaintext bodies for posts their tier can access. Non-members
  // get only `preview_eligible` posts unlocked; the preview-quota middleware
  // caps the unique-community footprint at PREVIEW_QUOTA_LIMIT per 7 days.
  router.get('/:communityId', previewQuotaGate, async (req: Request, res: Response) => {
    try {
      const communityId = req.params.communityId;
      const wallet = typeof req.query.wallet === 'string' ? req.query.wallet : null;
      const creatorWallet = typeof req.query.creatorWallet === 'string' ? req.query.creatorWallet : null;

      if (creatorWallet && svc.assertCommunityOwner(communityId, creatorWallet)) {
        const proofOk = await verifyCreatorProof(req, communityId, creatorWallet);
        if (!proofOk) {
          return res.status(401).json({
            success: false,
            error: 'Creator wallet signature required',
            messageToSign: creatorActionMessage(communityId, creatorWallet),
          });
        }
        return res.json({ success: true, data: svc.listForCreator(communityId, creatorWallet) });
      }

      const posts = svc.listPublishedMetadata(communityId);
      if (!wallet) {
        return res.json({ success: true, data: posts.map(p => lockPost(p)) });
      }

      const proofOk = await verifyContentReadProof(req, communityId, wallet);
      if (!proofOk) {
        return res.status(401).json({
          success: false,
          error: 'Wallet signature required',
          messageToSign: contentReadMessage(communityId, wallet),
        });
      }

      const contractAddress = svc.getCommunityContract(communityId);
      if (!contractAddress) {
        return res.status(404).json({ success: false, error: 'Community not found' });
      }

      // Single up-front access check. Solana communities never return tier;
      // EVM honours requiredTier per post.
      const hasMembership = await verifyTierAccessForCommunity(
        communityId,
        contractAddress,
        wallet,
        1,
      );
      if (hasMembership) {
        // Active member: free quota slot for this community + return full
        // metadata with body unlocked per post on subsequent /:postId reads.
        previewQuotaSvc.release({ wallet }, communityId);
        const readable = await Promise.all(posts.map(async (post) => {
          const ok = await verifyTierAccessForCommunity(
            communityId,
            contractAddress,
            wallet,
            post.tier_required as 1 | 2 | 3,
          );
          return ok ? unlockMetadata(post) : lockPost(post);
        }));
        return res.json({ success: true, data: readable });
      }

      // Non-member: only preview_eligible posts get the unlock signal; every
      // other post stays locked. Quota slot was reserved by the middleware.
      const previewOnly = posts.map((post) => {
        if (post.preview_eligible) return unlockMetadata(post);
        return lockPost(post);
      });
      res.json({ success: true, data: previewOnly });
    } catch {
      res.status(500).json({ success: false, error: 'Failed to fetch content' });
    }
  });

  // GET /api/content/:communityId/:postId
  // Returns a post body only after wallet proof + on-chain tier check.
  router.get('/:communityId/:postId', async (req: Request, res: Response) => {
    try {
      const communityId = req.params.communityId;
      const post = svc.getById(req.params.postId);
      if (!post || post.community_id !== communityId || !post.published) {
        return res.status(404).json({ success: false, error: 'Post not found' });
      }

      const creatorWallet = typeof req.query.creatorWallet === 'string' ? req.query.creatorWallet : null;
      if (creatorWallet && svc.assertCreatorOwns(post.id, communityId, creatorWallet)) {
        const proofOk = await verifyCreatorProof(req, communityId, creatorWallet);
        if (!proofOk) {
          return res.status(401).json({
            success: false,
            error: 'Creator wallet signature required',
            messageToSign: creatorActionMessage(communityId, creatorWallet),
          });
        }
        return res.json({ success: true, data: serializePost(post, { includeBody: true }) });
      }

      const wallet = typeof req.query.wallet === 'string' ? req.query.wallet : null;
      if (!wallet) {
        return res.json({ success: true, data: lockPost(post) });
      }

      const proofOk = await verifyContentReadProof(req, communityId, wallet);
      if (!proofOk) {
        return res.status(401).json({
          success: false,
          error: 'Wallet signature required',
          messageToSign: contentReadMessage(communityId, wallet),
        });
      }

      const contractAddress = svc.getCommunityContract(communityId);
      if (!contractAddress) {
        return res.status(404).json({ success: false, error: 'Community not found' });
      }

      const hasAccess = await verifyTierAccessForCommunity(communityId, contractAddress, wallet, post.tier_required as 1 | 2 | 3);
      if (!hasAccess) {
        return res.status(403).json({ success: false, error: 'Membership or tier insufficient', data: lockPost(post) });
      }

      if (svc.isProtected(post) && post.protected_data_address) {
        const protectedResult = await dataProtector.accessContent({
          encryptedRef: post.protected_data_address,
          requestingWallet: wallet,
          communityAddress: contractAddress,
          requiredTier: post.tier_required as 1 | 2 | 3,
        });

        return res.json({
          success: true,
          data: {
            ...serializePost(post, { includeBody: false }),
            body: protectedResult?.data ?? null,
            protectedContent: protectedResult
              ? { status: 'decrypted', mimeType: protectedResult.mimeType }
              : { status: 'protected', message: 'Protected content is available through the configured iExec iApp.' },
          },
        });
      }

      res.json({ success: true, data: serializePost(post, { includeBody: true }) });
    } catch {
      res.status(500).json({ success: false, error: 'Failed to fetch post' });
    }
  });

  // POST /api/content/:communityId
  router.post('/:communityId', auth, ownsCreatorWallet, replayGuard, async (req: Request, res: Response) => {
    const parsed = CreatePostSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.flatten() });
    }
    if (!svc.assertCommunityOwner(req.params.communityId, parsed.data.creatorWallet)) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }
    const proofOk = await verifyCreatorProof(req, req.params.communityId, parsed.data.creatorWallet);
    if (!proofOk) {
      return res.status(401).json({
        success: false,
        error: 'Creator wallet signature required',
        messageToSign: creatorActionMessage(req.params.communityId, parsed.data.creatorWallet),
      });
    }
    if (parsed.data.protectWithDataProtector && !dataProtector.isConfigured()) {
      return res.status(503).json({ success: false, error: 'iExec DataProtector is not configured on the backend' });
    }
    try {
      const id = await svc.create(req.params.communityId, parsed.data);
      res.status(201).json({ success: true, data: { id } });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create post';
      res.status(500).json({ success: false, error: message });
    }
  });

  // PATCH /api/content/:communityId/:postId
  router.patch('/:communityId/:postId', auth, ownsCreatorWallet, replayGuard, async (req: Request, res: Response) => {
    const parsed = UpdatePostSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.flatten() });
    }
    const { creatorWallet } = req.body;
    if (!creatorWallet) return res.status(400).json({ success: false, error: 'creatorWallet required' });
    const proofOk = await verifyCreatorProof(req, req.params.communityId, creatorWallet);
    if (!proofOk) {
      return res.status(401).json({
        success: false,
        error: 'Creator wallet signature required',
        messageToSign: creatorActionMessage(req.params.communityId, creatorWallet),
      });
    }
    if (!svc.assertCreatorOwns(req.params.postId, req.params.communityId, creatorWallet)) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }
    try {
      svc.update(req.params.postId, parsed.data);
      res.json({ success: true });
    } catch {
      res.status(500).json({ success: false, error: 'Failed to update post' });
    }
  });

  // DELETE /api/content/:communityId/:postId
  router.delete('/:communityId/:postId', auth, ownsCreatorWallet, replayGuard, async (req: Request, res: Response) => {
    const { creatorWallet } = req.body;
    if (!creatorWallet) return res.status(400).json({ success: false, error: 'creatorWallet required' });
    const proofOk = await verifyCreatorProof(req, req.params.communityId, creatorWallet);
    if (!proofOk) {
      return res.status(401).json({
        success: false,
        error: 'Creator wallet signature required',
        messageToSign: creatorActionMessage(req.params.communityId, creatorWallet),
      });
    }
    try {
      const deleted = svc.delete(req.params.postId, creatorWallet);
      if (!deleted) return res.status(404).json({ success: false, error: 'Post not found or not authorized' });
      res.json({ success: true });
    } catch {
      res.status(500).json({ success: false, error: 'Failed to delete post' });
    }
  });

  return router;
}

function passThrough(_req: Request, _res: Response, next: NextFunction): void {
  next();
}

function lockPost(post: Omit<ContentRow, 'body'> | ContentRow) {
  return {
    ...serializePost(post, { includeBody: false }),
    body: null,
    locked: true,
  };
}

function unlockMetadata(post: Omit<ContentRow, 'body'> | ContentRow) {
  return {
    ...serializePost(post, { includeBody: false }),
    locked: false,
  };
}

function serializePost(post: Omit<ContentRow, 'body'> | ContentRow, opts: { includeBody: boolean }) {
  const hasBody = 'body' in post;
  return {
    id: post.id,
    community_id: post.community_id,
    creator_wallet: post.creator_wallet,
    title: post.title,
    body: opts.includeBody && hasBody ? post.body : undefined,
    content_type: post.content_type,
    tier_required: post.tier_required,
    pinned: post.pinned,
    published: post.published,
    preview_eligible: Boolean(post.preview_eligible),
    likes_count: post.likes_count,
    comments_count: post.comments_count,
    created_at: post.created_at,
    updated_at: post.updated_at,
    protected_data_address: post.protected_data_address,
    protected_data_name: post.protected_data_name,
    protection_provider: post.protection_provider,
    iapp_address: post.iapp_address,
    protection_status: post.protection_status,
  };
}
