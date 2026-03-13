import { NextResponse } from 'next/server';
import { createPublicClient, erc20Abi, http, isAddress } from 'viem';
import { arbitrum, arbitrumSepolia, mainnet } from 'viem/chains';

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
  const token = body?.token as string | undefined;
  const spender = body?.spender as string | undefined;

  if (!rawAddress || !isAddress(rawAddress) || !Number.isFinite(chainId)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  if (!token || !spender || !isAddress(token) || !isAddress(spender)) {
    return NextResponse.json({ allowance: '0' });
  }

  const config = CHAIN_CONFIG[chainId as keyof typeof CHAIN_CONFIG];
  if (!config) {
    return NextResponse.json({ error: 'Unsupported chain' }, { status: 400 });
  }

  const client = createPublicClient({
    chain: config.chain,
    transport: http(config.rpcUrl, { timeout: RPC_TIMEOUT_MS }),
  });

  let allowance = 0n;
  try {
    const bytecode = await withTimeout(client.getBytecode({ address: token as `0x${string}` }), RPC_TIMEOUT_MS);
    if (!bytecode || bytecode === '0x') {
      console.warn('[allowance] token has no bytecode', { token, chainId });
      return NextResponse.json({ allowance: '0' });
    }

    allowance = (await withTimeout(
      client.readContract({
        address: token as `0x${string}`,
        abi: erc20Abi,
        functionName: 'allowance',
        args: [rawAddress as `0x${string}`, spender as `0x${string}`],
      }),
      RPC_TIMEOUT_MS,
    )) as bigint;
  } catch (error) {
    console.warn('[allowance] failed', {
      token,
      chainId,
      error: error instanceof Error ? error.message : String(error),
    });
    allowance = 0n;
  }

  return NextResponse.json(
    { allowance: allowance.toString() },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    },
  );
}

