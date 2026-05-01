'use client';

import { useSortsAccount, useSortsChainId, useSortsPrivy, useSortsSwitchChain } from '@/components/providers/PrivyProvider';
import { ARBITRUM_SEPOLIA_CHAIN_ID, shortenAddress } from '@/lib/chain/useChain';

interface WalletButtonProps {
  size?: 'sm' | 'md';
  showNetworkHint?: boolean;
}

export function WalletButton({ size = 'sm', showNetworkHint = false }: WalletButtonProps) {
  const { ready, authenticated, login, isDemoAuth } = useSortsPrivy();
  const { address } = useSortsAccount();
  const chainId = useSortsChainId();
  const { switchChain } = useSortsSwitchChain();

  const connected = Boolean(authenticated && address);
  const wrongNetwork = Boolean(connected && chainId !== ARBITRUM_SEPOLIA_CHAIN_ID);
  const height = size === 'sm' ? 30 : 38;

  if (isDemoAuth) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: showNetworkHint ? 6 : 0, alignItems: 'flex-start' }}>
        <button className="wallet-button wallet-button-muted" style={{ height }} type="button" disabled>
          <span className="wallet-dot wallet-dot-muted" />
          Privy not configured
        </button>
        {showNetworkHint && (
          <p className="wallet-hint">Add `NEXT_PUBLIC_PRIVY_APP_ID` in `frontend/.env.local` to enable login.</p>
        )}
      </div>
    );
  }

  if (!ready || !connected) {
    return (
      <button className="wallet-button wallet-button-primary" style={{ height }} type="button" onClick={login}>
        <span className="wallet-dot wallet-dot-muted" />
        Connect wallet
      </button>
    );
  }

  if (wrongNetwork) {
    return (
      <button
        className="wallet-button wallet-button-warning"
        style={{ height }}
        type="button"
        onClick={() => switchChain({ chainId: ARBITRUM_SEPOLIA_CHAIN_ID })}
      >
        <span className="wallet-dot wallet-dot-warning" />
        Wrong network
      </button>
    );
  }

  return (
    <button className="wallet-button wallet-button-connected" style={{ height }} type="button">
      <span className="wallet-dot wallet-dot-success" />
      {shortenAddress(address)}
    </button>
  );
}
