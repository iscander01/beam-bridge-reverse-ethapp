export type BalanceEntry = {
  name: string;
  symbol: string;
  decimals: number;
  formatted: string;
  value: string;
  kind: 'native' | 'erc20';
  token?: `0x${string}`;
};

export type BalancesResponse = {
  address: `0x${string}`;
  chainId: number;
  balances: Record<string, BalanceEntry>;
};

