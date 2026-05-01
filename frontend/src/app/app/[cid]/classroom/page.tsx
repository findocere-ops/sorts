import { SubscriberAppLayout } from '@/components/layout/SubscriberAppLayout';
import { RouteShellPage } from '@/components/layout/RouteShellPage';

export default function SubscriberClassroomPage() {
  return (
    <SubscriberAppLayout title="Classroom">
      <RouteShellPage eyebrow="Subscriber app" title="No classroom modules yet" body="Lessons will appear here after the creator publishes classroom content and your membership is active." icon="book" />
    </SubscriberAppLayout>
  );
}
