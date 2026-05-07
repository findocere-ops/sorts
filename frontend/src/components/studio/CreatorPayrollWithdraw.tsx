'use client';

/**
 * Creator payroll withdraw — Tier 1.3 / Cloak SDK.
 *
 * On the mainnet Cloak path, creators receive shielded payouts via Cloak's
 * `partialWithdraw` instructions. Their balance accumulates in shielded
 * UTXOs that the consumer (this component, in production) must persist
 * client-side per Cloak's UTXO model. To convert that shielded balance
 * into spendable SOL on a regular wallet, the creator clicks "Withdraw to
 * wallet" and the SDK runs `fullWithdraw` against the recorded UTXOs.
 *
 * On the devnet flag-off path, this component renders a labeled
 * not-yet-active state. It is mounted on `/studio/[cid]/analytics` either
 * way so creators see what's coming when SORTS migrates to mainnet.
 *
 * UTXO storage: Cloak's design requires the consumer to persist
 * `(privateKey, blinding, amount, index, mintAddress)` per output UTXO.
 * For the v3 demo we keep a stub `useCreatorUtxoStore` hook that returns
 * an empty array on devnet — the actual persistence layer
 * (`frontend/src/lib/solana/cloak-utxo-store.ts`) is planned for v2,
 * tracked in `docs/SUBMISSION_RISKS.md`.
 */

import { useCallback, useState } from 'react';
import { PublicKey } from '@solana/web3.js';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { env } from '@/lib/env';

interface CreatorPayrollWithdrawProps {
  /** Creator wallet address (base58). The SDK withdraws to this address. */
  recipient: string;
}

export function CreatorPayrollWithdraw({ recipient }: CreatorPayrollWithdrawProps) {
  const { connection } = useConnection();
  const { publicKey, signTransaction } = useWallet();
  const [busy, setBusy] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cloakActive = env.NEXT_PUBLIC_ENABLE_CLOAK_MAINNET;

  const onWithdraw = useCallback(async () => {
    if (!cloakActive) return; // disabled in UI; defensive guard
    if (!publicKey || !signTransaction) {
      setError('Connect a Solana wallet first.');
      return;
    }
    setBusy(true);
    setError(null);
    setSignature(null);

    try {
      // v2 will replace with persisted UTXO records.
      const inputUtxos = await loadCreatorUtxos();
      if (inputUtxos.length === 0) {
        setError(
          'No shielded payouts found yet. Subscribers must have paid via the ' +
            'Cloak path before a withdraw is possible. (Note: the in-browser UTXO ' +
            'store is a v2 feature — see docs/SUBMISSION_RISKS.md.)',
        );
        return;
      }

      const { cloakPayrollWithdraw } = await import('@/lib/solana/cloak');
      const result = await cloakPayrollWithdraw({
        connection,
        wallet: { publicKey, signTransaction },
        inputUtxos,
        recipient: new PublicKey(recipient),
      });
      setSignature(result.signature);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Cloak withdraw failed.');
    } finally {
      setBusy(false);
    }
  }, [cloakActive, connection, publicKey, signTransaction, recipient]);

  if (!cloakActive) {
    return (
      <div
        style={{
          padding: 16,
          borderRadius: 12,
          border: '1px solid var(--border-subtle)',
          background: 'var(--bg-card)',
          color: 'var(--text-2)',
          fontSize: 13,
          lineHeight: 1.55,
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            gap: 8,
            alignItems: 'center',
            padding: '2px 10px',
            borderRadius: 999,
            border: '1px solid var(--border-orange)',
            background: 'var(--orange-dim)',
            color: 'var(--orange)',
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            marginBottom: 10,
          }}
        >
          Cloak payroll · mainnet only
        </div>
        <p style={{ marginBottom: 6 }}>
          Private payout via Cloak activates on mainnet. The current devnet build
          uses transparent <code>system_program::transfer</code> for payments.
        </p>
        <p style={{ color: 'var(--text-3)', fontSize: 11.5 }}>
          When SORTS migrates to mainnet (post-submission), shielded balance
          accumulated from subscribers&apos; Cloak payments will be withdrawable
          here. See <code>docs/SUBMISSION_RISKS.md</code> for the in-browser UTXO
          store roadmap.
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: 16,
        borderRadius: 12,
        border: '1px solid var(--border-cyan)',
        background: 'var(--bg-card)',
        color: 'var(--text-1)',
        fontSize: 13,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 10,
        }}
      >
        <div style={{ fontWeight: 600 }}>Cloak payroll · withdraw to wallet</div>
        <span
          style={{
            display: 'inline-flex',
            padding: '2px 10px',
            borderRadius: 999,
            border: '1px solid var(--border-cyan)',
            background: 'var(--cyan-dim)',
            color: 'var(--cyan)',
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}
        >
          Mainnet · pre-alpha
        </span>
      </div>
      <p style={{ color: 'var(--text-2)', marginBottom: 12, lineHeight: 1.55, fontSize: 12.5 }}>
        Pulls all shielded balance from your creator UTXO set into the wallet at{' '}
        <code style={{ fontSize: 11 }}>{recipient.slice(0, 6)}…{recipient.slice(-4)}</code>.
        Cloak withdraw fee (0.005 SOL + 0.3%) is deducted from the payout.
      </p>
      <button
        onClick={onWithdraw}
        disabled={busy}
        style={{
          width: '100%',
          padding: '10px 14px',
          borderRadius: 8,
          border: '1px solid var(--border-cyan)',
          background: busy ? 'var(--cyan-dim)' : 'var(--cyan)',
          color: busy ? 'var(--cyan)' : 'var(--bg-base)',
          fontWeight: 600,
          fontSize: 13,
          cursor: busy ? 'wait' : 'pointer',
        }}
      >
        {busy ? 'Withdrawing…' : 'Withdraw to wallet'}
      </button>
      {signature && (
        <p style={{ marginTop: 10, fontSize: 11.5, color: 'var(--success)' }}>
          Withdraw confirmed: <code>{signature.slice(0, 8)}…</code>
        </p>
      )}
      {error && (
        <p style={{ marginTop: 10, fontSize: 11.5, color: 'var(--danger)' }}>{error}</p>
      )}
    </div>
  );
}

/** Stub UTXO loader. Returns the persisted Cloak UTXO records that have
 *  been credited to this creator. v2 implements actual persistence; the
 *  current build always returns an empty array (so the withdraw button
 *  surfaces the "no payouts yet" message until a real UTXO store ships). */
async function loadCreatorUtxos(): Promise<unknown[]> {
  return [];
}
