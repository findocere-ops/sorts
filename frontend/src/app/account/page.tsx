'use client';
import { AppShell } from '@/components/layout/AppShell';
import { useSortsPrivy, useSortsWallets } from '@/components/providers/PrivyProvider';
import { Button } from '@/components/ui/Button';
import { SignerCapabilitiesCard } from '@/components/wallet/SignerCapabilitiesCard';
import { MultichainAssetPanel } from '@/components/wallet/MultichainAssetPanel';
import { MessageApprovalLifecycle } from '@/components/wallet/MessageApprovalLifecycle';
import { DemoStatusCard } from '@/components/states/DemoStatusCard';

export default function AccountPage() {
  const { ready, authenticated, login, logout, user, linkEmail, linkWallet } = useSortsPrivy();
  const { wallets } = useSortsWallets();

  if (!ready) {
    return (
      <AppShell>
        <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)' }}>
          Loading…
        </div>
      </AppShell>
    );
  }

  if (!authenticated) {
    return (
      <AppShell>
        <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <div style={{ fontSize: 36 }}>🔒</div>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-1)' }}>Sign in to view your account</h2>
          <Button onClick={login}>Sign in with email or wallet</Button>
        </div>
      </AppShell>
    );
  }

  const email = user?.email?.address;
  const embeddedWallet = wallets.find(w => w.walletClientType === 'privy');
  const externalWallet = wallets.find(w => w.walletClientType !== 'privy');

  return (
    <AppShell pageTitle="Account">
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '32px 24px' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-1)', marginBottom: 28 }}>Account</h1>

        {/* Identity */}
        <Section title="Identity">
          <Row label="Privy user ID">
            <code style={{ fontSize: 11.5, fontFamily: 'DM Mono', color: 'var(--text-2)' }}>{user?.id}</code>
          </Row>
          {email ? (
            <Row label="Email">
              <span style={{ fontSize: 13.5, color: 'var(--text-1)' }}>{email}</span>
            </Row>
          ) : (
            <Row label="Email">
              <button
                onClick={() => linkEmail()}
                style={{ fontSize: 13, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                + Link email
              </button>
            </Row>
          )}
        </Section>

        {/* Wallets */}
        <Section title="Wallets">
          {embeddedWallet && (
            <Row label="Embedded wallet">
              <span style={{ fontSize: 12.5, fontFamily: 'DM Mono', color: 'var(--text-2)' }}>
                {embeddedWallet.address.slice(0, 8)}…{embeddedWallet.address.slice(-6)}
              </span>
              <NetworkBadge />
            </Row>
          )}
          {externalWallet && (
            <Row label="External wallet">
              <span style={{ fontSize: 12.5, fontFamily: 'DM Mono', color: 'var(--text-2)' }}>
                {externalWallet.address.slice(0, 8)}…{externalWallet.address.slice(-6)}
              </span>
              <NetworkBadge />
            </Row>
          )}
          {!externalWallet && (
            <Row label="">
              <button
                onClick={() => linkWallet()}
                style={{ fontSize: 13, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                + Link external wallet
              </button>
            </Row>
          )}
        </Section>

        {/* Telegram */}
        <Section title="Telegram">
          <Row label="Status">
            <span style={{ fontSize: 13, color: 'var(--text-3)' }}>Not linked — use the /start command in the Sorts bot to link</span>
          </Row>
        </Section>

        {/* Day-10 A3 — DemoStatusCard pairs the IKA pre-alpha disclosure
            with the calibrated "what works today" panel so a signed-in
            visitor doesn't read the IKA section as "the demo is broken". */}
        <Section title="Build status">
          <div style={{ padding: 12 }}>
            <DemoStatusCard compact />
          </div>
        </Section>

        {/* IKA dWallet (pre-alpha) */}
        <Section title="IKA dWallet">
          <div style={{ padding: 12, display: 'grid', gap: 12 }}>
            <SignerCapabilitiesCard />
            <MultichainAssetPanel />
            <MessageApprovalLifecycle current="prepared" />
          </div>
        </Section>

        {/* Privacy */}
        <Section title="Privacy">
          <div style={{
            background: 'var(--teal-dim)', border: '1px solid rgba(45,212,191,0.14)',
            borderRadius: 10, padding: '12px 14px', fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.65,
          }}>
            🛡 Your wallet address, email, and tier memberships are never shared with community creators or other members. Only you can see this information.
          </div>
        </Section>

        {/* Danger zone */}
        <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
          <Button variant="ghost" onClick={() => logout()} style={{ color: 'var(--rose)' }}>
            Sign out
          </Button>
        </div>
      </div>
    </AppShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>{title}</p>
      <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 12 }}>
        {children}
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
      padding: '12px 16px', borderBottom: '1px solid var(--border-dim)',
    }}
      className="last:border-b-0"
    >
      {label && <span style={{ fontSize: 13, color: 'var(--text-2)', flexShrink: 0 }}>{label}</span>}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
        {children}
      </div>
    </div>
  );
}

function NetworkBadge() {
  return (
    <span style={{
      fontSize: 10.5, color: 'var(--teal)', background: 'var(--teal-dim)',
      border: '1px solid rgba(45,212,191,0.2)', borderRadius: 'var(--r-full)',
      padding: '2px 7px', fontFamily: 'DM Mono',
    }}>
      Arbitrum Sepolia
    </span>
  );
}
