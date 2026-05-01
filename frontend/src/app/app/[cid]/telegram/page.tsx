import { SubscriberAppLayout } from '@/components/layout/SubscriberAppLayout';
import { RouteShellPage } from '@/components/layout/RouteShellPage';

export default function SubscriberTelegramPage() {
  return (
    <SubscriberAppLayout title="Telegram">
      <RouteShellPage eyebrow="Subscriber app" title="Telegram link shell" body="Link Telegram later to receive gated content delivery. Your wallet link is for backend delivery only." icon="bot" />
    </SubscriberAppLayout>
  );
}
