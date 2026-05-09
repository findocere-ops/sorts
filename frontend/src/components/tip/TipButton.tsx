'use client';

/**
 * TipButton — sends a one-off tip to a creator.
 *
 * Renders inline near a creator card. Click → modal opens with amount
 * presets + custom input + optional 80-char memo. Confirm → wallet
 * prompt → on-chain tx (transparent on devnet, Cloak-shielded when the
 * mainnet flag is on).
 *
 * Privacy posture: the modal renders <PrivacyModeBadge> prominently so
 * the user sees the active rail label before they confirm. No private
 * claim is ever surfaced unless the active rail actually delivers it.
 */

import { useCallback, useMemo, useState } from 'react';
import { PublicKey } from '@solana/web3.js';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PrivacyModeBadge } from '@/components/badges/PrivacyModeBadge';
import { sendTip, TIP_MEMO_MAX_LENGTH } from '@/lib/solana/tip';
import { solToLamports } from '@/lib/solana/solana-pay';
import { getActivePaymentMode } from '@/lib/solana/privacy-mode';

interface TipButtonProps {
  /** Creator base58 pubkey. */
  recipient: string;
  /** Optional UI hint (creator's display name). */
  label?: string;
  /** Render as block / inline button. Default `inline`. */
  display?: 'inline' | 'block';
}

const PRESET_AMOUNTS = [0.01, 0.1, 1] as const;

export function TipButton({ recipient, label, display = 'inline' }: TipButtonProps) {
  const { connection } = useConnection();
  const { publicKey, signTransaction } = useWallet();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState<number>(0.01);
  const [memo, setMemo] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);

  const recipientKey = useMemo(() => {
    try {
      return new PublicKey(recipient);
    } catch {
      return null;
    }
  }, [recipient]);

  const onClickOpen = useCallback(() => {
    setError(null);
    setSignature(null);
    setOpen(true);
  }, []);

  const onClose = useCallback(() => {
    if (busy) return;
    setOpen(false);
  }, [busy]);

  const onConfirm = useCallback(async () => {
    if (!recipientKey) {
      setError('Invalid recipient address.');
      return;
    }
    if (!publicKey || !signTransaction) {
      setError('Connect a Solana wallet to send a tip.');
      return;
    }
    if (publicKey.equals(recipientKey)) {
      setError('Cannot tip your own wallet.');
      return;
    }
    if (memo.length > TIP_MEMO_MAX_LENGTH) {
      setError(`Memo exceeds ${TIP_MEMO_MAX_LENGTH} chars.`);
      return;
    }
    let lamports: bigint;
    try {
      lamports = solToLamports(amount);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'invalid amount');
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const result = await sendTip({
        connection,
        wallet: { publicKey, signTransaction },
        recipient: recipientKey,
        amountLamports: lamports,
        memo: memo.trim() ? memo.trim() : undefined,
      });
      setSignature(result.signature);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'tip failed');
    } finally {
      setBusy(false);
    }
  }, [amount, memo, connection, publicKey, signTransaction, recipientKey]);

  if (!recipientKey) return null;

  const mode = getActivePaymentMode();
  const buttonStyle: React.CSSProperties = {
    display: display === 'block' ? 'flex' : 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 14px',
    borderRadius: 8,
    border: '1px solid var(--border-cyan)',
    background: 'transparent',
    color: 'var(--cyan)',
    fontWeight: 600,
    fontSize: 13,
    cursor: 'pointer',
    width: display === 'block' ? '100%' : 'auto',
    justifyContent: display === 'block' ? 'center' : 'flex-start',
  };

  return (
    <>
      <button onClick={onClickOpen} style={buttonStyle} aria-label="Send a tip">
        <span aria-hidden>★</span>
        Tip {label ?? `${recipient.slice(0, 4)}…${recipient.slice(-4)}`}
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="tip-modal-title"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
          onClick={onClose}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 'min(420px, calc(100vw - 32px))',
              padding: 20,
              borderRadius: 14,
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-1)',
              display: 'grid',
              gap: 14,
            }}
          >
            <div
              id="tip-modal-title"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <strong style={{ fontSize: 15 }}>Send a tip</strong>
              <button
                onClick={onClose}
                aria-label="Close"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-3)',
                  cursor: 'pointer',
                  fontSize: 18,
                }}
              >
                ×
              </button>
            </div>

            <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.55 }}>
              To <code style={{ fontSize: 11 }}>{recipient.slice(0, 6)}…{recipient.slice(-4)}</code>
              {label && ` (${label})`}
            </div>

            <PrivacyModeBadge variant="full" />

            <div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 6 }}>
                Amount (SOL)
              </div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                {PRESET_AMOUNTS.map((a) => (
                  <button
                    key={a}
                    onClick={() => setAmount(a)}
                    style={{
                      flex: 1,
                      padding: '6px 0',
                      borderRadius: 6,
                      border:
                        amount === a
                          ? '1px solid var(--cyan)'
                          : '1px solid var(--border-subtle)',
                      background: amount === a ? 'var(--cyan-dim)' : 'transparent',
                      color: amount === a ? 'var(--cyan)' : 'var(--text-2)',
                      fontWeight: 600,
                      fontSize: 12,
                      cursor: 'pointer',
                    }}
                  >
                    {a}
                  </button>
                ))}
              </div>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                step="0.001"
                min="0"
                aria-label="Custom amount in SOL"
                style={{
                  width: '100%',
                  padding: 8,
                  borderRadius: 6,
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-elevated)',
                  color: 'var(--text-1)',
                  fontFamily: 'DM Mono, monospace',
                  fontSize: 13,
                }}
              />
            </div>

            <div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 6 }}>
                Memo (optional, ≤ {TIP_MEMO_MAX_LENGTH} chars · public on-chain)
              </div>
              <input
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                maxLength={TIP_MEMO_MAX_LENGTH}
                placeholder="Thanks for the alpha"
                aria-label="Optional public memo"
                style={{
                  width: '100%',
                  padding: 8,
                  borderRadius: 6,
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-elevated)',
                  color: 'var(--text-1)',
                  fontSize: 13,
                }}
              />
              <div style={{ marginTop: 4, fontSize: 10.5, color: 'var(--text-3)' }}>
                {memo.length}/{TIP_MEMO_MAX_LENGTH} · published with the transaction;
                {' '}
                {mode.mode === 'transparent-devnet'
                  ? 'visible to anyone on the explorer.'
                  : 'still public alongside the shielded transfer.'}
              </div>
            </div>

            {error && (
              <div style={{ fontSize: 12, color: 'var(--danger)' }} role="alert">
                {error}
              </div>
            )}
            {signature && (
              <div style={{ fontSize: 12, color: 'var(--success)' }}>
                Sent: <code style={{ fontSize: 11 }}>{signature.slice(0, 12)}…</code>
              </div>
            )}

            <button
              onClick={onConfirm}
              disabled={busy || signature !== null}
              style={{
                padding: '10px 14px',
                borderRadius: 8,
                border: '1px solid var(--border-cyan)',
                background: busy ? 'var(--cyan-dim)' : 'var(--cyan)',
                color: busy ? 'var(--cyan)' : 'var(--bg-base)',
                fontWeight: 700,
                fontSize: 13,
                cursor: busy ? 'wait' : signature ? 'default' : 'pointer',
              }}
            >
              {signature ? 'Sent' : busy ? 'Sending…' : `Tip ${amount} SOL`}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
