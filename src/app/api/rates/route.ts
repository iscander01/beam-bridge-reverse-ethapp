import { NextResponse } from 'next/server';
import { EXPLORER_API_URL } from '@/shared/constants/bridge';

const REQUEST_TIMEOUT_MS = 10_000;

export async function GET() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(`${EXPLORER_API_URL}/rates`, { signal: controller.signal });
    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to load rates' }, { status: 502 });
    }

    const data = await res.json();
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load rates';
    return NextResponse.json({ error: message }, { status: 502 });
  } finally {
    clearTimeout(timeoutId);
  }
}

