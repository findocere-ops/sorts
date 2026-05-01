const fs = require('fs');
const path = require('path');

const creatorRoutes = [
  'content', 'classroom', 'calendar', 'tiers', 'invites', 'analytics', 'telegram', 'privacy-proof', 'settings'
];

const subscriberRoutes = [
  'feed', 'classroom', 'library', 'calendar', 'leaderboard', 'membership', 'telegram', 'privacy'
];

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function writePage(file, content) {
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, content);
  }
}

const basePath = path.join(__dirname, 'frontend/src/app');

// Top-level Creator Routes (without CID)
creatorRoutes.forEach(r => {
  const dir = path.join(basePath, 'studio', r);
  ensureDir(dir);
  writePage(path.join(dir, 'page.tsx'), `
import { CreatorStudioLayout } from '@/components/layout/CreatorStudioLayout';
import { EmptyState } from '@/components/ui/EmptyState';
import { RouteShellPage } from '@/components/layout/RouteShellPage';

export default function Page() {
  return (
    <CreatorStudioLayout title="${r.charAt(0).toUpperCase() + r.slice(1).replace('-', ' ')}">
      <RouteShellPage
        eyebrow="Creator Studio"
        title="${r.charAt(0).toUpperCase() + r.slice(1).replace('-', ' ')}"
        body="Manage your community settings and content."
        icon="grid"
      >
        <EmptyState
          icon="layers"
          title="No community selected"
          description="Create or select a community first to manage ${r.replace('-', ' ')}."
          actionLabel="View communities"
          actionHref="/studio/communities"
        />
      </RouteShellPage>
    </CreatorStudioLayout>
  );
}
`.trim() + '\n');
});

// CID-scoped Creator Routes
creatorRoutes.forEach(r => {
  const dir = path.join(basePath, 'studio/[cid]', r);
  ensureDir(dir);
  writePage(path.join(dir, 'page.tsx'), `
import { CreatorStudioLayout } from '@/components/layout/CreatorStudioLayout';
import { RouteShellPage } from '@/components/layout/RouteShellPage';

export default function Page({ params }: { params: { cid: string } }) {
  return (
    <CreatorStudioLayout title="${r.charAt(0).toUpperCase() + r.slice(1).replace('-', ' ')}">
      <RouteShellPage
        eyebrow="Community Module"
        title="${r.charAt(0).toUpperCase() + r.slice(1).replace('-', ' ')}"
        body="This module is not yet configured for community {params.cid}."
        icon="grid"
      >
        <div style={{ padding: 24, border: '1px dashed var(--border)', borderRadius: 'var(--r-md)', textAlign: 'center' }}>
          <p className="t-body" style={{ color: 'var(--text-2)' }}>Coming next / Not configured</p>
        </div>
      </RouteShellPage>
    </CreatorStudioLayout>
  );
}
`.trim() + '\n');
});

// Subscriber Routes
const appLayout = (r) => `
import { SubscriberAppLayout } from '@/components/layout/SubscriberAppLayout';
import { RouteShellPage } from '@/components/layout/RouteShellPage';

export default function Page({ params }: { params: { cid: string } }) {
  return (
    <SubscriberAppLayout title="${r.charAt(0).toUpperCase() + r.slice(1).replace('-', ' ')}">
      <RouteShellPage
        eyebrow="Subscriber App"
        title="${r.charAt(0).toUpperCase() + r.slice(1).replace('-', ' ')}"
        body="Module for community {params.cid}"
        icon="grid"
      >
         <div style={{ padding: 24, border: '1px dashed var(--border)', borderRadius: 'var(--r-md)', textAlign: 'center' }}>
          <p className="t-body" style={{ color: 'var(--text-2)' }}>Coming next / Not configured</p>
        </div>
      </RouteShellPage>
    </SubscriberAppLayout>
  );
}
`;

subscriberRoutes.forEach(r => {
  const dir = path.join(basePath, 'app/[cid]', r);
  ensureDir(dir);
  writePage(path.join(dir, 'page.tsx'), appLayout(r).trim() + '\n');
});

// Other required routes
ensureDir(path.join(basePath, 'role'));
writePage(path.join(basePath, 'role/page.tsx'), `
import { PublicLayout } from '@/components/layout/PublicLayout';
import { EmptyState } from '@/components/ui/EmptyState';

export default function RolePage() {
  return (
    <PublicLayout>
      <div style={{ padding: 64 }}>
        <EmptyState title="Choose Role" description="Are you a creator or subscriber?" actionLabel="Sign In" actionHref="/auth" />
      </div>
    </PublicLayout>
  );
}
`.trim() + '\n');

ensureDir(path.join(basePath, 'auth'));
writePage(path.join(basePath, 'auth/page.tsx'), `
import { PublicLayout } from '@/components/layout/PublicLayout';
import { EmptyState } from '@/components/ui/EmptyState';

export default function AuthPage() {
  return (
    <PublicLayout>
      <div style={{ padding: 64 }}>
        <EmptyState title="Authentication" description="Privy login gateway" actionLabel="Go to Studio" actionHref="/studio" />
      </div>
    </PublicLayout>
  );
}
`.trim() + '\n');

ensureDir(path.join(basePath, 'account'));
writePage(path.join(basePath, 'account/page.tsx'), `
import { SubscriberAppLayout } from '@/components/layout/SubscriberAppLayout';
import { RouteShellPage } from '@/components/layout/RouteShellPage';

export default function AccountPage() {
  return (
    <SubscriberAppLayout title="Account">
      <RouteShellPage eyebrow="Account" title="Wallet Settings" body="Manage your connected wallet and active subscriptions.">
        <div style={{ padding: 24, border: '1px dashed var(--border)', borderRadius: 'var(--r-md)', textAlign: 'center' }}>
          <p className="t-body" style={{ color: 'var(--text-2)' }}>Coming next / Not configured</p>
        </div>
      </RouteShellPage>
    </SubscriberAppLayout>
  );
}
`.trim() + '\n');

ensureDir(path.join(basePath, 'join/[cid]/subscribe'));
writePage(path.join(basePath, 'join/[cid]/subscribe/page.tsx'), `
import { PublicLayout } from '@/components/layout/PublicLayout';
import { EmptyState } from '@/components/ui/EmptyState';

export default function SubscribePage({ params }: { params: { cid: string } }) {
  return (
    <PublicLayout>
      <div style={{ padding: 64 }}>
        <EmptyState title="Subscribe" description={\`Subscribe to community \${params.cid}\`} actionLabel="Pay & Join" actionHref={\`/app/\${params.cid}/feed\`} />
      </div>
    </PublicLayout>
  );
}
`.trim() + '\n');

ensureDir(path.join(basePath, 'join/[cid]'));
writePage(path.join(basePath, 'join/[cid]/page.tsx'), `
import { PublicLayout } from '@/components/layout/PublicLayout';
import { EmptyState } from '@/components/ui/EmptyState';

export default function JoinPage({ params }: { params: { cid: string } }) {
  return (
    <PublicLayout>
      <div style={{ padding: 64 }}>
        <EmptyState title="Join Community" description={\`Join community \${params.cid}\`} actionLabel="View Tiers" actionHref={\`/join/\${params.cid}/subscribe\`} />
      </div>
    </PublicLayout>
  );
}
`.trim() + '\n');

console.log('Finished generating routes');
