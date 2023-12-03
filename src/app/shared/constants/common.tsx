export const GROTHS_IN_BEAM = 100000000;
export const BEAMX_TVL = 100000000;
export const BEAMX_TVL_STR = '100 000 000';

export const ethId = 4;
export const ETH_RATE_ID = 'ethereum';

export const MAX_ALLOWED_VALUE = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
export const REVOKE_VALUE = '0';

export const CURRENCIES = [
    {
        name: "BEAM",
        rate_id: 'beam',
        id: 1,
        decimals: 8,
        validator_dec: 8,
        ethTokenContract: '0xE5AcBB03D73267c03349c76EaD672Ee4d941F499',
        ethPipeContract: '0x6063024646E8A1561970840a4b0e0f1082f5a670',       
    },
    {
        name: 'ETH',
        rate_id: 'ethereum',
        id: ethId,
        decimals: 18,
        validator_dec: 8,
        ethTokenContract: '',
        ethPipeContract: '0xF0860856D305803bF2adbEF064CC38bE94A9d006',
    }
];