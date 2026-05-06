'use client';

import { useEffect, useState } from 'react';
import type { DWalletDescriptor, SupportedChain } from '@sorts/shared';

const CAPABILITIES = ['prepare', 'sign', 'broadcast'] as const;
type Capability = typeof CAPABILITIES[number];

/** Day-6 IKA dWallet capability matrix.
 *
 *  Always renders the red/orange "PRE-ALPHA — NOT FOR REAL FUNDS" stripe
 *  at the top. Not dismissible. Capability cells are either
 *  "✓ pre-alpha" (the dWallet descriptor lists the chain) or "—". */
export function SignerCapabilitiesCard() {
  const [caps, setCaps] = useState<DWalletDescriptor[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
        const res = await fetch(`${apiUrl}/api/wallet/capabilities`);
        if (!res.ok) throw new Error(`status ${res.status}`);
        const json = (await res.json()) as { success: boolean; data?: DWalletDescriptor[] };
        if (cancelled) return;
        if (json.success && Array.isArray(json.data)) setCaps(json.data);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'failed');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const allChains: SupportedChain[] = ['solana-devnet', 'arbitrum-sepolia'];
  const supports = (chain: SupportedChain): boolean =>
    caps.some((c) => c.supportedChains.includes(chain));

  return (
    <section
      className="card-elevated"
      style={{
        display: 'grid',
        gap: 0,
        borderRadius: 14,
        overflow: 'hidden',
        border: '1px solid rgba(239,68,68,0.4)',
      }}
    >
      <div
        style={{
          background: 'linear-gradient(90deg, rgba(255,68,68,0.85), rgba(255,140,46,0.85))',
          color: '#fff',
          padding: '10px 16px',
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: 1,
          textTransform: 'uppercase',
        }}
      >
        Pre-alpha — not for real funds
      </div>
      <div style={{ padding: 18, display: 'grid', gap: 14 }}>
        <header>
          <p className="t-label" style={{ color: 'var(--cyan)' }}>IKA dWallet</p>
          <h3 className="t-h3">Signer capabilities</h3>
          <p className="t-sm" style={{ color: 'var(--text-2)', maxWidth: 640 }}>
            Capability matrix below is a static placeholder while the IKA pre-alpha endpoint
            stabilises. No real-funds methods are wired into this build.
          </p>
        </header>

        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              borderCollapse: 'collapse',
              width: '100%',
              minWidth: 480,
              fontSize: 13,
            }}
          >
            <thead>
              <tr>
                <th style={th}>Chain</th>
                {CAPABILITIES.map((cap) => (
                  <th key={cap} style={th}>{cap}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allChains.map((chain) => {
                const ok = supports(chain);
                return (
                  <tr key={chain}>
                    <td style={td}>{chain}</td>
                    {CAPABILITIES.map((cap) => (
                      <td key={cap} style={td}>{cellLabel(ok, cap)}</td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {error && (
          <p className="t-xs" style={{ color: 'var(--text-3, #999)' }}>
            (capabilities endpoint unavailable — rendering static fallback)
          </p>
        )}
      </div>
    </section>
  );
}

function cellLabel(ok: boolean, _cap: Capability): string {
  return ok ? '✓ pre-alpha' : '—';
}

const th: React.CSSProperties = {
  textAlign: 'left',
  padding: '8px 10px',
  borderBottom: '1px solid var(--border-subtle)',
  fontWeight: 600,
  fontSize: 11,
  textTransform: 'uppercase',
  color: 'var(--text-3, #999)',
};
const td: React.CSSProperties = {
  padding: '10px',
  borderBottom: '1px solid var(--border-subtle)',
  color: 'var(--text-1)',
};
