import { arbitrum, arbitrumSepolia, mainnet } from 'viem/chains';

export const BEAM_ADDRESS_LENGTH = 66;

export const NETWORK_INDICATOR: Record<number, string> = {
  [mainnet.id]: 'eth',
  [arbitrum.id]: 'arb',
  [arbitrumSepolia.id]: 'arbsep',
};

export const NETWORK_EXPLORER_TX: Record<number, string> = {
  [mainnet.id]: 'https://etherscan.io/tx/',
  [arbitrum.id]: 'https://arbiscan.io/tx/',
  [arbitrumSepolia.id]: 'https://sepolia.arbiscan.io/tx/',
};

export const GAS_PRICE_NETWORK_KEY: Partial<Record<number, string>> = {
  [mainnet.id]: 'ethereum',
  [arbitrum.id]: 'arbitrum',
  [arbitrumSepolia.id]: 'arbitrum-sepolia',
};

export const EXPLORER_API_URL = 'https://explorer-api.beam.mw/bridges';

export const TOKENS_BY_CHAIN: Record<number, {
  wbeam: {
    name: 'WBEAM';
    symbol: 'WBEAM';
    decimals: number;
    rateId: 'beam';
    token: `0x${string}`;
    pipe: `0x${string}`;
  };
}> = {
  [mainnet.id]: {
    wbeam: {
      name: 'WBEAM',
      symbol: 'WBEAM',
      decimals: 8,
      rateId: 'beam',
      token: '0xE5AcBB03D73267c03349c76EaD672Ee4d941F499',
      pipe: '0x6063024646E8A1561970840a4b0e0f1082f5a670',
    },
  },
  [arbitrum.id]: {
    wbeam: {
      name: 'WBEAM',
      symbol: 'WBEAM',
      decimals: 8,
      rateId: 'beam',
      token: '0xE5AcBB03D73267c03349c76EaD672Ee4d941F499',
      pipe: '0x6063024646E8A1561970840a4b0e0f1082f5a670',
    },
  },
  [arbitrumSepolia.id]: {
    wbeam: {
      name: 'WBEAM',
      symbol: 'WBEAM',
      decimals: 8,
      rateId: 'beam',
      token: '0x0c1284a6e3D75edBfaCCaD54eAB9a0B5f6d6525D',
      pipe: '0xf5eA79F240b92349D7C27a88656FdAcc9a503A8E',
    },
  },
};
