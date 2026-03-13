'use client';

import Link from 'next/link';
import { useAccount } from 'wagmi';
import { formatUnits } from 'viem';
import { ASSETS_BY_CHAIN, TOKENS_BY_CHAIN, NETWORK_EXPLORER_TX, type BridgeAsset } from '../../../shared/constants/bridge';
import { Panel } from '../../../shared/ui/Panel';
import { PrimaryButton } from '../../../shared/ui/PrimaryButton';
import { BeamMark } from '../../../shared/ui/BeamMark';
import { compactHash, formatNumber, usd } from '../../../shared/utils/format';
import { useBalancesQuery, useRatesQuery, useTransactionsQuery } from '../hooks/useBridgeQueries';
import { useMemo, type ReactNode } from 'react';

export function HomePage() {
  const { address, chain, chainId, isConnected } = useAccount();
  const resolvedChainId = chain?.id ?? chainId;
  const token = resolvedChainId ? TOKENS_BY_CHAIN[resolvedChainId]?.wbeam : undefined;

  const assets = useMemo((): BridgeAsset[] => {
    if (!resolvedChainId) return [];
    return ASSETS_BY_CHAIN[resolvedChainId] ?? [];
  }, [resolvedChainId]);

  const balances = useBalancesQuery();
  const balanceMap = balances.data?.balances ?? {};
  const ethBal = balanceMap['ETH'];
  const wbeamBal = balanceMap['WBEAM'];
  const usdtBal = balanceMap['USDT'];
  const wbtcBal = balanceMap['WBTC'];
  const daiBal = balanceMap['DAI'];

  const rates = useRatesQuery();
  const txs = useTransactionsQuery();
  const sortedTxs = useMemo(() => {
    if (!txs.data) return [];

    return [...txs.data].sort((a, b) => {
      const aTime = Number(a.timeStamp ?? 0);
      const bTime = Number(b.timeStamp ?? 0);
      return bTime - aTime;
    });
  }, [txs.data]);

  const ethRateUsd = rates.data?.eth?.usd ?? rates.data?.ethereum?.usd ?? 0;
  const wbeamRateUsd = rates.data?.wbeam?.usd ?? rates.data?.beam?.usd ?? 0;
  const usdtRateUsd = (rates.data as Record<string, { usd: number }> | undefined)?.['tether']?.usd ?? 0;
  const wbtcRateUsd = (rates.data as Record<string, { usd: number }> | undefined)?.['wrapped-bitcoin']?.usd ?? 0;
  const daiRateUsd = (rates.data as Record<string, { usd: number }> | undefined)?.['dai']?.usd ?? 0;

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
        <Link href="/send">
          <PrimaryButton tone="pink">
            <span className="inline-flex items-center gap-2 leading-none">
              <span>WBEAM</span>
              <NetworkIcon chainId={resolvedChainId} className="block h-4 w-4 shrink-0 text-white/70" />
              <span className="inline-flex items-center gap-2">
                <span>→ BEAM</span>
                <BeamMark className="h-4 w-4 text-white/70" />
              </span>
            </span>
          </PrimaryButton>
        </Link>
        <Link href="/receive">
          <PrimaryButton tone="blue">
            <span className="inline-flex items-center gap-2 leading-none">
              <span className="inline-flex items-center gap-2">
                <span>BEAM</span>
                <BeamMark className="h-4 w-4 text-white/70" />
                <span>→ WBEAM</span>
              </span>
              <NetworkIcon chainId={resolvedChainId} className="block h-4 w-4 shrink-0 text-white/70" />
            </span>
          </PrimaryButton>
        </Link>
      </div>

      <Panel>
        <div className="text-lg font-extrabold">Wallet balance</div>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {resolvedChainId === 1 && assets.length > 0 ? (
            // Show all assets when on Ethereum network
            <>
              <BalanceCard
                title="ETH"
                iconComponent={<TokenIcon assetName="ETH" className="h-5 w-5" />}
                value={ethBal?.formatted}
                sub=""
                usdValue={ethBal ? usd(Number(ethBal.formatted), ethRateUsd) : undefined}
              />
              <BalanceCard
                title="USDT"
                iconComponent={<TokenIcon assetName="USDT" className="h-5 w-5" />}
                value={usdtBal?.formatted}
                sub=""
                usdValue={usdtBal ? usd(Number(usdtBal.formatted), usdtRateUsd) : undefined}
              />
              <BalanceCard
                title="WBTC"
                iconComponent={<TokenIcon assetName="WBTC" className="h-5 w-5" />}
                value={wbtcBal?.formatted}
                sub=""
                usdValue={wbtcBal ? usd(Number(wbtcBal.formatted), wbtcRateUsd) : undefined}
              />
              <BalanceCard
                title="DAI"
                iconComponent={<TokenIcon assetName="DAI" className="h-5 w-5" />}
                value={daiBal?.formatted}
                sub=""
                usdValue={daiBal ? usd(Number(daiBal.formatted), daiRateUsd) : undefined}
              />
              <BalanceCard
                title="WBEAM"
                iconComponent={<TokenIcon assetName="WBEAM" className="h-5 w-5" />}
                value={wbeamBal?.formatted}
                sub=""
                usdValue={wbeamBal ? usd(Number(wbeamBal.formatted), wbeamRateUsd) : undefined}
              />
            </>
          ) : (
            // Default view for other networks
            <>
              <BalanceCard
                title="ETH"
                iconComponent={<TokenIcon assetName="ETH" className="h-5 w-5" />}
                value={ethBal?.formatted}
                sub=""
                usdValue={ethBal ? usd(Number(ethBal.formatted), ethRateUsd) : undefined}
              />
              <BalanceCard
                title="WBEAM"
                iconComponent={<TokenIcon assetName="WBEAM" className="h-5 w-5" />}
                value={wbeamBal?.formatted}
                sub=""
                usdValue={wbeamBal ? usd(Number(wbeamBal.formatted), wbeamRateUsd) : undefined}
              />
            </>
          )}
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
              {sortedTxs.slice(0, 8).map((t) => {
                const dt = new Date(Number(t.timeStamp) * 1000);
                const explorer = resolvedChainId ? NETWORK_EXPLORER_TX[resolvedChainId] : undefined;
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
  iconComponent,
  sub,
  value,
  usdValue,
}: {
  title: string;
  icon?: string;
  iconComponent?: ReactNode;
  value?: string;
  sub: string;
  usdValue?: string;
}) {
  const iconNode = iconComponent ?? (icon ? <img src={icon} alt={title} className="h-5 w-5" /> : null);

  return (
    <div className="rounded-xl border border-white/10 bg-black/10 p-4">
      <div className="flex items-center gap-2">
        {iconNode}
        <div className="text-xl font-extrabold">{value ? formatNumber(Number(value), 8) : '—'}</div>
        <div className="text-sm font-extrabold tracking-[0.22em] text-white/60">{title}</div>
      </div>
      {usdValue && <div className="mt-1 text-xs text-white/50">{usdValue}</div>}
      {sub && <div className="mt-1 text-xs text-white/50">{sub}</div>}
    </div>
  );
}

function TokenIcon({ assetName, className = 'h-4 w-4' }: { assetName: string; className?: string }) {
  const title = assetName;

  // USDT - Tether logo (circular T symbol)
  if (assetName === 'USDT') {
    return (
      <svg viewBox="0 0 64 64" className={className} aria-label={title} role="img">
        <title>{title}</title>
        <circle cx="32" cy="32" r="30" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.9" />
        <g transform="translate(32 32) scale(2.461538) translate(-13 -13)">
          <path
            d="M14.335 14.036c-.07.005-.427.026-1.225.026-.635 0-1.086-.019-1.244-.026-2.454-.108-4.285-.535-4.285-1.047 0-.511 1.831-.938 4.285-1.047v1.668c.16.012.62.04 1.255.04.762 0 1.143-.033 1.212-.039v-1.668c2.448.109 4.276.536 4.276 1.046s-1.827.938-4.276 1.046h.002zm0-2.266v-1.493h3.417V8H8.45v2.277h3.416v1.493C9.088 11.897 7 12.447 7 13.107c0 .659 2.088 1.208 4.865 1.336v4.785h2.47v-4.786c2.77-.128 4.855-.677 4.855-1.336s-2.083-1.208-4.855-1.336z"
            fill="currentColor"
            opacity="0.9"
          />
        </g>
      </svg>
    );
  }

  // WBTC - Bitcoin logo (circular B with vertical line)
  if (assetName === 'WBTC') {
    return (
      <svg viewBox="0 0 64 64" className={className} aria-label={title} role="img">
        <title>{title}</title>
        <circle cx="32" cy="32" r="30" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.9" />
        <g transform="translate(32 32) scale(2.461538) translate(-13 -13)">
          <path
            d="M17.971 10.849c.23-1.53-.936-2.35-2.529-2.899l.517-2.07-1.261-.315-.503 2.016c-.332-.082-.673-.16-1.011-.237l.506-2.03L12.43 5l-.517 2.07a41.73 41.73 0 0 1-.806-.19l.001-.006-1.74-.434-.335 1.347s.936.214.916.227c.511.128.604.466.588.733l-.588 2.36c.035.008.08.021.13.041l-.133-.032-.825 3.304c-.062.155-.22.388-.578.3.013.018-.917-.229-.917-.229L7 15.934l1.642.409c.305.076.605.156.9.232l-.523 2.094 1.26.314.517-2.072c.345.093.679.18 1.006.26l-.515 2.063 1.261.314.522-2.09c2.152.407 3.77.243 4.45-1.702.549-1.565-.027-2.468-1.16-3.057.825-.19 1.446-.731 1.612-1.85zm-2.882 4.038c-.39 1.565-3.028.72-3.883.507l.693-2.775c.855.214 3.597.636 3.19 2.268zm.39-4.061c-.356 1.424-2.551.7-3.263.523l.628-2.517c.712.178 3.005.509 2.635 1.994z"
            fill="currentColor"
            opacity="0.9"
          />
        </g>
      </svg>
    );
  }

  // DAI - MakerDAO logo (stylized M)
  if (assetName === 'DAI') {
    return (
      <svg viewBox="0 0 64 64" className={className} aria-label={title} role="img">
        <title>{title}</title>
        <circle cx="32" cy="32" r="30" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.9" />
        <g transform="translate(32 32) scale(2.461538) translate(-13 -13)">
          <path
            d="M13.42 13.612h3.645c.078 0 .115 0 .12-.102.03-.37.03-.744 0-1.115 0-.072-.036-.102-.114-.102H9.817c-.09 0-.114.03-.114.114v1.067c0 .138 0 .138.144.138h3.573zm3.358-2.566a.117.117 0 0 0 0-.083 2.37 2.37 0 0 0-.217-.378 3.058 3.058 0 0 0-.443-.558 1.47 1.47 0 0 0-.276-.27 4.31 4.31 0 0 0-1.799-.91 4.471 4.471 0 0 0-1.019-.109h-3.22c-.089 0-.101.036-.101.114v2.128c0 .09 0 .114.114.114h6.918s.06-.012.072-.048h-.03.001zm0 3.813a1.399 1.399 0 0 0-.306 0H9.823c-.09 0-.12 0-.12.12v2.08c0 .096 0 .12.12.12h3.07c.147.012.293.001.437-.03a4.57 4.57 0 0 0 1.302-.287c.151-.053.298-.121.437-.204h.042a3.895 3.895 0 0 0 1.672-1.684s.042-.09-.005-.114v-.001zm-8.28 3.4v-3.316c0-.078 0-.09-.095-.09H7.102c-.072 0-.102 0-.102-.095v-1.14h1.39c.078 0 .109 0 .109-.101V12.39c0-.073 0-.09-.096-.09H7.102c-.072 0-.102 0-.102-.096v-1.055c0-.066 0-.084.096-.084h1.289c.09 0 .114 0 .114-.114V7.72c0-.096 0-.12.12-.12h4.496c.326.013.65.049.97.108a5.86 5.86 0 0 1 1.877.695c.385.227.74.5 1.055.816.238.246.452.513.642.797.188.288.345.596.468.917.015.084.095.14.18.126h1.072c.138 0 .138 0 .144.132v.984c0 .095-.036.12-.132.12h-.828c-.083 0-.108 0-.101.108.032.365.032.731 0 1.096 0 .102 0 .114.114.114h.947c.041.054 0 .108 0 .163.006.07.006.14 0 .209v.726c0 .101-.03.132-.12.132h-1.134a.15.15 0 0 0-.174.114 4.794 4.794 0 0 1-1.259 1.834 7.22 7.22 0 0 1-.641.515c-.24.139-.474.282-.72.396a6.482 6.482 0 0 1-1.415.45c-.462.082-.931.12-1.402.114H8.497v-.006l.002-.002z"
            fill="currentColor"
            opacity="0.9"
          />
        </g>
      </svg>
    );
  }

  // WBEAM - Beam logo (original mark)
  if (assetName === 'WBEAM') {
    return (
      <svg viewBox="0 0 64 64" className={className} aria-label={title} role="img">
        <title>{title}</title>
        <circle cx="32" cy="32" r="30" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.9" />
        <g transform="translate(32 32) scale(3.2) translate(-10 -10)">
          <path
            d="M9.6145 4.5L14.7272 13.3636H9.61353V11.883L12.223 11.8839L9.6145 7.28627V4.5Z"
            fill="currentColor"
            opacity="0.9"
          />
          <path
            d="M9.61255 4.5L4.49989 13.3636H9.61353V11.883L7.00405 11.8839L9.61255 7.28627V4.5Z"
            fill="currentColor"
            opacity="0.9"
          />
          <path
            d="M9.61367 8.42773V11.3437L7.99609 11.3469L9.61367 8.42773Z"
            fill="currentColor"
            opacity="0.9"
          />
          <path
            d="M9.61362 8.42773V11.3437L11.2312 11.3469L9.61362 8.42773Z"
            fill="currentColor"
            opacity="0.9"
          />
          <path
            d="M9.95459 9.59974L4.50004 7.22729V9.95457L9.95459 9.84391V9.59974Z"
            fill="currentColor"
            opacity="0.9"
          />
          <path
            d="M9.95459 9.59974L15.4091 7.22729V9.95457L9.95459 9.84391V9.59974Z"
            fill="currentColor"
            opacity="0.9"
          />
        </g>
      </svg>
    );
  }

  // ETH - Ethereum diamond (simplified, matching network icon style)
  if (assetName === 'ETH') {
    return (
      <svg viewBox="0 0 64 64" className={className} aria-label={title} role="img">
        <title>{title}</title>
        <circle cx="32" cy="32" r="30" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.9" />
        <g transform="translate(32 32) scale(0.12) translate(-128 -208.5)">
          <path
            d="M127.9 0L124.7 10.9v270.1l3.2 3.2 127.9-75.6L127.9 0z"
            fill="currentColor"
            opacity="0.9"
          />
          <path d="M127.9 0L0 208.6l127.9 75.6V0z" fill="currentColor" opacity="0.65" />
          <path
            d="M127.9 306.6l-1.8 2.2v106.9l1.8 0.5 128-180.3-128 70.7z"
            fill="currentColor"
            opacity="0.9"
          />
          <path d="M127.9 416.2V306.6L0 235.9l127.9 180.3z" fill="currentColor" opacity="0.65" />
          <path d="M127.9 284.2l127.9-75.6-127.9-58.1v133.7z" fill="currentColor" opacity="0.75" />
          <path d="M0 208.6l127.9 75.6V150.5L0 208.6z" fill="currentColor" opacity="0.55" />
        </g>
      </svg>
    );
  }

  // Default fallback
  return (
    <span
      className={className + ' inline-flex items-center justify-center rounded-full border border-white/20 text-[10px] font-bold text-white/70'}
      title={title}
    >
      ?
    </span>
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
