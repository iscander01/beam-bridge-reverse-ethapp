import { createConfig, http } from 'wagmi';
import { mainnet, arbitrum, arbitrumSepolia } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';

const MAINNET_RPC_URL = process.env.NEXT_PUBLIC_MAINNET_RPC_URL || 'https://eth.llamarpc.com';
const ARBITRUM_RPC_URL = process.env.NEXT_PUBLIC_ARBITRUM_RPC_URL || 'https://arb1.arbitrum.io/rpc';
const ARBITRUM_SEPOLIA_RPC_URL =
  process.env.NEXT_PUBLIC_ARBITRUM_SEPOLIA_RPC_URL || 'https://sepolia-rollup.arbitrum.io/rpc';

export const wagmiConfig = createConfig({
  chains: [mainnet, arbitrum, arbitrumSepolia],
  connectors: [injected()],
  transports: {
    [mainnet.id]: http(MAINNET_RPC_URL),
    [arbitrum.id]: http(ARBITRUM_RPC_URL),
    [arbitrumSepolia.id]: http(ARBITRUM_SEPOLIA_RPC_URL),
  },
  ssr: true,
});

