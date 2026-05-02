'use client';

import { WalletButton } from '@/components/auth/WalletButton';
import { CreatorStudioLayout } from '@/components/layout/CreatorStudioLayout';
import { RouteShellPage } from '@/components/layout/RouteShellPage';
import { ContractNotConfigured, TransactionState, WrongNetworkState } from '@/components/states';
import { CreateCommunityWizard } from '@/components/studio/CreateCommunityWizard';
import { ARBITRUM_SEPOLIA_CHAIN_ID, getExplorerTxUrl, useChain } from '@/lib/chain/useChain';

export default function StudioCreatePage() {
  const {
    address,
    chainId,
    readinessState,
    transactionState,
    txHash,
    error,
    factoryConfigured,
    wrongNetwork,
    resetTransaction,
    switchToArbitrumSepolia,
  } = useChain();

  let content: React.ReactNode;

  if (!factoryConfigured) {
    content = <StateWrap><ContractNotConfigured /></StateWrap>;
  } else if (!address || readinessState === 'wallet-not-connected') {
    content = (
      <RouteShellPage
        eyebrow="Wallet required"
        title="Connect a wallet to create a community"
        body="Community creation deploys a new membership contract from your wallet on Arbitrum Sepolia."
        icon="wallet"
      >
        <WalletButton size="md" showNetworkHint />
      </RouteShellPage>
    );
  } else if (wrongNetwork) {
    content = (
      <StateWrap>
        <WrongNetworkState
          currentChainId={chainId}
          targetChainId={ARBITRUM_SEPOLIA_CHAIN_ID}
          onSwitchNetwork={switchToArbitrumSepolia}
        />
      </StateWrap>
    );
  } else if (transactionState !== 'idle') {
    content = (
      <StateWrap>
        <TransactionState
          status={transactionState}
          txHash={txHash}
          error={error}
          explorerUrl={txHash ? getExplorerTxUrl(txHash) : undefined}
          onReset={resetTransaction}
        />
      </StateWrap>
    );
  } else {
    content = <CreateCommunityWizard />;
  }

  return (
    <CreatorStudioLayout title="Create community">
      {content}
    </CreatorStudioLayout>
  );
}

function StateWrap({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 24px' }}>
      {children}
    </div>
  );
}
