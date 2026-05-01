import { CreatorStudioLayout } from '@/components/layout/CreatorStudioLayout';
import { RouteShellPage } from '@/components/layout/RouteShellPage';

export default function StudioTiersPage() {
  return (
    <CreatorStudioLayout title="Tiers">
      <RouteShellPage eyebrow="Membership tiers" title="Tier settings shell" body="Creators can configure tier labels and pricing here. Exact ownership lists are intentionally unavailable." icon="crown" badge="No owner lists" />
    </CreatorStudioLayout>
  );
}
