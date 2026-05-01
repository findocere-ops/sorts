import { CreatorStudioLayout } from '@/components/layout/CreatorStudioLayout';
import { EmptyState } from '@/components/ui/EmptyState';
import { RouteShellPage } from '@/components/layout/RouteShellPage';

export default function Page() {
  return (
    <CreatorStudioLayout title="Tiers">
      <RouteShellPage
        eyebrow="Creator Studio"
        title="Tiers"
        body="Manage your community settings and content."
        icon="grid"
      >
        <EmptyState
          icon="layers"
          title="No community selected"
          description="Create or select a community first to manage tiers."
          actionLabel="View communities"
          actionHref="/studio/communities"
        />
      </RouteShellPage>
    </CreatorStudioLayout>
  );
}
