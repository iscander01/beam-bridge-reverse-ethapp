import { BEAM_ADDRESS_LENGTH, NETWORK_INDICATOR } from '../constants/bridge';

export function parseBeamBridgeAddress(value: string): {
  networkIndicator: string;
  beamAddress: string;
} {
  const trimmed = value.trim();
  if (trimmed.length < BEAM_ADDRESS_LENGTH + 1) {
    return { networkIndicator: '', beamAddress: '' };
  }
  const beamAddress = trimmed.slice(-BEAM_ADDRESS_LENGTH);
  if (beamAddress.length !== BEAM_ADDRESS_LENGTH) {
    return { networkIndicator: '', beamAddress: '' };
  }
  // Beam address must be exactly 66 hex characters (33 bytes)
  if (!/^[0-9a-fA-F]{66}$/.test(beamAddress)) {
    return { networkIndicator: '', beamAddress: '' };
  }
  const networkIndicator = trimmed.slice(0, trimmed.length - BEAM_ADDRESS_LENGTH);
  if (!networkIndicator) {
    return { networkIndicator: '', beamAddress: '' };
  }
  return { networkIndicator, beamAddress };
}

export function chainIdFromIndicator(indicator: string): number | null {
  const entry = Object.entries(NETWORK_INDICATOR).find(([, v]) => v === indicator);
  if (!entry) return null;
  return Number(entry[0]);
}

export function formatEvmBridgeAddress(evmAddress: `0x${string}`, chainId: number): string {
  const suffix = NETWORK_INDICATOR[chainId];
  return suffix ? `${evmAddress}${suffix}` : evmAddress;
}
