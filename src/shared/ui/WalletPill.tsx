import { useState } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { toast } from 'react-toastify';
import { formatActiveAddressString } from '../utils/format';
import { useAddress } from '../hooks/useAddress';
import { IconCopyWhite } from '../icons';

export function WalletPill() {
  const { address, isConnected, connector } = useAccount();
  const { connectors, connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { fullAddress } = useAddress();
  const [copied, setCopied] = useState(false);
  const [showModal, setShowModal] = useState(false);

  if (!isConnected) {
    const mm = connectors.find((c) => c.id === 'metaMask') ?? connectors[0];
    return (
      <button
        onClick={() => mm && connect({ connector: mm })}
        disabled={isPending}
        className="rounded-pill border border-white/15 bg-black/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 disabled:opacity-50"
      >
        {isPending ? 'Connecting…' : 'Connect wallet'}
      </button>
    );
  }

  const formattedAddress = fullAddress ? formatActiveAddressString(fullAddress) : '';

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (fullAddress) {
      try {
        await navigator.clipboard.writeText(fullAddress);
        toast.success('Copied');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        toast.error('Copy failed');
      }
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="rounded-pill border border-white/15 bg-black/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 flex items-center gap-2"
        title={fullAddress || undefined}
      >
        <span>{formattedAddress || 'Connected'}</span>
        {fullAddress && (
          <span
            onClick={handleCopy}
            className="inline-flex items-center cursor-pointer hover:opacity-70 transition"
            title={copied ? 'Copied!' : 'Copy address'}
          >
            <img src={IconCopyWhite as string} alt="Copy" className="h-3.5 w-3.5" />
          </span>
        )}
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div
            className="rounded-2xl border border-white/20 bg-bg-800/95 p-6 max-w-md w-full mx-4 shadow-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-extrabold">{connector?.name || 'Wallet'} Account</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-white/60 hover:text-white transition"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <div className="text-xs font-extrabold tracking-[0.22em] text-white/60 mb-2">ADDRESS</div>
                <div className="break-all text-sm text-white/90 font-mono">{fullAddress || address || '—'}</div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleCopy}
                  className="flex-1 rounded-xl border border-white/20 bg-black/20 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 transition"
                >
                  {copied ? 'Copied!' : 'Copy Address'}
                </button>
                <button
                  onClick={() => {
                    disconnect();
                    setShowModal(false);
                  }}
                  className="flex-1 rounded-xl border border-red-400/50 bg-red-500/20 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500/30 transition"
                >
                  Disconnect
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

