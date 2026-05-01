import { PublicLayout } from '@/components/layout/PublicLayout';
import { EmptyState } from '@/components/ui/EmptyState';

export default function SubscribePage({ params }: { params: { cid: string } }) {
  return (
    <PublicLayout>
      <div style={{ padding: 64 }}>
        <EmptyState title="Subscribe" description={`Subscribe to community ${params.cid}`} actionLabel="Pay & Join" actionHref={`/app/${params.cid}/feed`} />
      </div>
    </PublicLayout>
  );
}
