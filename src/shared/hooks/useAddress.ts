import { useAccount } from 'wagmi';
import { useEffect, useState } from 'react';
import { NETWORK_INDICATOR } from '../constants/bridge';

export function useAddress(): { fullAddress: string | null } {
  const { address, chain } = useAccount();
  const [fullAddress, setFullAddress] = useState<string | null>(null);

  useEffect(() => {
    if (address && chain?.id) {
      const indicator = NETWORK_INDICATOR[chain.id];
      setFullAddress(indicator ? `${address}${indicator}` : address);
    } else {
      setFullAddress(null);
    }
  }, [address, chain?.id]);

  return { fullAddress };
}

