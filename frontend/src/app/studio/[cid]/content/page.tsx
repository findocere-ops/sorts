'use client';

import { Suspense, useEffect, useState } from 'react';
import { CreatorStudioLayout } from '@/components/layout/CreatorStudioLayout';
import { PreviewToggle } from '@/components/studio/PreviewToggle';
import { useChain } from '@/lib/chain/useChain';

interface CreatorPost {
  id: string;
  title: string;
  preview_eligible: boolean;
  pinned: number;
  published: number;
  tier_required: number;
  created_at: string;
}

export default function StudioContentPage({ params }: { params: { cid: string } }) {
  return (
    <CreatorStudioLayout title="Content">
      <Suspense fallback={null}>
        <ContentInner cid={params.cid} />
      </Suspense>
    </CreatorStudioLayout>
  );
}

function ContentInner({ cid }: { cid: string }) {
  const adapter = useChain();
  const creatorWallet = adapter.address ?? null;
  const [posts, setPosts] = useState<CreatorPost[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  useEffect(() => {
    if (!creatorWallet) return;
    let cancelled = false;
    (async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
        const res = await fetch(`${apiUrl}/api/content/${cid}?creatorWallet=${encodeURIComponent(creatorWallet)}`);
        const json = (await res.json()) as { success: boolean; data?: CreatorPost[]; error?: string };
        if (cancelled) return;
        if (json.success && Array.isArray(json.data)) setPosts(json.data);
        else setError(json.error ?? 'failed');
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'failed');
      }
    })();
    return () => { cancelled = true; };
  }, [cid, creatorWallet]);

  const togglePreview = async (postId: string, next: boolean) => {
    if (!creatorWallet) return;
    setPendingId(postId);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/api/content/${cid}/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creatorWallet, previewEligible: next }),
      });
      if (!res.ok) throw new Error(`status ${res.status}`);
      setPosts((current) =>
        current.map((p) => (p.id === postId ? { ...p, preview_eligible: next } : p)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'failed');
    } finally {
      setPendingId(null);
    }
  };

  if (!creatorWallet) {
    return (
      <Shell>
        <p className="t-sm" style={{ color: 'var(--text-2)' }}>Connect a wallet to manage content.</p>
      </Shell>
    );
  }

  return (
    <Shell>
      <header style={{ display: 'grid', gap: 4 }}>
        <p className="t-label" style={{ color: 'var(--cyan)' }}>Studio</p>
        <h1 className="t-h1">Content</h1>
        <p className="t-sm" style={{ color: 'var(--text-2)' }}>
          Mark a post preview-eligible to share its body with non-members under the 2-community
          7-day rolling preview cap.
        </p>
      </header>
      {error && <p className="t-sm" style={{ color: 'var(--danger)' }}>{error}</p>}
      <section style={{ display: 'grid', gap: 12 }}>
        {posts.length === 0 && (
          <p className="t-sm" style={{ color: 'var(--text-2)' }}>No posts yet.</p>
        )}
        {posts.map((post) => (
          <article
            key={post.id}
            className="card-elevated"
            style={{ padding: 16, display: 'grid', gap: 6 }}
          >
            <header style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <h3 className="t-h3">{post.title}</h3>
              <PreviewToggle
                postId={post.id}
                enabled={Boolean(post.preview_eligible)}
                disabled={pendingId === post.id}
                onChange={togglePreview}
              />
            </header>
            <p className="t-xs" style={{ color: 'var(--text-3, #999)' }}>
              Created {new Date(post.created_at).toLocaleDateString()}
            </p>
          </article>
        ))}
      </section>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 24px', display: 'grid', gap: 18 }}>
      {children}
    </div>
  );
}
