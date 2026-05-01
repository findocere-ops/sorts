import { SubscriberAppLayout } from '@/components/layout/SubscriberAppLayout';
import { RouteShellPage } from '@/components/layout/RouteShellPage';

export default function SubscriberPrivacyPage() {
  return (
    <SubscriberAppLayout title="Privacy">
      <RouteShellPage eyebrow="Subscriber app" title="Your membership stays private" body="SORTS verifies access without giving creators a subscriber list, wallet table, or exact tier ownership list." icon="shield" badge="Privacy enforced" />
    </SubscriberAppLayout>
  );
}
