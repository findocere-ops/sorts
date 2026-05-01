import { CreatorStudioLayout } from '@/components/layout/CreatorStudioLayout';
import { RouteShellPage } from '@/components/layout/RouteShellPage';

export default function StudioInvitesPage() {
  return (
    <CreatorStudioLayout title="Invites">
      <RouteShellPage eyebrow="Invite links" title="Invite management shell" body="Share join links without building subscriber identity tables. Invite analytics should stay aggregate-only." icon="invite" />
    </CreatorStudioLayout>
  );
}
