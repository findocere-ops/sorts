import { SubscriberAppLayout } from '@/components/layout/SubscriberAppLayout';
import { RouteShellPage } from '@/components/layout/RouteShellPage';

export default function SubscriberLibraryPage() {
  return (
    <SubscriberAppLayout title="Library">
      <RouteShellPage eyebrow="Subscriber app" title="Library is empty" body="Reports, saved posts, and resources will appear here after content is published for your membership access." icon="library" />
    </SubscriberAppLayout>
  );
}
