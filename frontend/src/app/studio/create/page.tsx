'use client';

import { Suspense } from 'react';
import { WalletButton } from '@/components/auth/WalletButton';
import { SolanaWalletButton } from '@/components/wallet/SolanaWalletButton';
import { CreatorStudioLayout } from '@/components/layout/CreatorStudioLayout';
import { RouteShellPage } from '@/components/layout/RouteShellPage';
import { ContractNotConfigured, TransactionState } from '@/components/states';
import { CreateCommunityWizard } from '@/components/studio/CreateCommunityWizard';
import { useChain } from '@/lib/chain/useChain';
import { CHAINS } from '@/lib/chain/chains';

export default function StudioCreatePage() {
  // useSearchParams() — wrap in Suspense per Next.js App Router contract.
  return (
    <Suspense fallback={null}>
      <StudioCreateInner />
    </Suspense>
  );
}

function StudioCreateInner() {
  const adapter = useChain();
  const chainEntry = CHAINS[adapter.chain];

  let content: React.ReactNode;

  if (
    adapter.readinessState === 'program-not-configured' ||
    adapter.readinessState === 'factory-not-configured'
  ) {
    content = <StateWrap><ContractNotConfigured chain={adapter.chain} /></StateWrap>;
  } else if (!adapter.address || adapter.readinessState === 'wallet-not-connected') {
    content = (
      <RouteShellPage
        eyebrow="Wallet required"
        title={
          adapter.chain === 'solana-devnet'
            ? 'Connect a Solana wallet to create a community'
            : 'Connect a wallet to create a community'
        }
        body={
          adapter.chain === 'solana-devnet'
            ? `Community creation deploys a community account from your wallet on ${chainEntry.label}.`
            : `Community creation deploys a new membership contract from your wallet on ${chainEntry.label}.`
        }
        icon="wallet"
      >
        {adapter.chain === 'solana-devnet' ? (
          <SolanaWalletButton />
        ) : (
          <WalletButton size="md" showNetworkHint />
        )}
      </RouteShellPage>
    );
  } else if (adapter.transactionState !== 'idle') {
    content = (
      <StateWrap>
        <TransactionState
          status={adapter.transactionState}
          txHash={adapter.txHash}
          error={adapter.error}
          explorerUrl={adapter.txHash ? adapter.getExplorerTxUrl(adapter.txHash) : undefined}
          onReset={adapter.resetTransaction}
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
