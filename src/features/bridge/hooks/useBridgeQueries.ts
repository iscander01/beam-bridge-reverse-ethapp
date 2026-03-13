import { useQuery } from '@tanstack/react-query';
import { useAccount } from 'wagmi';
import { TOKENS_BY_CHAIN } from '../../../shared/constants/bridge';
import type { BalancesResponse } from '../../../shared/types/balances';
import { fetchTokenTransfers } from '../api/beamExplorer';

const REFRESH_MS = 5000;
const BALANCE_REFRESH_MS = 60_000;
const ALLOWANCE_REFRESH_MS = 60_000;

async function fetchBalances(address: string, chainId: number): Promise<BalancesResponse> {
  const res = await fetch('/api/balances', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address, chainId }),
  });

  if (!res.ok) {
    throw new Error('Failed to load balances');
  }

  return res.json();
}

async function fetchRates() {
  const res = await fetch('/api/rates');
  if (!res.ok) {
    throw new Error('Failed to load rates');
  }
  return res.json();
}

async function fetchGasPrices(): Promise<Record<string, string>> {
  const res = await fetch('/api/gasprices');
  if (!res.ok) {
    throw new Error('Failed to load gas prices');
  }
  return res.json();
}

type AllowanceResponse = {
  allowance: string;
};

async function fetchAllowance(
  address: string,
  chainId: number,
  token: `0x${string}`,
  spender: `0x${string}`,
): Promise<AllowanceResponse> {
  const res = await fetch('/api/allowance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address, chainId, token, spender }),
  });

  if (!res.ok) {
    throw new Error('Failed to load allowance');
  }

  return res.json();
}

type GasEstimateResponse = {
  gas: string;
};

type GasEstimateParams = {
  address: string;
  chainId: number;
  pipe: `0x${string}`;
  kind: 'native' | 'erc20';
  amount: string;
  fee: string;
  beam: string;
  decimals: number;
};

async function fetchGasEstimate(params: GasEstimateParams): Promise<GasEstimateResponse> {
  const res = await fetch('/api/estimate-gas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    throw new Error('Failed to estimate gas');
  }

  return res.json();
}

export function useRatesQuery() {
  return useQuery({
    queryKey: ['rates'],
    queryFn: fetchRates,
    refetchInterval: REFRESH_MS,
  });
}

export function useGasPricesQuery() {
  return useQuery({
    queryKey: ['gasprices'],
    queryFn: fetchGasPrices,
    refetchInterval: REFRESH_MS,
  });
}

export function useBalancesQuery() {
  const { address, chain, chainId } = useAccount();
  const resolvedChainId = chain?.id ?? chainId;

  return useQuery({
    queryKey: ['balances', address, resolvedChainId],
    enabled: Boolean(address && resolvedChainId),
    queryFn: () => fetchBalances(address!, resolvedChainId!),
    refetchInterval: BALANCE_REFRESH_MS,
  });
}

export function useAllowanceQuery(params: {
  address?: string;
  chainId?: number;
  token?: `0x${string}`;
  spender?: `0x${string}`;
  enabled?: boolean;
}) {
  const { address, chainId, token, spender, enabled = true } = params;
  const canFetch = Boolean(enabled && address && chainId && token && spender);

  return useQuery({
    queryKey: ['allowance', address, chainId, token, spender],
    enabled: canFetch,
    queryFn: () => fetchAllowance(address!, chainId!, token!, spender!),
    refetchInterval: ALLOWANCE_REFRESH_MS,
  });
}

export function useGasEstimateQuery(params: {
  address?: string;
  chainId?: number;
  pipe?: `0x${string}`;
  kind?: 'native' | 'erc20';
  amount?: string;
  fee?: string;
  beam?: string;
  decimals?: number;
  enabled?: boolean;
}) {
  const { address, chainId, pipe, kind, amount, fee, beam, decimals, enabled = true } = params;
  const canFetch = Boolean(enabled && address && chainId && pipe && kind && amount && fee && beam && Number.isFinite(decimals));

  return useQuery({
    queryKey: ['gas-estimate', address, chainId, pipe, kind, amount, fee, beam, decimals],
    enabled: canFetch,
    queryFn: () =>
      fetchGasEstimate({
        address: address!,
        chainId: chainId!,
        pipe: pipe!,
        kind: kind!,
        amount: amount!,
        fee: fee!,
        beam: beam!,
        decimals: decimals!,
      }),
  });
}

export function useTransactionsQuery() {
  const { address, chain, chainId } = useAccount();
  const resolvedChainId = chain?.id ?? chainId;

  const token = resolvedChainId ? TOKENS_BY_CHAIN[resolvedChainId]?.wbeam : undefined;

  return useQuery({
    queryKey: ['txs', address, resolvedChainId, token?.token],
    enabled: Boolean(address && resolvedChainId && token?.token),
    queryFn: () =>
      fetchTokenTransfers({
        address: address!,
        chainId: resolvedChainId!,
        tokenContract: token!.token,
      }),
    refetchInterval: REFRESH_MS,
  });
}
