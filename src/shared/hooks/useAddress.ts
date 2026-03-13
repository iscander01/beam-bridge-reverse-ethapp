'use client';

import { useAccount } from 'wagmi';
import { useEffect, useState } from 'react';

export function useAddress(): { fullAddress: string | null } {
  const { address } = useAccount();
  const [fullAddress, setFullAddress] = useState<string | null>(null);

  useEffect(() => {
    if (address) {
      setFullAddress(address);
    } else {
      setFullAddress(null);
    }
  }, [address]);

  return { fullAddress };
}

