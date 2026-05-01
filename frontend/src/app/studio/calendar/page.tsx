import { CreatorStudioLayout } from '@/components/layout/CreatorStudioLayout';
import { EmptyState } from '@/components/ui/EmptyState';
import { RouteShellPage } from '@/components/layout/RouteShellPage';

export default function Page() {
  return (
    <CreatorStudioLayout title="Calendar">
      <RouteShellPage
        eyebrow="Creator Studio"
        title="Calendar"
        body="Manage your community settings and content."
        icon="grid"
      >
        <EmptyState
          icon="layers"
          title="No community selected"
          description="Create or select a community first to manage calendar."
          actionLabel="View communities"
          actionHref="/studio/communities"
        />
      </RouteShellPage>
    </CreatorStudioLayout>
  );
}
