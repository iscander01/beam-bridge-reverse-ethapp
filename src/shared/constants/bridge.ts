import { arbitrum, arbitrumSepolia, mainnet } from 'viem/chains';

export const BEAM_ADDRESS_LENGTH = 66;

// Matches legacy naming used in older bridge apps/snippets.
// ETH asset id is typically treated as the "native" asset.
export const ethId = 0;

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

export type BridgeAsset = {
  name: string;
  /** Key used by explorer-api `/rates` response */
  rateId: string;
  id: number;
  decimals: number;
  validatorDecimals: number;
  ethTokenContract: `0x${string}` | '';
  ethPipeContract: `0x${string}`;
  kind: 'erc20' | 'native';
};

export const ASSETS_BY_CHAIN: Partial<Record<number, BridgeAsset[]>> = {
  [mainnet.id]: [
    {
      name: 'USDT',
      rateId: 'tether',
      id: 1,
      decimals: 6,
      validatorDecimals: 6,
      ethTokenContract: '0x7D5D7c75d60BcaCD948cf3aCdEa164986b1f0755',
      ethPipeContract: '0xE1843841d03C46BFBf7ae027640fD921dE5F8f53',
      kind: 'erc20',
    },
    {
      name: 'WBTC',
      rateId: 'wrapped-bitcoin',
      id: 2,
      decimals: 8,
      validatorDecimals: 6,
      ethTokenContract: '0xFf42D250DC5111E58FD7e43e400097f3fDE65b18',
      ethPipeContract: '0x8a7F12320052f20A40fD6815509A17236b8C7A0E',
      kind: 'erc20',
    },
    {
      name: 'DAI',
      rateId: 'dai',
      id: 3,
      decimals: 18,
      validatorDecimals: 8,
      ethTokenContract: '0xAC7CD333aC49A98C0C18A550ac03e4935B8d1CBE',
      ethPipeContract: '0xb8cA4dCe56f895eEEe65f88945cf379166844bc1',
      kind: 'erc20',
    },
    {
      name: 'ETH',
      rateId: 'ethereum',
      id: ethId,
      decimals: 18,
      validatorDecimals: 8,
      ethTokenContract: '',
      ethPipeContract: '0xF0860856D305803bF2adbEF064CC38bE94A9d006',
      kind: 'native',
    },
  ],
};

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
