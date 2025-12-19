import { Link } from 'react-router-dom';
import { useAccount, useBalance } from 'wagmi';
import { formatUnits } from 'viem';
import { TOKENS_BY_CHAIN, NETWORK_EXPLORER_TX } from '../../../shared/constants/bridge';
import { Panel } from '../../../shared/ui/Panel';
import { PrimaryButton } from '../../../shared/ui/PrimaryButton';
import { compactHash, formatNumber, usd } from '../../../shared/utils/format';
import { useRatesQuery, useTransactionsQuery } from '../hooks/useBridgeQueries';
import { IconBeam, IconEth } from '../../../shared/icons';

export function HomePage() {
  const { address, chain, isConnected } = useAccount();
  const token = chain?.id ? TOKENS_BY_CHAIN[chain.id]?.wbeam : undefined;

  const ethBal = useBalance({ address, query: { refetchInterval: 5000, enabled: Boolean(address) } });
  const wbeamBal = useBalance({
    address,
    token: token?.token,
    query: { refetchInterval: 5000, enabled: Boolean(address && token?.token) },
  });

  const rates = useRatesQuery();
  const txs = useTransactionsQuery();

  const ethRateUsd = rates.data?.eth?.usd ?? 0;
  const wbeamRateUsd = rates.data?.wbeam?.usd ?? rates.data?.beam?.usd ?? 0;

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-lg text-white/60">Connect wallet first.</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link to="/send">
          <PrimaryButton tone="pink">
            <span className="inline-flex items-center gap-2 leading-none">
              <span>WBEAM</span>
              <NetworkIcon chainId={chain?.id} className="block h-4 w-4 shrink-0 text-white/70" />
              <span>→ BEAM</span>
            </span>
          </PrimaryButton>
        </Link>
        <Link to="/receive">
          <PrimaryButton tone="blue">
            <span className="inline-flex items-center gap-2 leading-none">
              <span>BEAM → WBEAM</span>
              <NetworkIcon chainId={chain?.id} className="block h-4 w-4 shrink-0 text-white/70" />
            </span>
          </PrimaryButton>
        </Link>
      </div>

      <Panel>
        <div className="text-lg font-extrabold">Wallet balance</div>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <BalanceCard
            title="ETH"
            icon={IconEth as string}
            value={ethBal.data?.formatted}
            sub=""
            usdValue={ethBal.data ? usd(Number(ethBal.data.formatted), ethRateUsd) : undefined}
          />
          <BalanceCard
            title="WBEAM"
            icon={IconBeam as string}
            value={wbeamBal.data?.formatted}
            sub=""
            usdValue={wbeamBal.data ? usd(Number(wbeamBal.data.formatted), wbeamRateUsd) : undefined}
          />
        </div>
      </Panel>

      <Panel>
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-lg font-extrabold">Recent activity</div>
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-xl border border-white/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 text-xs text-white/60">
              <tr>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Hash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {(txs.data ?? []).slice(0, 8).map((t) => {
                const dt = new Date(Number(t.timeStamp) * 1000);
                const explorer = chain?.id ? NETWORK_EXPLORER_TX[chain.id] : undefined;
                const decimals = token?.decimals ?? 8;
                const amount = (() => {
                  try {
                    return formatUnits(BigInt(t.value), decimals);
                  } catch {
                    return t.value;
                  }
                })();
                const isIncome = address && t.to ? t.to.toLowerCase() === address.toLowerCase() : false;
                return (
                  <tr key={t.transactionIndex} className="hover:bg-white/5">
                    <td className="px-4 py-3 text-white/90">{amount} WBEAM</td>
                    <td className="px-4 py-3">
                      <span className={isIncome ? 'font-semibold text-beam-blue' : 'font-semibold text-beam-pink'}>
                        completed
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white/70">{dt.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      {explorer ? (
                        <a
                          className="font-semibold text-beam-mint hover:underline"
                          href={`${explorer}${t.hash}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {compactHash(t.hash)}
                        </a>
                      ) : (
                        <span className="text-white/60">{compactHash(t.hash)}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {(txs.data?.length ?? 0) === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-sm text-white/50" colSpan={4}>
                    No transactions yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function BalanceCard({
  title,
  icon,
  sub,
  value,
  usdValue,
}: {
  title: string;
  icon?: string;
  value?: string;
  sub: string;
  usdValue?: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/10 p-4">
      <div className="flex items-center gap-2">
        {icon && <img src={icon} alt={title} className="h-5 w-5" />}
        <div className="text-xl font-extrabold">{value ? formatNumber(Number(value), 8) : '—'}</div>
        <div className="text-sm font-extrabold tracking-[0.22em] text-white/60">{title}</div>
      </div>
      {usdValue && <div className="mt-1 text-xs text-white/50">{usdValue}</div>}
      {sub && <div className="mt-1 text-xs text-white/50">{sub}</div>}
    </div>
  );
}

function NetworkIcon({ chainId, className = 'h-4 w-4' }: { chainId?: number; className?: string }) {
  const title = chainId === 42161 ? 'Arbitrum' : chainId === 1 ? 'Ethereum' : 'Network';

  // Ethereum (diamond) + Arbitrum (hex) simplified inline SVGs
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
