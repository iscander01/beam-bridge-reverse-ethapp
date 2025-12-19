import { useQuery } from '@tanstack/react-query';
import { useAccount } from 'wagmi';
import { TOKENS_BY_CHAIN } from '../../../shared/constants/bridge';
import { fetchGasPrices, fetchRates, fetchTokenTransfers } from '../api/beamExplorer';

const REFRESH_MS = 5000;

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

export function useTransactionsQuery() {
  const { address, chain } = useAccount();

  const token = chain?.id ? TOKENS_BY_CHAIN[chain.id]?.wbeam : undefined;

  return useQuery({
    queryKey: ['txs', address, chain?.id, token?.token],
    enabled: Boolean(address && chain?.id && token?.token),
    queryFn: () =>
      fetchTokenTransfers({
        address: address!,
        chainId: chain!.id,
        tokenContract: token!.token,
      }),
    refetchInterval: REFRESH_MS,
  });
}
