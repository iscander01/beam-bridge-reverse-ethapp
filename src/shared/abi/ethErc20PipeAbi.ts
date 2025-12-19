export const ethErc20PipeAbi = [
  {
    type: 'function',
    name: 'sendFunds',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'value', type: 'uint256', internalType: 'uint256' },
      { name: 'relayerFee', type: 'uint256', internalType: 'uint256' },
      { name: 'receiverBeamPubkey', type: 'bytes', internalType: 'bytes' },
    ],
    outputs: [],
  },
] as const;

