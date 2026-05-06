'use client';

import { CHAINS } from '@/lib/chain/chains';
import type { ChainAdapterId } from '@/lib/chain/types';

/** Static dWallet asset summary. Pre-alpha — never claims a real balance.
 *  Shows only the chain registry shape so reviewers can see what the future
 *  multichain panel will render once IKA real-funds is wired. */
export function MultichainAssetPanel() {
  const chains: ChainAdapterId[] = ['solana-devnet', 'arbitrum-sepolia'];
  return (
    <section
      className="card-elevated"
      style={{ display: 'grid', gap: 12, padding: 18, borderRadius: 14 }}
    >
      <header style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <p className="t-label" style={{ color: 'var(--cyan)' }}>Multichain assets</p>
          <h3 className="t-h3">Per-chain summary</h3>
        </div>
        <span className="t-xs" style={{ color: 'var(--text-3, #999)' }}>Pre-alpha — placeholder values</span>
      </header>
      <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 8 }}>
        {chains.map((id) => {
          const c = CHAINS[id];
          return (
            <li
              key={id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 12,
                padding: '8px 12px',
                background: 'rgba(8,13,18,0.6)',
                borderRadius: 10,
                border: '1px solid var(--border-subtle)',
              }}
            >
              <span>{c.label}</span>
              <span className="t-mono" style={{ color: 'var(--text-3, #999)' }}>
                — {c.nativeCurrency.symbol}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
