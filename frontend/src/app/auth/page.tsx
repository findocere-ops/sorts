'use client';

import Link from 'next/link';
import { WalletButton } from '@/components/auth/WalletButton';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useSortsAccount, useSortsChainId, useSortsPrivy, useSortsSwitchChain } from '@/components/providers/PrivyProvider';
import { ARBITRUM_SEPOLIA_CHAIN_ID, shortenAddress } from '@/lib/chain/useChain';

export default function AuthPage() {
  const { authenticated, isDemoAuth, login } = useSortsPrivy();
  const { address } = useSortsAccount();
  const chainId = useSortsChainId();
  const { switchChain } = useSortsSwitchChain();
  const connected = Boolean(authenticated && address);
  const wrongNetwork = Boolean(connected && chainId !== ARBITRUM_SEPOLIA_CHAIN_ID);

  return (
    <PublicLayout>
      <main style={{ maxWidth: 980, margin: '0 auto', padding: '48px 24px' }}>
        <section
          style={{
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-lg)',
            background: 'linear-gradient(180deg, var(--bg-elevated), var(--bg-card))',
            overflow: 'hidden',
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.15fr) minmax(280px, 0.85fr)' }}>
            <div style={{ padding: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <span className="t-label" style={{ color: 'var(--cyan)' }}>SORTS authentication</span>
                <Badge variant={isDemoAuth ? 'warning' : 'success'}>{isDemoAuth ? 'Setup needed' : 'Privy ready'}</Badge>
              </div>

              <h1 className="t-display" style={{ fontSize: 42, marginBottom: 14 }}>
                {connected ? 'Wallet connected.' : 'Sign in without exposing membership data.'}
              </h1>
              <p className="t-body" style={{ color: 'var(--text-2)', maxWidth: 620 }}>
                SORTS uses Privy for login, embedded wallets, signatures, and transaction prompts. Public pages stay open without a wallet; creator and subscriber actions ask for connection only when needed.
              </p>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 24 }}>
                {isDemoAuth ? (
                  <Button disabled>Privy App ID missing</Button>
                ) : connected ? (
                  <Link href="/role"><Button>Continue</Button></Link>
                ) : (
                  <Button onClick={login}>Connect with Privy</Button>
                )}
                <Link href="/role"><Button variant="secondary">Choose role</Button></Link>
              </div>
            </div>

            <aside style={{ borderLeft: '1px solid var(--border-dim)', background: 'var(--bg-panel)', padding: 24 }}>
              <p className="t-label" style={{ marginBottom: 12 }}>Wallet status</p>
              <StatusRow label="Privy" value={isDemoAuth ? 'Not configured' : 'Configured'} tone={isDemoAuth ? 'warning' : 'success'} />
              <StatusRow label="Connection" value={connected ? 'Connected' : 'Not connected'} tone={connected ? 'success' : 'muted'} />
              <StatusRow label="Wallet" value={address ? shortenAddress(address) : 'None'} tone={address ? 'success' : 'muted'} />
              <StatusRow label="Network" value={chainId ? String(chainId) : 'Unknown'} tone={wrongNetwork ? 'warning' : connected ? 'success' : 'muted'} />

              <div style={{ marginTop: 18 }}>
                <WalletButton size="md" showNetworkHint />
              </div>

              {wrongNetwork && (
                <div style={{ marginTop: 16, padding: 12, borderRadius: 'var(--r-md)', border: '1px solid rgba(245,158,11,0.28)', background: 'var(--warning-dim)' }}>
                  <p style={{ color: 'var(--warning)', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Wrong network</p>
                  <p style={{ color: 'var(--text-2)', fontSize: 12.5, marginBottom: 10 }}>Switch to Arbitrum Sepolia before deploying or subscribing.</p>
                  <Button size="sm" variant="secondary" onClick={() => switchChain({ chainId: ARBITRUM_SEPOLIA_CHAIN_ID })}>
                    Switch network
                  </Button>
                </div>
              )}

              {isDemoAuth && (
                <div style={{ marginTop: 16, padding: 12, borderRadius: 'var(--r-md)', border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
                  <p style={{ color: 'var(--text-1)', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Manual setup</p>
                  <p style={{ color: 'var(--text-2)', fontSize: 12.5 }}>
                    Add your Privy App ID to <span className="t-mono">frontend/.env.local</span> as <span className="t-mono">NEXT_PUBLIC_PRIVY_APP_ID</span>, then restart the frontend dev server.
                  </p>
                </div>
              )}
            </aside>
          </div>
        </section>
      </main>
    </PublicLayout>
  );
}

function StatusRow({ label, value, tone }: { label: string; value: string; tone: 'success' | 'warning' | 'muted' }) {
  const color = tone === 'success' ? 'var(--success)' : tone === 'warning' ? 'var(--warning)' : 'var(--text-3)';
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border-dim)' }}>
      <span style={{ color: 'var(--text-3)', fontSize: 12.5 }}>{label}</span>
      <span style={{ color, fontSize: 12.5, fontFamily: 'DM Mono', textAlign: 'right' }}>{value}</span>
    </div>
  );
}
