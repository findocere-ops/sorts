import { CreatorStudioLayout } from '@/components/layout/CreatorStudioLayout';
import { RouteShellPage } from '@/components/layout/RouteShellPage';

export default function StudioClassroomPage() {
  return (
    <CreatorStudioLayout title="Classroom">
      <RouteShellPage eyebrow="Creator tools" title="Classroom modules are not published yet" body="Course structure will appear here once lessons are created. This page must not expose individual learner wallets or names." icon="book" />
    </CreatorStudioLayout>
  );
}
