import { CreatorStudioLayout } from '@/components/layout/CreatorStudioLayout';
import { RouteShellPage } from '@/components/layout/RouteShellPage';

export default function StudioSettingsPage() {
  return (
    <CreatorStudioLayout title="Settings">
      <RouteShellPage eyebrow="Community settings" title="Settings shell" body="Community metadata and creator-owned configuration will live here. Subscriber identity data is outside this page's allowed surface." icon="settings" />
    </CreatorStudioLayout>
  );
}
