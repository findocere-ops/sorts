'use client';
import { createContext, useContext } from 'react';
import { PrivyProvider, usePrivy as useRealPrivy, useWallets as useRealWallets } from '@privy-io/react-auth';
import { WagmiProvider, useAccount as useRealAccount, useChainId as useRealChainId, useReadContract as useRealReadContract, useSignMessage as useRealSignMessage, useSwitchChain as useRealSwitchChain, useWriteContract as useRealWriteContract, usePublicClient as useRealPublicClient } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { arbitrumSepolia } from 'viem/chains';
import { wagmiConfig } from '@/lib/wagmi';

const queryClient = new QueryClient();
const PLACEHOLDER_PRIVY_APP_ID = 'clxxxxxxxxxxxxxxxx';

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

export function Providers({ children }: { children: React.ReactNode }) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  const shouldUseDemoAuth = !appId || appId === PLACEHOLDER_PRIVY_APP_ID;

  if (shouldUseDemoAuth) {
    const demoAuth: DemoAuth = {
      isDemoAuth: true,
      ready: true,
      authenticated: false,
      user: null,
      login: () => {
        window.alert('Set NEXT_PUBLIC_PRIVY_APP_ID in frontend/.env.local to enable wallet login.');
      },
      logout: () => undefined,
      linkEmail: () => undefined,
      linkWallet: () => undefined,
    };

    return (
      <DemoAuthContext.Provider value={demoAuth}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
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
        defaultChain: arbitrumSepolia,
        supportedChains: [arbitrumSepolia],
        appearance: {
          theme: 'dark',
          accentColor: '#5b8ef5',
        },
      }}
    >
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
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
