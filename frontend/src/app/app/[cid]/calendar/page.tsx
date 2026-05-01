import { SubscriberAppLayout } from '@/components/layout/SubscriberAppLayout';
import { RouteShellPage } from '@/components/layout/RouteShellPage';

export default function SubscriberCalendarPage() {
  return (
    <SubscriberAppLayout title="Calendar">
      <RouteShellPage eyebrow="Subscriber app" title="No member events yet" body="Private events will appear here once scheduled by the creator." icon="calendar" />
    </SubscriberAppLayout>
  );
}
