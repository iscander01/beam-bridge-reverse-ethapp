import { arbitrumSepolia, mainnet, arbitrum, sepolia } from "viem/chains";
import { CurrenciesByNetworkType } from "../interface/Common";

export const GROTHS_IN_BEAM = 100000000;
export const BEAMX_TVL = 100000000;
export const BEAMX_TVL_STR = "100 000 000";

export const ethId = 4;
export const ETH_RATE_ID = "ethereum";

export const MAX_ALLOWED_VALUE = "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
export const REVOKE_VALUE = "0";

export const CURRENCY_IDS = {
  BEAM: "beam",
  ETH: "eth",
};

export const BEAM_ADDRESS_LENGTH = 66;

export const NETWORK_INDICATOR: {
  [network_id: string]: string 
} = {
  [`${mainnet.id}`]: "eth",
  [`${sepolia.id}`]: "sep",
  [`${arbitrumSepolia.id}`]: "arbsep",
  [`${arbitrum.id}`]: "arb",
}

export const NETWORK_EXPLORER: {
  [network_id: string]: string 
} = {
  [`${mainnet.id}`]: "https://etherscan.io/tx/",
  [`${sepolia.id}`]: "https://sepolia.etherscan.io/tx",
  [`${arbitrumSepolia.id}`]: "https://sepolia.arbiscan.io/tx/",
  [`${arbitrum.id}`]: "https://arbiscan.io/tx/",
}

export const CURRENCIES: CurrenciesByNetworkType = {
  [`${mainnet.id}`]: {
    [CURRENCY_IDS.BEAM]: {
      name: "BEAM",
      rate_id: "beam",
      id: 1,
      decimals: 8,
      validator_dec: 8,
      ethTokenContract: "0xE5AcBB03D73267c03349c76EaD672Ee4d941F499",
      ethPipeContract: "0x6063024646E8A1561970840a4b0e0f1082f5a670",
    },
    [CURRENCY_IDS.ETH]: {
      name: "ETH",
      rate_id: "ethereum",
      id: ethId,
      decimals: 18,
      validator_dec: 8,
      ethTokenContract: "",
      ethPipeContract: "0xF0860856D305803bF2adbEF064CC38bE94A9d006",
    },
  },
  [`${arbitrumSepolia.id}`]: {
    [CURRENCY_IDS.BEAM]: {
      name: "BEAM",
      rate_id: "beam",
      id: 1,
      decimals: 8,
      validator_dec: 8,
      ethTokenContract: "0x0c1284a6e3D75edBfaCCaD54eAB9a0B5f6d6525D",
      ethPipeContract: "0xf5eA79F240b92349D7C27a88656FdAcc9a503A8E",
    },
    [CURRENCY_IDS.ETH]: {
      name: "ETH",
      rate_id: "ethereum",
      id: ethId,
      decimals: 18,
      validator_dec: 8,
      ethTokenContract: "",
      ethPipeContract: "0xF0860856D305803bF2adbEF064CC38bE94A9d006",
    },
  },
  [`${arbitrum.id}`]: {
    [CURRENCY_IDS.BEAM]: {
      name: "BEAM",
      rate_id: "beam",
      id: 1,
      decimals: 8,
      validator_dec: 8,
      ethTokenContract: "0x0c1284a6e3D75edBfaCCaD54eAB9a0B5f6d6525D",
      ethPipeContract: "0xf5eA79F240b92349D7C27a88656FdAcc9a503A8E",
    },
    [CURRENCY_IDS.ETH]: {
      name: "ETH",
      rate_id: "ethereum",
      id: ethId,
      decimals: 18,
      validator_dec: 8,
      ethTokenContract: "",
      ethPipeContract: "0xF0860856D305803bF2adbEF064CC38bE94A9d006",
    },
  },
  [`${sepolia.id}`]: {
    [CURRENCY_IDS.BEAM]: {
      name: "BEAM",
      rate_id: "beam",
      id: 1,
      decimals: 8,
      validator_dec: 8,
      ethTokenContract: "0x0c1284a6e3D75edBfaCCaD54eAB9a0B5f6d6525D",
      ethPipeContract: "0xf5eA79F240b92349D7C27a88656FdAcc9a503A8E",
    },
    [CURRENCY_IDS.ETH]: {
      name: "ETH",
      rate_id: "ethereum",
      id: ethId,
      decimals: 18,
      validator_dec: 8,
      ethTokenContract: "",
      ethPipeContract: "0xF0860856D305803bF2adbEF064CC38bE94A9d006",
    },
  },
};

export const NETWORKS_BY_ID: {
  [id: string]: {
    name: string,
    indicator: string,
    relayerFeeNetworkId: string,
  },
} = {
  "1": {
    name: "Ethereum",
    indicator: "eth",
    relayerFeeNetworkId: "ethereum"
  },
  "11155111": {
    name: "Sepolia",
    indicator: "sep",
    relayerFeeNetworkId: "ethereum-sepolia"
  },
  "421614": {
    name: "Arbitrum Sepolia",
    indicator: "arbsep",
    relayerFeeNetworkId: "arbitrum-sepolia"
  },
  "42161": {
    name: "Arbitrum",
    indicator: "arb",
    relayerFeeNetworkId: "arbitrum",
  }, 
};
