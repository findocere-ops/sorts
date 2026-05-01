import { CreatorStudioLayout } from '@/components/layout/CreatorStudioLayout';
import { RouteShellPage } from '@/components/layout/RouteShellPage';

export default function StudioCalendarPage() {
  return (
    <CreatorStudioLayout title="Calendar">
      <RouteShellPage eyebrow="Creator tools" title="No events scheduled" body="Create member-only events later. RSVP details must remain privacy-preserving and avoid individual member lists." icon="calendar" />
    </CreatorStudioLayout>
  );
}
