import { CreatorStudioLayout } from '@/components/layout/CreatorStudioLayout';
import { NoContentPublished } from '@/components/states';

export default function StudioContentPage({ params }: { params: { cid: string } }) {
  return (
    <CreatorStudioLayout title="Content">
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 24px' }}>
        <NoContentPublished creatorHref={`/studio/${params.cid}/content`} />
      </div>
    </CreatorStudioLayout>
  );
}
