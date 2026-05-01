import { SubscriberAppLayout } from '@/components/layout/SubscriberAppLayout';
import { MembershipNotActive } from '@/components/states';

export default function SubscriberMembershipPage({ params }: { params: { cid: string } }) {
  return (
    <SubscriberAppLayout title="Membership">
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 24px' }}>
        <MembershipNotActive joinHref={`/join/${params.cid}/subscribe`} />
      </div>
    </SubscriberAppLayout>
  );
}
