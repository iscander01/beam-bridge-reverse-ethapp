import { EXPLORER_API_URL } from '../../../shared/constants/bridge';

export type RatesResponse = Record<string, { usd: number }>;

export async function fetchRates(): Promise<RatesResponse> {
  const r = await fetch(`${EXPLORER_API_URL}/rates`);
  if (!r.ok) throw new Error('Failed to load rates');
  return r.json();
}

export type GasPricesResponse = Record<string, { gasPrice: { hex: string } }>;

export async function fetchGasPrices(): Promise<Record<string, string>> {
  const r = await fetch(`${EXPLORER_API_URL}/gasprices`);
  if (!r.ok) throw new Error('Failed to load gas prices');
  const raw: GasPricesResponse = await r.json();
  return Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, v.gasPrice.hex]));
}

export type BridgeTransaction = {
  hash: string;
  to: string;
  from: string;
  value: string;
  timeStamp: string;
  transactionIndex: string;
};

export async function fetchTokenTransfers(params: {
  address: string;
  tokenContract: string;
  chainId: number;
}): Promise<BridgeTransaction[]> {
  const r = await fetch(
    `${EXPLORER_API_URL}/tokens_transfer/${params.address}/${params.tokenContract}/${params.chainId}`,
  );
  if (!r.ok) return [];
  return r.json();
}

