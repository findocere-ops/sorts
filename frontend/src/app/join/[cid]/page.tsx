import { PublicLayout } from '@/components/layout/PublicLayout';
import { EmptyState } from '@/components/ui/EmptyState';

export default function JoinPage({ params }: { params: { cid: string } }) {
  return (
    <PublicLayout>
      <div style={{ padding: 64 }}>
        <EmptyState title="Join Community" description={`Join community ${params.cid}`} actionLabel="View Tiers" actionHref={`/join/${params.cid}/subscribe`} />
      </div>
    </PublicLayout>
  );
}
