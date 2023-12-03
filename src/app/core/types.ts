export type Pallete = 'green' | 'ghost' | 'purple' | 'blue' | 'red' | 'white' | 'vote-red' | 'red-disc';

export type ButtonVariant = 'regular' | 'ghost' | 'ghostBordered' | 'block' | 'validate' |
  'link' | 'icon' | 'connect' | 'disconnect' | 'revoke';

export interface BridgeTransaction {
  pid: number,
  status: string,
  id: string,
  amount: string,
  cid: string
}

export interface IncomingTransaction {
  amount: string,
  MsgId: string
}

export interface SendParams {
  selectedCurrency: Currency,
  amount: number,
  address: string,
  fee: number,
  account: string
}

export interface Currency {
  id: number,
  rate_id: string,
  decimals: number,
  name: string,
  validator_dec: number,
  ethPipeContract: string,
  ethTokenContract: string
}

export interface Balance {
  value: number,
  curr_id: number,
  rate_id: string,
  icon: string,
  is_approved: boolean
}
