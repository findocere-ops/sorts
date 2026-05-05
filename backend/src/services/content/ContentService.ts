import { v4 as uuid } from 'uuid';
import type { Database } from 'better-sqlite3';
import { z } from 'zod';
import type { IChainService } from '@sorts/shared';
import type { DataProtectorContentService, ProtectedContentMetadata } from './DataProtectorContentService';

export interface ContentRow {
  id: string;
  community_id: string;
  creator_wallet: string;
  title: string;
  body: string | null;
  content_type: string;
  tier_required: number;
  pinned: number;
  published: number;
  likes_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
  protected_data_address: string | null;
  protected_data_name: string | null;
  protection_provider: string;
  iapp_address: string | null;
  protection_status: string;
}

export const CreatePostSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().max(50000).optional(),
  contentType: z.enum(['post', 'report', 'signal', 'event', 'announcement']).default('post'),
  tierRequired: z.number().int().min(1).max(3).default(1),
  pinned: z.boolean().default(false),
  protectWithDataProtector: z.boolean().default(false),
  creatorWallet: z.string().startsWith('0x'),
});

export const UpdatePostSchema = CreatePostSchema.partial().omit({ creatorWallet: true, protectWithDataProtector: true });

export type CreatePostInput = z.infer<typeof CreatePostSchema>;
export type UpdatePostInput = z.infer<typeof UpdatePostSchema>;

export class ContentService {
  constructor(
    private db: Database,
    private chain: IChainService,
    private dataProtector?: DataProtectorContentService,
  ) {}

  /**
   * Public metadata only. Never includes post body.
   */
  listPublishedMetadata(communityId: string, limit = 50): Array<Omit<ContentRow, 'body'>> {
    return this.db.prepare(`
      SELECT
        id, community_id, creator_wallet, title, content_type, tier_required,
        pinned, published, likes_count, comments_count, created_at, updated_at,
        protected_data_address, protected_data_name, protection_provider, iapp_address, protection_status
      FROM content
      WHERE community_id = ? AND published = 1
      ORDER BY pinned DESC, created_at DESC
      LIMIT ?
    `).all(communityId, limit) as Array<Omit<ContentRow, 'body'>>;
  }

  listForCreator(communityId: string, creatorWallet: string, limit = 100): ContentRow[] {
    return this.db.prepare(`
      SELECT * FROM content
      WHERE community_id = ? AND LOWER(creator_wallet) = LOWER(?)
      ORDER BY pinned DESC, created_at DESC
      LIMIT ?
    `).all(communityId, creatorWallet, limit) as ContentRow[];
  }

  getById(postId: string): ContentRow | null {
    return (this.db.prepare('SELECT * FROM content WHERE id = ?').get(postId) as ContentRow | undefined) ?? null;
  }

  /**
   * Verify that the given wallet has sufficient access for the given post.
   * Always goes to chain — never uses off-chain cache for access decisions.
   */
  async verifyMemberAccess(contractAddress: string, wallet: string): Promise<boolean> {
    return this.chain.checkAccess(contractAddress, wallet, 1);
  }

  async verifyTierAccess(contractAddress: string, wallet: string, tierRequired: 1 | 2 | 3): Promise<boolean> {
    return this.chain.checkAccess(contractAddress, wallet, tierRequired);
  }

  async create(communityId: string, input: CreatePostInput): Promise<string> {
    const id = uuid();
    let body: string | null = input.body ?? '';
    let protectedContent: ProtectedContentMetadata | null = null;

    if (input.protectWithDataProtector) {
      if (!input.body) {
        throw new Error('Protected posts require a body to encrypt');
      }
      if (!this.dataProtector) {
        throw new Error('DataProtector service is unavailable');
      }
      protectedContent = await this.dataProtector.protectTextContent({
        contentId: id,
        data: input.body,
        mimeType: 'text/plain',
        requiredTier: input.tierRequired as 1 | 2 | 3,
        authorWallet: input.creatorWallet,
      });
      body = null;
    }

    this.db.prepare(`
      INSERT INTO content (
        id, community_id, creator_wallet, title, body, content_type, tier_required,
        pinned, published, protected_data_address, protected_data_name,
        protection_provider, iapp_address, protection_status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?)
    `).run(
      id,
      communityId,
      input.creatorWallet.toLowerCase(),
      input.title,
      body,
      input.contentType,
      input.tierRequired,
      input.pinned ? 1 : 0,
      protectedContent?.encryptedRef ?? null,
      protectedContent?.protectedDataName ?? null,
      protectedContent?.protectionProvider ?? 'none',
      protectedContent?.iappAddress ?? null,
      protectedContent ? 'protected' : 'plain',
    );
    return id;
  }

  update(postId: string, input: UpdatePostInput): boolean {
    const sets: string[] = [];
    const values: unknown[] = [];

    if (input.title !== undefined) { sets.push('title = ?'); values.push(input.title); }
    if (input.body !== undefined) { sets.push('body = ?'); values.push(input.body); }
    if (input.tierRequired !== undefined) { sets.push('tier_required = ?'); values.push(input.tierRequired); }
    if (input.pinned !== undefined) { sets.push('pinned = ?'); values.push(input.pinned ? 1 : 0); }
    if (input.contentType !== undefined) { sets.push('content_type = ?'); values.push(input.contentType); }

    if (sets.length === 0) return false;
    sets.push("updated_at = datetime('now')");
    values.push(postId);

    const result = this.db.prepare(`UPDATE content SET ${sets.join(', ')} WHERE id = ?`).run(...values as string[]);
    return result.changes > 0;
  }

  delete(postId: string, creatorWallet: string): boolean {
    const result = this.db.prepare(
      'DELETE FROM content WHERE id = ? AND LOWER(creator_wallet) = LOWER(?)'
    ).run(postId, creatorWallet);
    return result.changes > 0;
  }

  /** Verify creator owns both the post and the community. */
  assertCreatorOwns(postId: string, communityId: string, creatorWallet: string): boolean {
    const post = this.db.prepare(
      'SELECT id FROM content WHERE id = ? AND community_id = ? AND LOWER(creator_wallet) = LOWER(?)'
    ).get(postId, communityId, creatorWallet);
    return !!post;
  }

  assertCommunityOwner(communityId: string, creatorWallet: string): boolean {
    const community = this.db.prepare(
      'SELECT id FROM communities WHERE id = ? AND LOWER(creator_wallet) = LOWER(?)'
    ).get(communityId, creatorWallet);
    return !!community;
  }

  getCommunityContract(communityId: string): string | null {
    const community = this.db.prepare(
      'SELECT contract_address FROM communities WHERE id = ?'
    ).get(communityId) as { contract_address: string } | undefined;
    return community?.contract_address ?? null;
  }

  /** Returns the community's chain_id ('arbitrum-sepolia' | 'solana-devnet' | etc.).
   *  Used by route handlers to pick the right IChainService implementation
   *  for the per-community access check. */
  getCommunityChain(communityId: string): string | null {
    const row = this.db.prepare(
      'SELECT chain_id FROM communities WHERE id = ?'
    ).get(communityId) as { chain_id: string } | undefined;
    return row?.chain_id ?? null;
  }

  isProtected(post: ContentRow): boolean {
    return Boolean(post.protected_data_address) || post.protection_status === 'protected';
  }
}
