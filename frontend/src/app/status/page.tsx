'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Address } from 'viem';
import { MarketingHeader } from '@/components/layout/MarketingHeader';
import { Badge } from '@/components/ui/Badge';
import { formatUsdc } from '@/lib/chain/usdc';
import {
  ARBITRUM_SEPOLIA_CHAIN_ID,
  shortenAddress,
  useLegacyArbitrumChain,
} from '@/lib/chain/useChain';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type HealthState = 'not-configured' | 'checking' | 'ok' | 'unavailable';

export default function StatusPage() {
  // /status is the legacy Arbitrum diagnostics page — use the legacy hook directly.
  const {
    address,
    chainId,
    factoryAddress,
    factoryConfigured,
    readUsdcBalance,
  } = useLegacyArbitrumChain();
  const [healthState, setHealthState] = useState<HealthState>(API_URL ? 'checking' : 'not-configured');
  const [usdcBalance, setUsdcBalance] = useState<string>('not connected');

  const apiConfigured = Boolean(API_URL?.trim());
  const arbitrumOk = Boolean(address && chainId === ARBITRUM_SEPOLIA_CHAIN_ID);

  const healthLabel = useMemo(() => {
    switch (healthState) {
      case 'ok':
        return 'reachable';
      case 'unavailable':
        return 'health endpoint unavailable';
      case 'checking':
        return 'checking';
      case 'not-configured':
      default:
        return 'not confirmed';
    }
  }, [healthState]);

  useEffect(() => {
    if (!API_URL?.trim()) {
      setHealthState('not-configured');
      return;
    }

    let cancelled = false;

    async function checkHealth() {
      setHealthState('checking');
      try {
        const baseUrl = API_URL!.replace(/\/+$/, '');
        const response = await fetch(`${baseUrl}/health`, { method: 'GET' });
        if (!cancelled) setHealthState(response.ok ? 'ok' : 'unavailable');
      } catch {
        if (!cancelled) setHealthState('unavailable');
      }
    }

    void checkHealth();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!address) {
      setUsdcBalance('not connected');
      return;
    }

    if (!factoryConfigured) {
      setUsdcBalance('factory not configured');
      return;
    }

    let cancelled = false;

    async function loadBalance() {
      setUsdcBalance('checking');
      try {
        const balance = await readUsdcBalance(address as Address);
        if (!cancelled) setUsdcBalance(`${formatUsdc(balance)} USDC`);
      } catch {
        if (!cancelled) setUsdcBalance('unavailable');
      }
    }

    void loadBalance();

    return () => {
      cancelled = true;
    };
  }, [address, factoryConfigured, readUsdcBalance]);

  return (
    <div className="page-shell">
      <MarketingHeader />
      <main className="lp-section" style={{ maxWidth: 920 }}>
        <div className="section-eyebrow">Deployment status</div>
        <h1 className="section-title" style={{ textAlign: 'left', maxWidth: 760 }}>
          SORTS runtime checks
        </h1>
        <p className="section-sub" style={{ textAlign: 'left', marginLeft: 0, maxWidth: 700 }}>
          Safe diagnostics for the deployed factory, wallet network, backend health, and USDC read path.
        </p>

        <section className="card mt-6" style={{ display: 'grid', gap: 12 }}>
          <StatusRow label="Factory configured" value={String(factoryConfigured)} ok={factoryConfigured} />
          <StatusRow
            label="Factory address"
            value={factoryAddress ? shortenAddress(factoryAddress, 6) : 'not configured'}
            ok={factoryConfigured}
          />
          <StatusRow label="Expected chain ID" value={String(ARBITRUM_SEPOLIA_CHAIN_ID)} ok />
          <StatusRow
            label="Connected wallet"
            value={address ? shortenAddress(address, 6) : 'not connected'}
            ok={Boolean(address)}
          />
          <StatusRow
            label="Current wallet chain ID"
            value={chainId ? String(chainId) : 'not connected'}
            ok={arbitrumOk}
          />
          <StatusRow
            label="Arbitrum Sepolia OK"
            value={address ? String(arbitrumOk) : 'not connected'}
            ok={arbitrumOk}
          />
          <StatusRow label="API URL configured" value={String(apiConfigured)} ok={apiConfigured} />
          <StatusRow
            label="Backend reachable"
            value={healthLabel}
            ok={healthState === 'ok'}
            neutral={healthState === 'checking' || healthState === 'not-configured'}
          />
          <StatusRow
            label="USDC balance"
            value={usdcBalance}
            ok={Boolean(address) && usdcBalance.endsWith('USDC')}
            neutral={!address || usdcBalance === 'checking' || usdcBalance === 'factory not configured'}
          />
        </section>
      </main>
    </div>
  );
}

function StatusRow({
  label,
  value,
  ok,
  neutral = false,
}: {
  label: string;
  value: string;
  ok: boolean;
  neutral?: boolean;
}) {
  const variant = neutral ? 'default' : ok ? 'success' : 'warning';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        padding: '12px 0',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      <span className="t-sm" style={{ color: 'var(--text-2)' }}>{label}</span>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        <span className="t-mono" style={{ color: 'var(--text-1)' }}>{value}</span>
        <Badge variant={variant}>{neutral ? 'info' : ok ? 'ok' : 'check'}</Badge>
      </span>
    </div>
  );
}
