'use client';

/** Day-10 B3 — skeleton primitives shared by landing preview, /join card,
 *  and /app feed list. Replaces the previous bare "Loading…" text states.
 *
 *  Visuals match the loaded shape so the layout doesn't shift. The
 *  shimmer animation is CSS-keyframes via inline `<style>` to avoid
 *  pulling tailwind's `animate-pulse` dependency on every consumer page. */

const SHIMMER_KEYFRAMES = `
@keyframes sortsShimmer {
  0% { background-position: -200px 0; }
  100% { background-position: 200px 0; }
}
`;

const skeletonStyle: React.CSSProperties = {
  display: 'inline-block',
  borderRadius: 6,
  background:
    'linear-gradient(90deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.10) 80px, rgba(255,255,255,0.04) 200px)',
  backgroundSize: '400px 100%',
  animation: 'sortsShimmer 1.4s linear infinite',
};

export function SkeletonBar({ width = '100%', height = 14 }: { width?: number | string; height?: number }) {
  return (
    <>
      <style>{SHIMMER_KEYFRAMES}</style>
      <span style={{ ...skeletonStyle, width, height }} aria-hidden="true" />
    </>
  );
}

/** Card-shaped skeleton matching `card-elevated` rhythm. Used on /join. */
export function SkeletonCard({ rows = 3 }: { rows?: number }) {
  return (
    <section
      aria-busy="true"
      aria-live="polite"
      className="card-elevated"
      style={{ display: 'grid', gap: 12, padding: '20px 22px', borderRadius: 14 }}
    >
      <style>{SHIMMER_KEYFRAMES}</style>
      <div style={{ ...skeletonStyle, height: 18, width: '40%' }} aria-hidden="true" />
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          style={{
            ...skeletonStyle,
            height: 12,
            width: `${100 - i * 12}%`,
          }}
          aria-hidden="true"
        />
      ))}
      <span className="sr-only" style={{ position: 'absolute', left: -9999 }}>
        Loading content…
      </span>
    </section>
  );
}

/** Feed-list skeleton matching the /app/[cid]/feed shape. */
export function SkeletonFeedList({ count = 3 }: { count?: number }) {
  return (
    <section aria-busy="true" aria-live="polite" style={{ display: 'grid', gap: 14 }}>
      <style>{SHIMMER_KEYFRAMES}</style>
      {Array.from({ length: count }).map((_, i) => (
        <article
          key={i}
          className="card-elevated"
          style={{ padding: 16, display: 'grid', gap: 8 }}
        >
          <div style={{ ...skeletonStyle, height: 18, width: '70%' }} aria-hidden="true" />
          <div style={{ ...skeletonStyle, height: 12, width: '95%' }} aria-hidden="true" />
          <div style={{ ...skeletonStyle, height: 12, width: '80%' }} aria-hidden="true" />
        </article>
      ))}
      <span className="sr-only" style={{ position: 'absolute', left: -9999 }}>
        Loading feed…
      </span>
    </section>
  );
}

/** Stats-card skeleton — three columns matching landing's CommunityPreviewCard. */
export function SkeletonStatsRow() {
  return (
    <div className="g3" style={{ gap: 12 }} aria-busy="true">
      <style>{SHIMMER_KEYFRAMES}</style>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            background: 'rgba(12,19,26,0.8)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 10,
            padding: '12px 14px',
            display: 'grid',
            gap: 6,
          }}
        >
          <div style={{ ...skeletonStyle, height: 10, width: '60%' }} aria-hidden="true" />
          <div style={{ ...skeletonStyle, height: 22, width: '50%' }} aria-hidden="true" />
          <div style={{ ...skeletonStyle, height: 9, width: '70%' }} aria-hidden="true" />
        </div>
      ))}
    </div>
  );
}
