import { CreatorStudioLayout } from '@/components/layout/CreatorStudioLayout';
import { RouteShellPage } from '@/components/layout/RouteShellPage';

export default function StudioTelegramPage() {
  return (
    <CreatorStudioLayout title="Telegram">
      <RouteShellPage eyebrow="Delivery bridge" title="Telegram setup shell" body="Configure bot delivery here later. Wallet-to-Telegram links are backend delivery data and must never be exposed to creators." icon="bot" />
    </CreatorStudioLayout>
  );
}
