import { CreatorStudioLayout } from '@/components/layout/CreatorStudioLayout';
import { RouteShellPage } from '@/components/layout/RouteShellPage';

export default function StudioAnalyticsPage() {
  return (
    <CreatorStudioLayout title="Analytics">
      <RouteShellPage eyebrow="Aggregate only" title="Community analytics shell" body="This screen may show total members, active memberships, content count, and total revenue. It must never show subscriber wallets, names, tier ownership lists, or member tables." icon="chart" badge="Privacy invariant" />
    </CreatorStudioLayout>
  );
}
