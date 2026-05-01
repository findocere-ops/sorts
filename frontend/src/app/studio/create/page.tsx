import { CreatorStudioLayout } from '@/components/layout/CreatorStudioLayout';
import { ContractNotConfigured } from '@/components/states';

export default function StudioCreatePage() {
  return (
    <CreatorStudioLayout title="Create community">
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 24px' }}>
        <ContractNotConfigured />
      </div>
    </CreatorStudioLayout>
  );
}
