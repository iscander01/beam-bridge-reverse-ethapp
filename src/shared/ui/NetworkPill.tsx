'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useAccount, useSwitchChain } from 'wagmi';
import { mainnet } from 'wagmi/chains';

export function NetworkPill() {
  const { chainId, isConnected } = useAccount();
  const { chains, switchChain, isPending } = useSwitchChain();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const didAutoSelectDefaultRef = useRef(false);

  // Filter out Arbitrum Sepolia (421614) like the old project
  const availableChains = useMemo(() => chains.filter((c) => c.id !== 421614), [chains]);

  const selectedChain = useMemo(() => {
    if (!chainId) return undefined;
    return chains.find((c) => c.id === chainId);
  }, [chainId, chains]);

  const displayName = selectedChain
    ? selectedChain.id === 42161
      ? 'Arbitrum'
      : selectedChain.name
    : 'Select network';

  // Ensure we have a deterministic default chain after connect (once per connect),
  // without fighting other flows (e.g. SendPage switching based on address indicator).
  useEffect(() => {
    if (!isConnected) {
      didAutoSelectDefaultRef.current = false;
      return;
    }
    if (didAutoSelectDefaultRef.current) return;
    if (isPending) return;
    if (!chains.some((c) => c.id === mainnet.id)) {
      didAutoSelectDefaultRef.current = true;
      return;
    }
    if (chainId !== mainnet.id) {
      didAutoSelectDefaultRef.current = true;
      switchChain?.({ chainId: mainnet.id });
      return;
    }
    didAutoSelectDefaultRef.current = true;
  }, [chainId, chains, isConnected, isPending, switchChain]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isPending || !isConnected}
        className="flex items-center gap-2 rounded-pill border border-white/15 bg-black/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        <span className="max-w-[140px] truncate sm:max-w-none">{displayName}</span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
        >
          <path
            d="M3 4.5L6 7.5L9 4.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {isOpen && (
        <div
          className="absolute left-0 right-0 mt-2 w-[min(92vw,320px)] max-h-80 overflow-y-auto rounded-xl border border-white/20 bg-bg-700/98 backdrop-blur shadow-[0_8px_32px_rgba(0,0,0,0.4)] z-50 network-menu sm:left-auto sm:right-0 sm:min-w-[280px] sm:w-auto"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(255, 255, 255, 0.2) rgba(255, 255, 255, 0.05)',
          }}
        >
            {availableChains.map((c, index) => {
              const isFirst = index === 0;
              const isLast = index === availableChains.length - 1;
              const isSelected = c.id === chainId;
              const itemRadius =
                isFirst && isLast
                  ? 'rounded-xl'
                  : isFirst
                  ? 'rounded-t-xl'
                  : isLast
                  ? 'rounded-b-xl'
                  : '';

              return (
                <button
                  key={c.id}
                  onClick={() => {
                    if (c.id !== chainId) {
                      switchChain?.({ chainId: c.id });
                    }
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2.5 text-sm transition ${
                    isSelected
                      ? 'bg-white/10 font-semibold'
                      : 'bg-transparent font-medium hover:bg-white/15'
                  } ${itemRadius} m-0`}
                >
                  <span className="block truncate">
                    {c.id === 42161 ? 'Arbitrum' : c.name}
                  </span>
                </button>
              );
            })}
        </div>
      )}
    </div>
  );
}
