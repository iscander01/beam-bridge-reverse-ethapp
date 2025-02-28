import { useBalance, useReadContract } from 'wagmi';
import { erc20Abi } from 'viem';
import { CURRENCIES, CURRENCY_IDS } from '../constants';

interface UseTokenBalanceAndAllowanceProps {
  address: `0x${string}`;
  activeChainId: number;
}

interface BalanceItem {
  decimals: number;
  formatted: string;
  symbol: string;
  value: bigint;
}

interface UseTokenBalanceAndAllowanceResult {
  tokenBalance: BalanceItem | undefined;
  allowance: bigint | undefined;
  ethBalance: BalanceItem | undefined;
  isLoading: boolean;
  error: Error | null;
}

export const useTokenBalanceAndAllowance = ({
  address,
  activeChainId,
}: UseTokenBalanceAndAllowanceProps): UseTokenBalanceAndAllowanceResult => {
  const tokenAddress = CURRENCIES[activeChainId]?.[CURRENCY_IDS.BEAM].ethTokenContract as `0x${string}`;
  const tokenSpenderAddress = CURRENCIES[activeChainId]?.[CURRENCY_IDS.BEAM].ethPipeContract as `0x${string}`;

  const { data: ethBalance, isError } = useBalance({
    query: {
      refetchInterval: 5000,
    },
    address,
  });

  const {
    data: tokenBalance,
    isLoading: isBalanceLoading,
    error: balanceError,
  } = useBalance({
    query: {
      refetchInterval: 5000,
    },
    address,
    token: tokenAddress,
  });

  const {
    data: allowance,
    isLoading: isAllowanceLoading,
    error: allowanceError,
  } = useReadContract({
    query: {
      refetchInterval: 5000,
    },
    address: tokenAddress,
    abi: erc20Abi,
    functionName: 'allowance',
    args: [address, tokenSpenderAddress],
  });

  const isLoading = isBalanceLoading || isAllowanceLoading;
  const error = balanceError || allowanceError;

  return {
    tokenBalance: tokenBalance,
    ethBalance: ethBalance,
    allowance: allowance as bigint | undefined,
    isLoading,
    error,
  };
};
