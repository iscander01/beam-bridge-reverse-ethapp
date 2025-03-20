import { http, createConfig } from 'wagmi';
import { mainnet, arbitrum, arbitrumSepolia, sepolia } from 'wagmi/chains';
import { injected, metaMask, safe } from 'wagmi/connectors';

export const config = createConfig({
  chains: [
    mainnet,
    // sepolia,
    arbitrum,
    arbitrumSepolia,
  ],
  connectors: [
    metaMask(),
  ],
  transports: {
    [mainnet.id]: http(),
    // [sepolia.id]: http(),
    [arbitrum.id]: http(),
    [arbitrumSepolia.id]: http(),
  },
})