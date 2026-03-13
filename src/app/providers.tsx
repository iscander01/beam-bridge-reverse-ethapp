'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { ToastContainer } from 'react-toastify';
import { wagmiConfig } from '@/app/wagmi';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
        <ToastContainer
          position="bottom-right"
          theme="dark"
          autoClose={3000}
          hideProgressBar
          icon={false}
          toastStyle={{
            background: 'rgba(255, 255, 255, 0.12)',
            border: '1px solid rgba(255, 255, 255, 0.22)',
            color: 'rgba(255, 255, 255, 0.96)',
            backdropFilter: 'blur(10px)',
          }}
          newestOnTop
          closeOnClick
          pauseOnHover
          draggable
        />
      </QueryClientProvider>
    </WagmiProvider>
  );
}

