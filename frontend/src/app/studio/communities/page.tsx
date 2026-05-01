import Link from 'next/link';
import { CreatorStudioLayout } from '@/components/layout/CreatorStudioLayout';
import { RouteShellPage } from '@/components/layout/RouteShellPage';
import { Button } from '@/components/ui/Button';

export default function StudioCommunitiesPage() {
  return (
    <CreatorStudioLayout title="Communities">
      <RouteShellPage
        eyebrow="Community registry"
        title="No community selected"
        body="Select a creator-owned community after backend metadata exists, or deploy a new one. This screen will stay aggregate-only by design."
        icon="layers"
      >
        <Link href="/studio/create"><Button>Create community</Button></Link>
      </RouteShellPage>
    </CreatorStudioLayout>
  );
}
