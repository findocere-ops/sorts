'use client';
import { createContext, useContext, useMemo } from 'react';
import { PrivyProvider, usePrivy as useRealPrivy, useWallets as useRealWallets } from '@privy-io/react-auth';
import { WagmiProvider, useAccount as useRealAccount, useChainId as useRealChainId, useReadContract as useRealReadContract, useSignMessage as useRealSignMessage, useSwitchChain as useRealSwitchChain, useWriteContract as useRealWriteContract, usePublicClient as useRealPublicClient } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { arbitrumSepolia } from 'viem/chains';
import { wagmiConfig } from '@/lib/wagmi';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import '@solana/wallet-adapter-react-ui/styles.css';

const queryClient = new QueryClient();
const PLACEHOLDER_PRIVY_APP_ID = 'clxxxxxxxxxxxxxxxx';

// Privy SDK config takes a literal hex string; mirror of `--cyan` in globals.css.
const PRIVY_ACCENT_COLOR = '#2DE8E0';

type DemoAuth = {
  isDemoAuth: true;
  ready: boolean;
  authenticated: boolean;
  user: null;
  login: () => void;
  logout: () => void;
  linkEmail: () => void;
  linkWallet: () => void;
};

const DemoAuthContext = createContext<DemoAuth | null>(null);

function isExplicitDemoMode(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
}

/** Solana wallet stack — wraps every children render so SolanaChainAdapter
 *  (in `frontend/src/lib/chain/adapters/SolanaChainAdapter.ts`) can call
 *  `useWallet()` and `useConnection()` regardless of the demo / Privy branch.
 *
 *  Privy 1.90 does not yet ship a Solana connector, so per the Day-3 cut-line
 *  gate we wire the standard `@solana/wallet-adapter-react` stack here and
 *  keep Privy for email/auth identity. When Privy publishes a 1.x-compatible
 *  Solana connector, the adapter list below can be replaced with it. */
function SolanaProviders({ children }: { children: React.ReactNode }) {
  const endpoint =
    process.env.NEXT_PUBLIC_SOLANA_DEVNET_RPC_URL || 'https://api.devnet.solana.com';
  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
    [],
  );
  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  const isPlaceholderAppId = !appId || appId === PLACEHOLDER_PRIVY_APP_ID;
  const demoMode = isExplicitDemoMode();

  // Production *runtime* without a real Privy app id must explicitly opt in to
  // the demo stub. This stops a misconfigured deploy from silently shipping a
  // no-auth UI. NEXT_PHASE is `phase-production-build` while `next build` is
  // running, in which case static pre-render proceeds with the demo stub.
  const isRuntimeProd =
    process.env.NODE_ENV === 'production' &&
    process.env.NEXT_PHASE !== 'phase-production-build';
  if (isPlaceholderAppId && !demoMode && isRuntimeProd) {
    throw new Error(
      'NEXT_PUBLIC_PRIVY_APP_ID is missing in production. ' +
        'Set it to a real Privy app id, or set NEXT_PUBLIC_DEMO_MODE=true to ship the demo-only stub.',
    );
  }

  if (isPlaceholderAppId) {
    const demoAuth: DemoAuth = {
      isDemoAuth: true,
      ready: true,
      authenticated: false,
      user: null,
      login: () => {
        window.alert(
          'Demo mode active. Set NEXT_PUBLIC_PRIVY_APP_ID in frontend/.env.local to enable wallet login.',
        );
      },
      logout: () => undefined,
      linkEmail: () => undefined,
      linkWallet: () => undefined,
    };

    return (
      <DemoAuthContext.Provider value={demoAuth}>
        <SolanaProviders>
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        </SolanaProviders>
      </DemoAuthContext.Provider>
    );
  }

  return (
    <PrivyProvider
      appId={appId}
      config={{
        loginMethods: ['email', 'wallet'],
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
        },
        // Privy 1.90 supports EVM chains only — Solana wallet connection runs
        // through `@solana/wallet-adapter-react` (mounted by SolanaProviders).
        // Arbitrum stays Privy-managed for the legacy `?chain=arbitrum-sepolia`
        // flow.
        defaultChain: arbitrumSepolia,
        supportedChains: [arbitrumSepolia],
        appearance: {
          theme: 'dark',
          accentColor: PRIVY_ACCENT_COLOR,
        },
      }}
    >
      <WagmiProvider config={wagmiConfig}>
        <SolanaProviders>
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        </SolanaProviders>
      </WagmiProvider>
    </PrivyProvider>
  );
}

export function useSortsPrivy() {
  const demo = useContext(DemoAuthContext);
  if (demo) return demo;
  return { ...useRealPrivy(), isDemoAuth: false as const };
}

export function useSortsWallets() {
  const demo = useContext(DemoAuthContext);
  if (demo) return { wallets: [] };
  return useRealWallets();
}

export function useSortsAccount() {
  const demo = useContext(DemoAuthContext);
  if (demo) return { address: undefined };
  return useRealAccount();
}

export function useSortsChainId() {
  const demo = useContext(DemoAuthContext);
  if (demo) return arbitrumSepolia.id;
  return useRealChainId();
}

export function useSortsSwitchChain() {
  const demo = useContext(DemoAuthContext);
  if (demo) return { switchChain: () => undefined };
  return useRealSwitchChain();
}

export function useSortsWriteContract() {
  const demo = useContext(DemoAuthContext);
  if (demo) {
    return {
      writeContractAsync: async () => {
        throw new Error('Set NEXT_PUBLIC_PRIVY_APP_ID to enable wallet transactions.');
      },
      isPending: false,
    };
  }
  return useRealWriteContract();
}

export function useSortsReadContract(args: Parameters<typeof useRealReadContract>[0]) {
  const demo = useContext(DemoAuthContext);
  if (demo) return { data: undefined, refetch: async () => ({ data: undefined }) };
  return useRealReadContract(args);
}

export function useSortsSignMessage() {
  const demo = useContext(DemoAuthContext);
  if (demo) {
    return {
      signMessageAsync: async () => {
        throw new Error('Set NEXT_PUBLIC_PRIVY_APP_ID to enable wallet signatures.');
      },
      isPending: false,
    };
  }
  return useRealSignMessage();
}

export function useSortsPublicClient() {
  const demo = useContext(DemoAuthContext);
  if (demo) return undefined;
  return useRealPublicClient();
}
