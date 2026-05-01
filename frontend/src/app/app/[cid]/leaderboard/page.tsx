import { SubscriberAppLayout } from '@/components/layout/SubscriberAppLayout';
import { RouteShellPage } from '@/components/layout/RouteShellPage';

export default function SubscriberLeaderboardPage() {
  return (
    <SubscriberAppLayout title="Leaderboard">
      <RouteShellPage eyebrow="Subscriber app" title="Leaderboard shell" body="Future ranking surfaces must be pseudonymous and must not expose wallet addresses or membership tiers." icon="trophy" />
    </SubscriberAppLayout>
  );
}
