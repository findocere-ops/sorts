'use client';

import dynamic from 'next/dynamic';

/** Standard Solana wallet adapter UI button.
 *
 *  We dynamically import `WalletMultiButton` with `ssr: false` because the
 *  underlying component reads `window` at module load time and Next.js
 *  server-rendering would crash. */
const WalletMultiButton = dynamic(
  async () =>
    (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
  { ssr: false },
);

export function SolanaWalletButton() {
  return <WalletMultiButton />;
}
