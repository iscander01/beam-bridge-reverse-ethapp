import { NextResponse } from 'next/server';
import { createPublicClient, erc20Abi, formatUnits, http, isAddress } from 'viem';
import { arbitrum, arbitrumSepolia, mainnet } from 'viem/chains';
import { ASSETS_BY_CHAIN, TOKENS_BY_CHAIN } from '@/shared/constants/bridge';
import type { BalanceEntry, BalancesResponse } from '@/shared/types/balances';

type AssetLookup = {
  name: string;
  symbol: string;
  decimals: number;
  kind: 'native' | 'erc20';
  token?: `0x${string}`;
};

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

function buildAssetList(chainId: number): AssetLookup[] {
  const config = CHAIN_CONFIG[chainId as keyof typeof CHAIN_CONFIG];
  if (!config) return [];

  const assets: AssetLookup[] = [];
  const knownAssets = ASSETS_BY_CHAIN[chainId] ?? [];

  for (const asset of knownAssets) {
    assets.push({
      name: asset.name,
      symbol: asset.name,
      decimals: asset.decimals,
      kind: asset.kind,
      token: asset.kind === 'erc20' && asset.ethTokenContract ? asset.ethTokenContract : undefined,
    });
  }

  if (!assets.some((asset) => asset.kind === 'native')) {
    assets.push({
      name: config.chain.nativeCurrency.symbol,
      symbol: config.chain.nativeCurrency.symbol,
      decimals: config.chain.nativeCurrency.decimals,
      kind: 'native',
    });
  }

  const wbeam = TOKENS_BY_CHAIN[chainId]?.wbeam;
  if (wbeam) {
    assets.push({
      name: wbeam.symbol,
      symbol: wbeam.symbol,
      decimals: wbeam.decimals,
      kind: 'erc20',
      token: wbeam.token,
    });
  }

  const deduped = new Map<string, AssetLookup>();
  for (const asset of assets) {
    if (!deduped.has(asset.name)) {
      deduped.set(asset.name, asset);
    }
  }

  return Array.from(deduped.values());
}

async function resolveBalance(
  client: ReturnType<typeof createPublicClient>,
  address: `0x${string}`,
  asset: AssetLookup,
): Promise<BalanceEntry> {
  try {
    if (asset.kind === 'native') {
      const value = await withTimeout(client.getBalance({ address }), RPC_TIMEOUT_MS);
      return {
        name: asset.name,
        symbol: asset.symbol,
        decimals: asset.decimals,
        formatted: formatUnits(value, asset.decimals),
        value: value.toString(),
        kind: asset.kind,
      };
    }

    if (!asset.token) {
      return {
        name: asset.name,
        symbol: asset.symbol,
        decimals: asset.decimals,
        formatted: '0',
        value: '0',
        kind: asset.kind,
      };
    }

    const value = (await withTimeout(
      client.readContract({
        address: asset.token,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [address],
      }),
      RPC_TIMEOUT_MS,
    )) as bigint;

    return {
      name: asset.name,
      symbol: asset.symbol,
      decimals: asset.decimals,
      formatted: formatUnits(value, asset.decimals),
      value: value.toString(),
      kind: asset.kind,
      token: asset.token,
    };
  } catch (error) {
    console.warn('[balances] balance fetch failed', {
      asset: asset.name,
      token: asset.token,
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      name: asset.name,
      symbol: asset.symbol,
      decimals: asset.decimals,
      formatted: '0',
      value: '0',
      kind: asset.kind,
      token: asset.token,
    };
  }
}

export async function POST(req: Request) {
  const startedAt = Date.now();
  const body = await req.json().catch(() => null);
  const rawAddress = body?.address as string | undefined;
  const chainId = Number(body?.chainId);

  if (!rawAddress || !isAddress(rawAddress) || !Number.isFinite(chainId)) {
    console.warn('[balances] invalid request', { address: rawAddress, chainId });
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const address = rawAddress as `0x${string}`;

  const config = CHAIN_CONFIG[chainId as keyof typeof CHAIN_CONFIG];
  if (!config) {
    console.warn('[balances] unsupported chain', { address, chainId });
    return NextResponse.json({ error: 'Unsupported chain' }, { status: 400 });
  }

  console.log('[balances] request', { address, chainId });

  const client = createPublicClient({
    chain: config.chain,
    transport: http(config.rpcUrl, { timeout: RPC_TIMEOUT_MS }),
  });

  const assets = buildAssetList(chainId);
  const entries = await Promise.all(assets.map((asset) => resolveBalance(client, address, asset)));
  const balances = entries.reduce<Record<string, BalanceEntry>>((acc, entry) => {
    acc[entry.name] = entry;
    return acc;
  }, {});

  const response: BalancesResponse = {
    address,
    chainId,
    balances,
  };

  console.log('[balances] response', {
    address,
    chainId,
    assets: assets.length,
    ms: Date.now() - startedAt,
  });

  return NextResponse.json(response, {
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}

