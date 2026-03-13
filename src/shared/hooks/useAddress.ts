'use client';

import { useAccount } from 'wagmi';
import { useEffect, useState } from 'react';
import { NETWORK_INDICATOR } from '../constants/bridge';

export function useAddress(): { fullAddress: string | null } {
  const { address, chain, chainId } = useAccount();
  const resolvedChainId = chain?.id ?? chainId;
  const [fullAddress, setFullAddress] = useState<string | null>(null);

  useEffect(() => {
    if (address && resolvedChainId) {
      const indicator = NETWORK_INDICATOR[resolvedChainId];
      setFullAddress(indicator ? `${address}${indicator}` : address);
    } else {
      setFullAddress(null);
    }
  }, [address, resolvedChainId]);

  return { fullAddress };
}

