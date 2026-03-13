import { NextResponse } from 'next/server';
import { createPublicClient, encodeFunctionData, http, isAddress, parseUnits } from 'viem';
import { arbitrum, arbitrumSepolia, mainnet } from 'viem/chains';
import { ethPipeAbi } from '@/shared/abi/ethPipeAbi';
import { ethErc20PipeAbi } from '@/shared/abi/ethErc20PipeAbi';

const CHAIN_CONFIG = {
  [mainnet.id]: {
    chain: mainnet,
    rpcUrl:
      process.env.MAINNET_RPC_URL ||
      process.env.NEXT_PUBLIC_MAINNET_RPC_URL ||
      'https://eth.llamarpc.com',
  },
  [arbitrum.id]: {
    chain: arbitrum,
    rpcUrl:
      process.env.ARBITRUM_RPC_URL ||
      process.env.NEXT_PUBLIC_ARBITRUM_RPC_URL ||
      'https://arb1.arbitrum.io/rpc',
  },
  [arbitrumSepolia.id]: {
    chain: arbitrumSepolia,
    rpcUrl:
      process.env.ARBITRUM_SEPOLIA_RPC_URL ||
      process.env.NEXT_PUBLIC_ARBITRUM_SEPOLIA_RPC_URL ||
      'https://sepolia-rollup.arbitrum.io/rpc',
  },
} as const;

const RPC_TIMEOUT_MS = 10_000;

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('RPC timeout')), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const rawAddress = body?.address as string | undefined;
  const chainId = Number(body?.chainId);
  const pipe = body?.pipe as string | undefined;
  const kind = body?.kind as 'native' | 'erc20' | undefined;
  const amount = body?.amount as string | undefined;
  const fee = body?.fee as string | number | undefined;
  const decimals = Number(body?.decimals);
  const beamAddress = body?.beam as string | undefined;

  if (!rawAddress || !isAddress(rawAddress) || !Number.isFinite(chainId)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  if (!pipe || !isAddress(pipe) || !kind || !amount || !Number.isFinite(decimals) || !beamAddress) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const config = CHAIN_CONFIG[chainId as keyof typeof CHAIN_CONFIG];
  if (!config) {
    return NextResponse.json({ error: 'Unsupported chain' }, { status: 400 });
  }

  const beam = beamAddress.startsWith('0x') ? beamAddress : `0x${beamAddress}`;

  let amt: bigint;
  let feeAmt: bigint;
  try {
    amt = parseUnits(amount, decimals);
    feeAmt = parseUnits(typeof fee === 'string' ? fee : String(fee ?? '0'), decimals);
  } catch {
    return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
  }

  const abi = kind === 'native' ? ethPipeAbi : ethErc20PipeAbi;
  const data = encodeFunctionData({
    abi,
    functionName: 'sendFunds',
    args: [amt, feeAmt, beam as `0x${string}`],
  });

  const client = createPublicClient({
    chain: config.chain,
    transport: http(config.rpcUrl, { timeout: RPC_TIMEOUT_MS }),
  });

  const gas = await withTimeout(
    client.estimateGas({
      to: pipe as `0x${string}`,
      data,
      account: rawAddress as `0x${string}`,
      value: kind === 'native' ? amt + feeAmt : undefined,
    }),
    RPC_TIMEOUT_MS,
  );

  return NextResponse.json(
    { gas: gas.toString() },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    },
  );
}

