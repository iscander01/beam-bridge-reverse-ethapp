import { createConfig, http } from 'wagmi';
import { mainnet, arbitrum, arbitrumSepolia } from 'wagmi/chains';
import { metaMask } from 'wagmi/connectors';

export const wagmiConfig = createConfig({
  chains: [mainnet, arbitrum, arbitrumSepolia],
  connectors: [metaMask()],
  transports: {
    [mainnet.id]: http(),
    [arbitrum.id]: http(),
    [arbitrumSepolia.id]: http(),
  },
});

