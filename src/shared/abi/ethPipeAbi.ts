export const ethPipeAbi = [
  {
    type: 'function',
    name: 'sendFunds',
    stateMutability: 'payable',
    inputs: [
      { name: 'value', type: 'uint256', internalType: 'uint256' },
      { name: 'relayerFee', type: 'uint256', internalType: 'uint256' },
      { name: 'receiverBeamPubkey', type: 'bytes', internalType: 'bytes' },
    ],
    outputs: [],
  },
] as const;







