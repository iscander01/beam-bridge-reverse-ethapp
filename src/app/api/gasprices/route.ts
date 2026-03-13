import { NextResponse } from 'next/server';
import { EXPLORER_API_URL } from '@/shared/constants/bridge';

type GasPricesResponse = Record<string, { gasPrice: { hex: string } }>;

const REQUEST_TIMEOUT_MS = 10_000;

export async function GET() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(`${EXPLORER_API_URL}/gasprices`, { signal: controller.signal });
    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to load gas prices' }, { status: 502 });
    }

    const raw: GasPricesResponse = await res.json();
    const data = Object.fromEntries(Object.entries(raw).map(([key, value]) => [key, value.gasPrice.hex]));

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load gas prices';
    return NextResponse.json({ error: message }, { status: 502 });
  } finally {
    clearTimeout(timeoutId);
  }
}

