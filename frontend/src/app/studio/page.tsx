import Link from 'next/link';
import { CreatorStudioLayout } from '@/components/layout/CreatorStudioLayout';
import { RouteShellPage } from '@/components/layout/RouteShellPage';
import { Button } from '@/components/ui/Button';

export default function StudioPage() {
  return (
    <CreatorStudioLayout title="Creator Studio">
      <RouteShellPage
        eyebrow="Creator Studio"
        title="Build and operate private communities"
        body="This studio shows community configuration, content tools, and aggregate-only analytics. It never renders subscriber wallets, member names, or exact tier ownership lists."
        icon="grid"
        badge="Privacy safe"
      >
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link href="/studio/create"><Button>Create community</Button></Link>
          <Link href="/studio/communities"><Button variant="secondary">View communities</Button></Link>
        </div>
      </RouteShellPage>
    </CreatorStudioLayout>
  );
}
