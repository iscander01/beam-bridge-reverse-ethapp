'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import Link from 'next/link';
import { erc20Abi, formatUnits, parseUnits } from 'viem';
import { useAccount, useSwitchChain, useWriteContract } from 'wagmi';
import { waitForTransactionReceipt } from '@wagmi/core';
import { toast } from 'react-toastify';
import { useQueryClient } from '@tanstack/react-query';
import { Panel } from '../../../shared/ui/Panel';
import { Input } from '../../../shared/ui/Input';
import { PrimaryButton } from '../../../shared/ui/PrimaryButton';
import { BeamMark } from '../../../shared/ui/BeamMark';
import { chainIdFromIndicator, parseBeamBridgeAddress } from '../../../shared/utils/beamAddress';
import { ASSETS_BY_CHAIN, GAS_PRICE_NETWORK_KEY, TOKENS_BY_CHAIN, type BridgeAsset } from '../../../shared/constants/bridge';
import { useAllowanceQuery, useBalancesQuery, useGasEstimateQuery, useGasPricesQuery, useRatesQuery } from '../hooks/useBridgeQueries';
import { usd } from '../../../shared/utils/format';
import { ethErc20PipeAbi } from '../../../shared/abi/ethErc20PipeAbi';
import { ethPipeAbi } from '../../../shared/abi/ethPipeAbi';
import { wagmiConfig } from '../../../app/wagmi';

const DEFAULT_RELAYER_FEE = 0.02;

export function SendPage({ beamBridgeAddress }: { beamBridgeAddress?: string }) {
  const { address, chain, chainId, isConnected } = useAccount();
  const queryClient = useQueryClient();
  const resolvedChainId = chain?.id ?? chainId;
  const { switchChain } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();

  const rates = useRatesQuery();
  const gasPrices = useGasPricesQuery();
  const balances = useBalancesQuery();
  const balanceMap = balances.data?.balances ?? {};
  const nativeSymbol = chain?.nativeCurrency.symbol ?? 'ETH';
  const ethBalance = balanceMap[nativeSymbol];

  const [inputAddress, setInputAddress] = useState('');
  const [beamAddress, setBeamAddress] = useState('');
  const [indicator, setIndicator] = useState('');
  const [amount, setAmount] = useState('');
  const [submitState, setSubmitState] = useState<'idle' | 'approving' | 'sending'>('idle');
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (beamBridgeAddress) {
      setInputAddress(beamBridgeAddress);
    }
  }, [beamBridgeAddress]);

  useEffect(() => {
    const parsed = parseBeamBridgeAddress(inputAddress);
    setBeamAddress(parsed.beamAddress);
    setIndicator(parsed.networkIndicator);

    const desiredChainId = parsed.networkIndicator ? chainIdFromIndicator(parsed.networkIndicator) : null;
    if (desiredChainId && desiredChainId !== resolvedChainId) {
      switchChain?.({ chainId: desiredChainId });
    }
  }, [inputAddress, resolvedChainId, switchChain]);

  const token = resolvedChainId ? TOKENS_BY_CHAIN[resolvedChainId]?.wbeam : undefined;

  const assets = useMemo((): BridgeAsset[] => {
    if (!resolvedChainId) return [];
    const list = ASSETS_BY_CHAIN[resolvedChainId];
    const wbeam =
      token?.token && token.pipe
        ? {
            name: token.symbol,
            rateId: token.rateId,
            id: 0,
            decimals: token.decimals,
            validatorDecimals: token.decimals,
            ethTokenContract: token.token,
            ethPipeContract: token.pipe,
            kind: 'erc20' as const,
          }
        : null;

    if (list?.length) {
      const combined = wbeam ? [...list, wbeam] : list;
      const deduped = new Map<string, BridgeAsset>();
      for (const asset of combined) {
        if (!deduped.has(asset.name)) {
          deduped.set(asset.name, asset);
        }
      }
      return Array.from(deduped.values());
    }

    // Fallback to the existing WBEAM-only flow on other chains.
    if (wbeam) return [wbeam];
    return [];
  }, [resolvedChainId, token?.token, token?.pipe, token?.decimals, token?.symbol, token?.rateId]);

  const [assetName, setAssetName] = useState<string>('');

  // Reset selection on chain changes / first load.
  useEffect(() => {
    if (!assets.length) {
      setAssetName('');
      return;
    }
    setAssetName((prev) => (assets.some((a) => a.name === prev) ? prev : assets[0]!.name));
  }, [assets]);

  const asset = useMemo(() => assets.find((a) => a.name === assetName) ?? assets[0], [assets, assetName]);

  const selectedBalance = asset ? balanceMap[asset.name] : undefined;
  const allowanceToken =
    asset?.kind === 'erc20' && asset.ethTokenContract !== '' ? (asset.ethTokenContract as `0x${string}`) : undefined;
  const allowanceSpender = asset?.kind === 'erc20' ? asset.ethPipeContract : undefined;
  const allowance = useAllowanceQuery({
    address,
    chainId: resolvedChainId,
    token: allowanceToken,
    spender: allowanceSpender,
    enabled: Boolean(address && resolvedChainId && allowanceToken && allowanceSpender),
  });
  const currentAllowance = allowance.data?.allowance ? BigInt(allowance.data.allowance) : 0n;

  const relayerFee = DEFAULT_RELAYER_FEE;

  const amountError = useMemo(() => {
    if (!amount) return undefined;
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) return 'Enter a valid amount';
    if (!asset) return 'Select an asset';
    if (!(asset.kind === 'native' ? ethBalance : selectedBalance)) return undefined;
    try {
      // Validate that amount can be parsed with token decimals
      parseUnits(amount, asset.decimals);
    } catch {
      return 'Invalid amount format (too many decimals)';
    }
    const bal = Number((asset.kind === 'native' ? ethBalance : selectedBalance)!.formatted);
    if (n + relayerFee > bal) return `Insufficient ${asset.name} balance (including relayer fee)`;
    if (n < relayerFee) return 'Amount must be >= relayer fee';
    return undefined;
  }, [amount, asset, selectedBalance, ethBalance, relayerFee]);

  const addressError = useMemo(() => {
    if (!inputAddress) return undefined;
    if (!beamAddress || !indicator) return 'Unrecognized Beam bridge address';
    return undefined;
  }, [inputAddress, beamAddress, indicator]);

  const ethRateUsd = rates.data?.ethereum?.usd ?? 0;

  const gasEstimate = useGasEstimateQuery({
    address,
    chainId: resolvedChainId,
    pipe: asset?.ethPipeContract,
    kind: asset?.kind,
    amount,
    fee: String(relayerFee),
    beam: beamAddress,
    decimals: asset?.decimals,
    enabled: Boolean(address && resolvedChainId && asset?.ethPipeContract && amount && beamAddress && !addressError && !amountError),
  });
  const estimatedGas = gasEstimate.data?.gas ? BigInt(gasEstimate.data.gas) : null;

  const expectedNetworkFeeEth = useMemo(() => {
    if (!gasPrices.data || !resolvedChainId) return null;
    const networkKey = GAS_PRICE_NETWORK_KEY[resolvedChainId];
    if (!networkKey) return null;

    const gasPriceHex = gasPrices.data[networkKey];
    if (!gasPriceHex) return null;

    const gasPrice = BigInt(gasPriceHex);
    const assumedGas = 160000n;
    const gas = estimatedGas ?? assumedGas;
    const feeWei = gasPrice * gas;
    const feeEth = Number(formatUnits(feeWei, 18));

    return {
      eth: feeEth,
      usd: usd(feeEth, ethRateUsd),
      usedEstimate: Boolean(estimatedGas),
    };
  }, [gasPrices.data, resolvedChainId, ethRateUsd, estimatedGas]);

  const canSubmit =
    Boolean(isConnected && asset && !addressError && !amountError && beamAddress && amount) && submitState === 'idle';

  return (
    <div className="space-y-6">
      <Panel>
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-lg font-extrabold">
              <span className="inline-flex items-center gap-2 leading-none">
                <span className="inline-flex items-center gap-2">
                  <span>{asset?.name ?? 'WBEAM'}</span>
                  {asset ? <TokenIcon assetName={asset.name} className="block h-4 w-4 shrink-0 text-white/70" /> : null}
                </span>
                <span className="inline-flex items-center gap-2">
                  <span>→ BEAM</span>
                  <BeamMark className="h-4 w-4 text-white/70" />
                </span>
              </span>
            </div>
            <div className="mt-1 text-sm text-white/60">Paste a Beam bridge address from Beam Wallet.</div>
          </div>
          <Link href="/">
            <span className="text-sm font-semibold text-white/60 hover:text-white">Back</span>
          </Link>
        </div>

        <div className="mt-6 space-y-5">
          <Input
            label="BEAM BRIDGE ADDRESS"
            placeholder="Paste Beam bridge address here"
            value={inputAddress}
            onChange={(e) => setInputAddress(e.target.value)}
            error={addressError}
            autoComplete="off"
          />

          <label className="block">
            <div className="mb-2 text-xs font-extrabold tracking-[0.22em] text-white/70">AMOUNT</div>
            <div className="flex gap-3">
              <input
                className={
                  'flex-1 rounded-xl border bg-black/10 px-4 py-3 text-sm text-white outline-none transition ' +
                  (amountError ? 'border-red-400/60 focus:border-red-300' : 'border-white/10 focus:border-white/30')
                }
                placeholder="0.0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                inputMode="decimal"
                autoComplete="off"
              />
              {asset ? <AssetSelector assets={assets} selectedAsset={assetName} onSelect={setAssetName} /> : null}
            </div>
            {amountError ? <div className="mt-2 text-xs text-red-300">{amountError}</div> : null}
          </label>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-black/10 p-4">
              <div className="text-xs font-extrabold tracking-[0.22em] text-white/60">
                AVAILABLE {asset?.name ?? 'ASSET'}
              </div>
              <div className="mt-2 text-lg font-extrabold">
                {asset?.kind === 'native'
                  ? ethBalance
                    ? `${ethBalance.formatted} ${ethBalance.symbol}`
                    : '—'
                  : selectedBalance
                    ? `${selectedBalance.formatted} ${selectedBalance.symbol}`
                    : '—'}
              </div>
              <div className="mt-1 text-xs text-white/50">
                {asset
                  ? usd(
                      Number((asset.kind === 'native' ? ethBalance : selectedBalance)?.formatted ?? 0),
                      (rates.data as Record<string, { usd: number }> | undefined)?.[asset.rateId]?.usd ?? 0,
                    )
                  : ''}
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/10 p-4">
              <div className="text-xs font-extrabold tracking-[0.22em] text-white/60">AVAILABLE ETH</div>
              <div className="mt-2 text-lg font-extrabold">
                {ethBalance ? `${ethBalance.formatted} ${ethBalance.symbol}` : '—'}
              </div>
              <div className="mt-1 text-xs text-white/50">
                {ethBalance ? usd(Number(ethBalance.formatted), ethRateUsd) : ''}
              </div>
            </div>
          </div>

          {asset ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-black/10 p-4">
                <div className="text-xs font-extrabold tracking-[0.22em] text-white/60">RELAYER FEE</div>
                <div className="mt-2 text-lg font-extrabold text-beam-pink">
                  {relayerFee} {asset.name}
                </div>
                <div className="mt-1 text-xs text-white/50">
                  {usd(relayerFee, (rates.data as Record<string, { usd: number }> | undefined)?.[asset.rateId]?.usd ?? 0)}
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/10 p-4">
                <div className="text-xs font-extrabold tracking-[0.22em] text-white/60">EXPECTED NETWORK FEE</div>
                <div className="mt-2 text-lg font-extrabold text-beam-blue">
                  {expectedNetworkFeeEth ? `${expectedNetworkFeeEth.eth.toFixed(6)} ETH` : '—'}
                </div>
                <div className="mt-1 text-xs text-white/50">
                  {expectedNetworkFeeEth?.usd ?? ''}
                </div>
              </div>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <PrimaryButton
              tone="pink"
              disabled={!canSubmit}
              onClick={async () => {
                if (!asset || !beamAddress || !amount) return;
                if (!address) return;

                setSubmitError(null);

                try {
                  const amt = parseUnits(amount, asset.decimals);
                  const fee = parseUnits(String(relayerFee), asset.decimals);
                  const required = amt + fee;

                  // Beam address is 66 hex chars (33 bytes), ensure it has 0x prefix for viem
                  const beam = beamAddress.startsWith('0x')
                    ? (beamAddress as `0x${string}`)
                    : (`0x${beamAddress}` as `0x${string}`);

                  if (asset.kind === 'erc20') {
                    // If allowance is insufficient, request exact approval for (amount + relayer fee)
                    if (currentAllowance < required) {
                      setSubmitState('approving');
                      toast.info('Approval required. Confirm in your wallet…');
                      if (asset.ethTokenContract === '') throw new Error('Missing token contract');
                      const approveTx = await writeContractAsync({
                        address: asset.ethTokenContract as `0x${string}`,
                        abi: erc20Abi,
                        functionName: 'approve',
                        args: [asset.ethPipeContract, required],
                      });
                      toast.info('Waiting for approval confirmation…');
                      await waitForTransactionReceipt(wagmiConfig, { hash: approveTx });
                      toast.success('Approval confirmed');
                      await queryClient.invalidateQueries({ queryKey: ['allowance'] });
                    }
                  }

                  setSubmitState('sending');
                  toast.info('Sending transfer…');
                  const sendTx =
                    asset.kind === 'native'
                      ? await writeContractAsync({
                          address: asset.ethPipeContract,
                          abi: ethPipeAbi,
                          functionName: 'sendFunds',
                          args: [amt, fee, beam],
                          value: required,
                        })
                      : await writeContractAsync({
                          address: asset.ethPipeContract,
                          abi: ethErc20PipeAbi,
                          functionName: 'sendFunds',
                          args: [amt, fee, beam],
                        });
                  toast.info('Waiting for transfer confirmation…');
                  await waitForTransactionReceipt(wagmiConfig, { hash: sendTx });
                  toast.success('Transfer confirmed');
                  await queryClient.invalidateQueries({ queryKey: ['balances'] });
                  await queryClient.invalidateQueries({ queryKey: ['txs'] });

                  setSubmitState('idle');
                } catch (error) {
                  console.error('Transfer failed:', error);
                  const msg = error instanceof Error ? error.message : 'Transaction failed';
                  setSubmitError(msg);
                  toast.error(msg);
                  setSubmitState('idle');
                }
              }}
            >
              {submitState === 'approving' ? 'Approving…' : submitState === 'sending' ? 'Sending…' : 'Transfer'}
            </PrimaryButton>
          </div>

          {submitError ? <div className="text-sm text-red-300">{submitError}</div> : null}
        </div>
      </Panel>

      <Panel>
        <div className="text-sm text-white/70">
          <div className="font-extrabold tracking-wide">How to get a Beam bridge address</div>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-white/60">
            <li>Install the latest Beam Wallet.</li>
            <li>Open Bridges DApp.</li>
            <li>Select “Ethereum to Beam”.</li>
            <li>Copy the Beam bridge address and paste it here.</li>
          </ol>
        </div>
      </Panel>
    </div>
  );
}

function AssetSelector({
  assets,
  selectedAsset,
  onSelect,
}: {
  assets: BridgeAsset[];
  selectedAsset: string;
  onSelect: (name: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  const selected = assets.find((a) => a.name === selectedAsset) ?? assets[0];
  const displayName = selected?.name ?? 'Select asset';

  if (assets.length <= 1) {
    return (
      <div className="flex shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/10 px-4 py-3 text-sm font-semibold text-white/70">
        {displayName}
      </div>
    );
  }

  return (
    <div className="relative shrink-0" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/10 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10 transition"
      >
        <span>{displayName}</span>
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
          className="absolute right-0 mt-2 min-w-[200px] max-h-80 overflow-y-auto rounded-xl border border-white/20 bg-bg-700/98 backdrop-blur shadow-[0_8px_32px_rgba(0,0,0,0.4)] z-50"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(255, 255, 255, 0.2) rgba(255, 255, 255, 0.05)',
          }}
        >
          {assets.map((asset, index) => {
            const isFirst = index === 0;
            const isLast = index === assets.length - 1;
            const isSelected = asset.name === selectedAsset;
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
                key={asset.name}
                type="button"
                onClick={() => {
                  if (asset.name !== selectedAsset) {
                    onSelect(asset.name);
                  }
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2.5 text-sm transition ${
                  isSelected
                    ? 'bg-white/10 font-semibold'
                    : 'bg-transparent font-medium hover:bg-white/15'
                } ${itemRadius} m-0`}
              >
                <span className="block truncate">{asset.name}</span>
              </button>
            );
          })}
        </div>
      )}
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

