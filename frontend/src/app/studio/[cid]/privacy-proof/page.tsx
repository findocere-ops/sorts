import { CreatorStudioLayout } from '@/components/layout/CreatorStudioLayout';
import { RouteShellPage } from '@/components/layout/RouteShellPage';

export default function StudioPrivacyProofPage() {
  return (
    <CreatorStudioLayout title="Privacy proof">
      <RouteShellPage eyebrow="Privacy proof" title="Privacy guarantees shell" body="This page will explain what SORTS proves and what it refuses to reveal: no subscriber wallets, no individual names, and no exact tier-owner lists." icon="shield" badge="No member enumeration" />
    </CreatorStudioLayout>
  );
}
