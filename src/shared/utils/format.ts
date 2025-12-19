export function compactHash(value: string, chars = 6) {
  if (!value) return '';
  if (value.length <= chars * 2 + 3) return value;
  return `${value.slice(0, chars)}…${value.slice(-chars)}`;
}

export function formatActiveAddressString(value: string = ''): string {
  if (!value) return '';
  if (value.length <= 12) return value;
  return `${value.substring(0, 6)}...${value.substring(value.length - 6)}`;
}

export function formatNumber(value: string | number, maxDecimals = 8) {
  const n = typeof value === 'string' ? Number(value) : value;
  if (!Number.isFinite(n)) return '';
  return n.toLocaleString(undefined, {
    maximumFractionDigits: maxDecimals,
  });
}

export function usd(value: number, rateUsd: number) {
  if (!Number.isFinite(value) || value <= 0) return '0 USD';
  const out = value * rateUsd;
  if (out < 0.01) return '< 1 cent';
  return `${out.toFixed(2)} USD`;
}

