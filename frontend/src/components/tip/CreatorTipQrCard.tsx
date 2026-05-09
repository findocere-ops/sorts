'use client';

/**
 * Creator-side QR code generator. Mounted on `/studio/[cid]/settings`.
 *
 * Renders a Solana Pay URI (`solana:<creator>?label=…&message=SORTS`)
 * as a QR code. Subscribers using Phantom mobile (or any Solana Pay
 * compatible wallet) scan it natively — no in-browser scanner needed
 * on the subscriber side.
 *
 * Privacy posture: the URI carries the creator address in plaintext.
 * Whoever scans the QR sees who they are paying. That is intended:
 * tipping needs a recipient. The wallet's tx-build then routes through
 * `tip.ts`, so the active payment-rail (transparent on devnet, Cloak
 * on mainnet) determines the privacy of the actual transfer.
 *
 * The QR itself is rendered with `qrcode.react` (already installed).
 * The component is dynamically importable; pages that don't render it
 * pay zero bundle cost.
 */

import { useMemo, useState } from 'react';
import { PublicKey } from '@solana/web3.js';
import { QRCodeSVG } from 'qrcode.react';
import { PrivacyModeBadge } from '@/components/badges/PrivacyModeBadge';
import { buildSolanaPayUrl } from '@/lib/solana/solana-pay';

interface CreatorTipQrCardProps {
  /** Creator base58 pubkey. */
  creator: string;
  /** Optional community label baked into the QR `label` param. */
  communityName?: string;
}

export function CreatorTipQrCard({ creator, communityName }: CreatorTipQrCardProps) {
  const [presetAmount, setPresetAmount] = useState<number | undefined>(undefined);

  const url = useMemo(() => {
    let recipient: PublicKey;
    try {
      recipient = new PublicKey(creator);
    } catch {
      return null;
    }
    return buildSolanaPayUrl({
      recipient,
      amount: presetAmount,
      label: communityName ? `Tip ${communityName}` : undefined,
      message: 'SORTS · creator tip',
    });
  }, [creator, communityName, presetAmount]);

  const onCopy = () => {
    if (!url) return;
    navigator.clipboard?.writeText(url);
  };

  if (!url) {
    return (
      <div
        style={{
          padding: 16,
          borderRadius: 12,
          border: '1px solid var(--border-subtle)',
          background: 'var(--bg-card)',
          color: 'var(--text-3)',
          fontSize: 12.5,
        }}
      >
        Cannot render QR — invalid creator address: <code>{creator}</code>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: 18,
        borderRadius: 12,
        border: '1px solid var(--border-cyan)',
        background: 'var(--bg-card)',
        color: 'var(--text-1)',
        fontSize: 13,
        display: 'grid',
        gap: 14,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
        }}
      >
        <strong style={{ fontSize: 14 }}>Tip via QR code</strong>
        <PrivacyModeBadge />
      </div>

      <p
        style={{
          margin: 0,
          fontSize: 12.5,
          color: 'var(--text-2)',
          lineHeight: 1.55,
        }}
      >
        Subscribers can scan this QR with Phantom mobile or any Solana Pay
        compatible wallet to send a tip. The payment rail follows the
        active mode shown above; it is not a privacy primitive itself.
      </p>

      <div
        style={{
          display: 'flex',
          gap: 14,
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            background: 'white',
            padding: 12,
            borderRadius: 10,
            display: 'inline-flex',
          }}
        >
          <QRCodeSVG value={url} size={180} level="M" />
        </div>

        <div style={{ flex: 1, minWidth: 200, display: 'grid', gap: 8 }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>
              Optional preset amount (SOL)
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {[undefined, 0.1, 1, 5].map((v) => (
                <button
                  key={String(v)}
                  onClick={() => setPresetAmount(v)}
                  style={{
                    padding: '5px 10px',
                    fontSize: 11.5,
                    fontWeight: 600,
                    borderRadius: 6,
                    border:
                      presetAmount === v
                        ? '1px solid var(--cyan)'
                        : '1px solid var(--border-subtle)',
                    background: presetAmount === v ? 'var(--cyan-dim)' : 'transparent',
                    color: presetAmount === v ? 'var(--cyan)' : 'var(--text-2)',
                    cursor: 'pointer',
                  }}
                >
                  {v === undefined ? 'Any' : v}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>
              URI
            </div>
            <code
              style={{
                display: 'block',
                fontSize: 10.5,
                wordBreak: 'break-all',
                padding: 8,
                borderRadius: 6,
                background: 'var(--bg-elevated)',
                color: 'var(--text-2)',
              }}
            >
              {url}
            </code>
            <button
              onClick={onCopy}
              style={{
                marginTop: 6,
                padding: '5px 10px',
                fontSize: 11.5,
                borderRadius: 6,
                border: '1px solid var(--border-subtle)',
                background: 'transparent',
                color: 'var(--text-1)',
                cursor: 'pointer',
              }}
            >
              Copy URI
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
