import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { encodeFunctionData, erc20Abi, formatUnits, parseUnits } from 'viem';
import { useAccount, useBalance, useReadContract, useSwitchChain, useWriteContract } from 'wagmi';
import { estimateGas, waitForTransactionReceipt } from '@wagmi/core';
import { toast } from 'react-toastify';
import { Panel } from '../../../shared/ui/Panel';
import { Input } from '../../../shared/ui/Input';
import { PrimaryButton } from '../../../shared/ui/PrimaryButton';
import { chainIdFromIndicator, parseBeamBridgeAddress } from '../../../shared/utils/beamAddress';
import { GAS_PRICE_NETWORK_KEY, TOKENS_BY_CHAIN } from '../../../shared/constants/bridge';
import { useGasPricesQuery, useRatesQuery } from '../hooks/useBridgeQueries';
import { usd } from '../../../shared/utils/format';
import { ethErc20PipeAbi } from '../../../shared/abi/ethErc20PipeAbi';
import { wagmiConfig } from '../../../app/wagmi';

const DEFAULT_RELAYER_FEE = 0.02;

export function SendPage() {
  const params = useParams();
  const { address, chain, isConnected } = useAccount();
  const { switchChain } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();

  const rates = useRatesQuery();
  const gasPrices = useGasPricesQuery();

  const [inputAddress, setInputAddress] = useState('');
  const [beamAddress, setBeamAddress] = useState('');
  const [indicator, setIndicator] = useState('');
  const [amount, setAmount] = useState('');
  const [estimatedGas, setEstimatedGas] = useState<bigint | null>(null);
  const [submitState, setSubmitState] = useState<'idle' | 'approving' | 'sending'>('idle');
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (params.beamBridgeAddress) {
      setInputAddress(params.beamBridgeAddress);
    }
  }, [params.beamBridgeAddress]);

  useEffect(() => {
    const parsed = parseBeamBridgeAddress(inputAddress);
    setBeamAddress(parsed.beamAddress);
    setIndicator(parsed.networkIndicator);

    const desiredChainId = parsed.networkIndicator ? chainIdFromIndicator(parsed.networkIndicator) : null;
    if (desiredChainId && desiredChainId !== chain?.id) {
      switchChain?.({ chainId: desiredChainId });
    }
  }, [inputAddress, chain?.id, switchChain]);

  const token = chain?.id ? TOKENS_BY_CHAIN[chain.id]?.wbeam : undefined;

  const wbeamBal = useBalance({
    address,
    token: token?.token,
    query: { refetchInterval: 5000, enabled: Boolean(address && token?.token) },
  });

  const ethBal = useBalance({ address, query: { refetchInterval: 5000, enabled: Boolean(address) } });

  const allowance = useReadContract({
    address: token?.token,
    abi: erc20Abi,
    functionName: 'allowance',
    args: address && token?.pipe ? [address, token.pipe] : undefined,
    query: { refetchInterval: 5000, enabled: Boolean(address && token?.token && token?.pipe) },
  });

  const relayerFee = DEFAULT_RELAYER_FEE;

  const amountError = useMemo(() => {
    if (!amount) return undefined;
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) return 'Enter a valid amount';
    if (!wbeamBal.data) return undefined;
    try {
      // Validate that amount can be parsed with token decimals
      if (token) {
        parseUnits(amount, token.decimals);
      }
    } catch {
      return 'Invalid amount format (too many decimals)';
    }
    const bal = Number(wbeamBal.data.formatted);
    if (n + relayerFee > bal) return 'Insufficient WBEAM balance (including relayer fee)';
    if (n < relayerFee) return 'Amount must be >= relayer fee';
    return undefined;
  }, [amount, wbeamBal.data, relayerFee, token]);

  const addressError = useMemo(() => {
    if (!inputAddress) return undefined;
    if (!beamAddress || !indicator) return 'Unrecognized Beam bridge address';
    return undefined;
  }, [inputAddress, beamAddress, indicator]);

  const wbeamRateUsd = rates.data?.beam?.usd ?? 0;
  const ethRateUsd = rates.data?.ethereum?.usd ?? 0;

  const relayerFeeUsd = usd(relayerFee, wbeamRateUsd);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setEstimatedGas(null);
      if (!address || !chain?.id || !token?.pipe) return;
      if (!beamAddress) return;
      if (!amount) return;
      if (addressError || amountError) return;

      try {
        const amt = parseUnits(amount, token.decimals);
        const fee = parseUnits(String(relayerFee), token.decimals);
        // Beam address is 66 hex chars (33 bytes), ensure it has 0x prefix for viem
        const beam = beamAddress.startsWith('0x') ? (beamAddress as `0x${string}`) : (`0x${beamAddress}` as `0x${string}`);

        const data = encodeFunctionData({
          abi: ethErc20PipeAbi,
          functionName: 'sendFunds',
          args: [amt, fee, beam],
        });

        const g = await estimateGas(wagmiConfig, {
          to: token.pipe,
          data,
          account: address,
        });

        if (!cancelled) setEstimatedGas(g);
      } catch {
        if (!cancelled) setEstimatedGas(null);
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [address, chain?.id, token?.pipe, token?.decimals, beamAddress, amount, relayerFee, addressError, amountError]);

  const expectedNetworkFeeEth = useMemo(() => {
    if (!gasPrices.data || !chain?.id) return null;
    const networkKey = GAS_PRICE_NETWORK_KEY[chain.id];
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
  }, [gasPrices.data, chain?.id, ethRateUsd, estimatedGas]);

  const canSubmit =
    Boolean(isConnected && token && !addressError && !amountError && beamAddress && amount) && submitState === 'idle';

  return (
    <div className="space-y-6">
      <Panel>
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-lg font-extrabold">
              <span className="inline-flex items-center gap-2 leading-none">
                <span>WBEAM</span>
                <NetworkIcon chainId={chain?.id} className="block h-4 w-4 shrink-0 text-white/70" />
                <span>→ BEAM</span>
              </span>
            </div>
            <div className="mt-1 text-sm text-white/60">Paste a Beam bridge address from Beam Wallet.</div>
          </div>
          <Link to="/">
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

          <Input
            label="AMOUNT"
            placeholder="0.0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            error={amountError}
            inputMode="decimal"
            autoComplete="off"
          />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-black/10 p-4">
              <div className="text-xs font-extrabold tracking-[0.22em] text-white/60">AVAILABLE WBEAM</div>
              <div className="mt-2 text-lg font-extrabold">
                {wbeamBal.data ? `${wbeamBal.data.formatted} ${wbeamBal.data.symbol}` : '—'}
              </div>
              <div className="mt-1 text-xs text-white/50">
                {wbeamBal.data ? usd(Number(wbeamBal.data.formatted), wbeamRateUsd) : ''}
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/10 p-4">
              <div className="text-xs font-extrabold tracking-[0.22em] text-white/60">AVAILABLE ETH</div>
              <div className="mt-2 text-lg font-extrabold">
                {ethBal.data ? `${ethBal.data.formatted} ${ethBal.data.symbol}` : '—'}
              </div>
              <div className="mt-1 text-xs text-white/50">
                {ethBal.data ? usd(Number(ethBal.data.formatted), ethRateUsd) : ''}
              </div>
            </div>
          </div>

          {token ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-black/10 p-4">
                <div className="text-xs font-extrabold tracking-[0.22em] text-white/60">RELAYER FEE</div>
                <div className="mt-2 text-lg font-extrabold text-beam-pink">{relayerFee} WBEAM</div>
                <div className="mt-1 text-xs text-white/50">{relayerFeeUsd}</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/10 p-4">
                <div className="text-xs font-extrabold tracking-[0.22em] text-white/60">EXPECTED NETWORK FEE</div>
                <div className="mt-2 text-lg font-extrabold text-beam-blue">
                  {expectedNetworkFeeEth ? `${expectedNetworkFeeEth.eth.toFixed(6)} ETH` : '—'}
                </div>
                <div className="mt-1 text-xs text-white/50">
                  {expectedNetworkFeeEth?.usd ?? ''}
                  {expectedNetworkFeeEth ? (
                    <span className="ml-2 text-white/40">
                      {expectedNetworkFeeEth.usedEstimate ? '(estimated)' : '(approx)'}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <PrimaryButton
              tone="pink"
              disabled={!canSubmit}
              onClick={async () => {
                if (!token || !beamAddress || !amount) return;
                if (!address) return;

                setSubmitError(null);

                try {
                  const amt = parseUnits(amount, token.decimals);
                  const fee = parseUnits(String(relayerFee), token.decimals);
                  const required = amt + fee;

                  // Beam address is 66 hex chars (33 bytes), ensure it has 0x prefix for viem
                  const beam = beamAddress.startsWith('0x')
                    ? (beamAddress as `0x${string}`)
                    : (`0x${beamAddress}` as `0x${string}`);

                  // If allowance is insufficient, request exact approval for (amount + relayer fee)
                  const currentAllowance = typeof allowance.data === 'bigint' ? allowance.data : 0n;
                  if (currentAllowance < required) {
                    setSubmitState('approving');
                    toast.info('Approval required. Confirm in your wallet…');
                    const approveTx = await writeContractAsync({
                      address: token.token,
                      abi: erc20Abi,
                      functionName: 'approve',
                      args: [token.pipe, required],
                    });
                    toast.info('Waiting for approval confirmation…');
                    await waitForTransactionReceipt(wagmiConfig, { hash: approveTx });
                    toast.success('Approval confirmed');
                  }

                  setSubmitState('sending');
                  toast.info('Sending transfer…');
                  const sendTx = await writeContractAsync({
                    address: token.pipe,
                    abi: ethErc20PipeAbi,
                    functionName: 'sendFunds',
                    args: [amt, fee, beam],
                  });
                  toast.info('Waiting for transfer confirmation…');
                  await waitForTransactionReceipt(wagmiConfig, { hash: sendTx });
                  toast.success('Transfer confirmed');

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

