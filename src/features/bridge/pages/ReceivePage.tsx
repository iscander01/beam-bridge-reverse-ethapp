'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import { toast } from 'react-toastify';
import { Panel } from '../../../shared/ui/Panel';
import { PrimaryButton } from '../../../shared/ui/PrimaryButton';
import { BeamMark } from '../../../shared/ui/BeamMark';
import { formatEvmBridgeAddress } from '../../../shared/utils/beamAddress';

export function ReceivePage() {
  const { address, chain, chainId, isConnected } = useAccount();
  const resolvedChainId = chain?.id ?? chainId;
  const [copied, setCopied] = useState(false);

  const bridgeAddress = useMemo(() => {
    if (!address || !resolvedChainId) return '';
    return formatEvmBridgeAddress(address, resolvedChainId);
  }, [address, resolvedChainId]);

  return (
    <div className="space-y-6">
      <Panel>
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-lg font-extrabold">
              <span className="inline-flex items-center gap-2 leading-none">
                <span className="inline-flex items-center gap-2">
                  <span>BEAM</span>
                  <BeamMark className="h-4 w-4 text-white/70" />
                  <span>→ WBEAM</span>
                </span>
                <NetworkIcon chainId={resolvedChainId} className="block h-4 w-4 shrink-0 text-white/70" />
              </span>
            </div>
            <div className="mt-1 text-sm text-white/60">Copy your EVM bridge address and paste into Beam Wallet.</div>
          </div>
          <Link href="/">
            <span className="text-sm font-semibold text-white/60 hover:text-white">Back</span>
          </Link>
        </div>

        <div className="mt-6 rounded-xl border border-white/10 bg-black/10 p-4">
          <div className="text-xs font-extrabold tracking-[0.22em] text-white/60">YOUR {chain?.name?.toUpperCase() ?? 'NETWORK'} BRIDGE ADDRESS</div>
          <div className="mt-3 break-all text-sm text-white/90">{isConnected ? bridgeAddress : 'Connect wallet first.'}</div>

          <div className="mt-5 flex flex-wrap gap-3">
            <PrimaryButton
              tone="blue"
              disabled={!bridgeAddress}
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(bridgeAddress);
                  toast.success('Copied');
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                } catch {
                  toast.error('Copy failed');
                }
              }}
            >
              {copied ? 'Copied' : 'Copy'}
            </PrimaryButton>
          </div>
        </div>
      </Panel>

      <Panel>
        <div className="text-sm text-white/70">
          <div className="font-extrabold tracking-wide">How to use</div>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-white/60">
            <li>Install the latest Beam Wallet.</li>
            <li>Open Bridges DApp inside the wallet.</li>
            <li>Select “Beam to Ethereum”.</li>
            <li>Paste the address above into the “Ethereum Bridge Address” field.</li>
          </ol>
        </div>
      </Panel>
    </div>
  );
}

function NetworkIcon({ chainId, className = 'h-4 w-4' }: { chainId?: number; className?: string }) {
  const title = chainId === 42161 ? 'Arbitrum' : chainId === 1 ? 'Ethereum' : 'Network';

  if (chainId === 1) {
    return (
      <svg viewBox="0 0 256 417" className={className} aria-label={title} role="img">
        <title>{title}</title>
        <path
          d="M127.9 0L124.7 10.9v270.1l3.2 3.2 127.9-75.6L127.9 0z"
          fill="currentColor"
          opacity="0.9"
        />
        <path d="M127.9 0L0 208.6l127.9 75.6V0z" fill="currentColor" opacity="0.65" />
        <path d="M127.9 306.6l-1.8 2.2v106.9l1.8 0.5 128-180.3-128 70.7z" fill="currentColor" opacity="0.9" />
        <path d="M127.9 416.2V306.6L0 235.9l127.9 180.3z" fill="currentColor" opacity="0.65" />
        <path d="M127.9 284.2l127.9-75.6-127.9-58.1v133.7z" fill="currentColor" opacity="0.75" />
        <path d="M0 208.6l127.9 75.6V150.5L0 208.6z" fill="currentColor" opacity="0.55" />
      </svg>
    );
  }

  if (chainId === 42161) {
    return (
      <svg viewBox="0 0 64 64" className={className} aria-label={title} role="img">
        <title>{title}</title>
        <path
          d="M32 3.5 56.7 17.8v28.4L32 60.5 7.3 46.2V17.8L32 3.5Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          opacity="0.9"
        />
        {/* Arbitrum “A” mark (official paths scaled to 64x64) */}
        <g transform="scale(0.2689)">
          {/* right-side slashes (originally blue) */}
          <path
            d="M135.889 136.336L124.853 166.611C124.554 167.453 124.554 168.37 124.853 169.212L143.838 221.305L165.796 208.619L139.442 136.336C138.844 134.671 136.487 134.671 135.889 136.336Z"
            fill="currentColor"
            opacity="0.65"
          />
          <path
            d="M158.015 85.4221C157.416 83.7568 155.059 83.7568 154.461 85.4221L143.426 115.697C143.126 116.539 143.126 117.456 143.426 118.298L174.53 203.585L196.488 190.899L158.015 85.4221Z"
            fill="currentColor"
            opacity="0.65"
          />
          {/* left-side slashes (originally white) */}
          <path
            d="M111.949 63.7168H90.72C89.1301 63.7168 87.7087 64.7085 87.1663 66.2054L41.6602 191.011L63.6183 203.698L113.726 66.2616C114.193 65.0266 113.277 63.7168 111.949 63.7168Z"
            fill="currentColor"
            opacity="0.9"
          />
          <path
            d="M149.095 63.7168H127.866C126.276 63.7168 124.855 64.7085 124.312 66.2054L72.3535 208.712L94.3117 221.399L150.872 66.2616C151.321 65.0266 150.404 63.7168 149.095 63.7168Z"
            fill="currentColor"
            opacity="0.9"
          />
        </g>
      </svg>
    );
  }

  return (
    <span
      className={className + ' inline-flex items-center justify-center rounded-full border border-white/20 text-[10px] font-bold text-white/70'}
      title={title}
    >
      ?
    </span>
  );
}
