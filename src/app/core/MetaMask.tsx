import MetaMaskOnboarding from '@metamask/onboarding';
import { ethers, BigNumber } from 'ethers';
import EthPipe from '@app/eth-pipe/EthPipe.json';
import EthERC20Pipe from '@app/eth-pipe/EthERC20Pipe.json';
import { SendParams, Balance, Currency } from '@core/types';
import { CURRENCIES, MAX_ALLOWED_VALUE, REVOKE_VALUE, ethId, ROUTES } from '@app/shared/constants';
import { toast } from 'react-toastify';
import { loadAppParams, setIsApproveInProgress, setIsTrInProgress } from '@app/containers/Main/store/actions';
import store from '../../index';

const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3/simple/price';
const BRIDGES_API_URL = 'https://explorer-api.beam.mw/bridges';

let abi = require("human-standard-token-abi");

declare global {
    interface Window {
        ethereum: any;
    }
}

export default class MetaMaskController {
  isDisabled = true;
  private onboarding = new MetaMaskOnboarding();

  private static instance: MetaMaskController;
  private accounts = [];
  private ethers = null;
  private signer = null;

  static getInstance() {
    if (this.instance != null) {
      return this.instance;
    }
    this.instance = new MetaMaskController();
    return this.instance;
  }

  constructor() {}

  async loadEthBalance(address: string) {
    const ethBalance = await this.ethers.getBalance(address);
    return Number(ethers.utils.formatEther(ethBalance))
  }

  async loadTokenBalance(curr: Currency, address: string) {
    try {
      const token = new ethers.Contract(curr.ethTokenContract, abi, this.ethers);
      const tokenBalance = await token.balanceOf(address);
      const tokenBalanceFormatted = parseFloat(ethers.utils.formatUnits(tokenBalance, curr.decimals));
      return tokenBalanceFormatted
    } catch (e) {
      console.log(e);
      return null;
    }
  }

  init() {
    if (MetaMaskOnboarding.isMetaMaskInstalled()) {
      this.ethers = new ethers.providers.Web3Provider(window.ethereum);
      this.signer = this.ethers.getSigner();
    }
  }

  connect() {
    if (window.ethereum) {
      window.ethereum
          .request({ method: 'eth_requestAccounts' })
    } else {
        localStorage.setItem('wasReloaded', '1');
        window.location.reload();
    }
  }

  requestToContract = async (sender, receiver, abi) => {
    let nonce = await this.ethers.getTransactionCount(sender);
    let hashTx = await this.ethers.sendTransaction({
        from: sender,
        to: receiver,
        data: abi,
        gas: 2000000,
        nonce: nonce,
    });
  }

  async loadAllowance(curr: Currency, address: string) {
    try {
      const tokenContract = new ethers.Contract(
        curr.ethTokenContract,  
        abi,
        this.ethers
      );
  
      const allowance = await tokenContract.allowance(address, curr.ethPipeContract);
      return parseFloat(ethers.utils.formatUnits(allowance)) > 0;
    } catch (e) {
      console.log(e);
      return null;
    }
  }

  static amountToBigInt(amount, decimals, validDecimals: number) : bigint {
    let result = BigInt(Math.round(amount * Math.pow(10, validDecimals)));

    return result * BigInt(Math.pow(10, decimals - validDecimals));
  }

  async loadEthFee(params: SendParams) {
    const { amount, fee, address, selectedCurrency, account } = params;
    const finalAmount = MetaMaskController.amountToBigInt(amount, selectedCurrency.decimals, selectedCurrency.validator_dec);
    const relayerFee = MetaMaskController.amountToBigInt(fee, selectedCurrency.decimals, selectedCurrency.validator_dec);

    let transactionFee = null;

    const pipeContract = new ethers.Contract(
      selectedCurrency.ethPipeContract,  
      selectedCurrency.id === ethId ? EthPipe.abi : EthERC20Pipe.abi,
      this.ethers
    );

    try {
      const provider = new ethers.providers.EtherscanProvider(process.env.NETWORK, process.env.ETHERSCAN_API_KEY);
      const gasPrice = await provider.getGasPrice();
      const userSigner = pipeContract.connect(this.signer);
      const feeAmount = await userSigner.estimateGas.sendFunds(
        finalAmount,
        relayerFee,
        address.slice(0, 2) !== '0x' ? ('0x' + address) : address,
        selectedCurrency.id === ethId ? {
          from: account,
          value: finalAmount + relayerFee
        } : {}
      );

      transactionFee = gasPrice.mul(feeAmount);
    } catch (e) {
    }

    return transactionFee ? ethers.utils.formatUnits(transactionFee, "ether") : 0;
  }

  async sendToken(params: SendParams) {
    const { amount, fee, address, selectedCurrency, account } = params;
    const finalAmount = MetaMaskController.amountToBigInt(amount, selectedCurrency.decimals, selectedCurrency.validator_dec);
    const relayerFee = MetaMaskController.amountToBigInt(fee, selectedCurrency.decimals, selectedCurrency.validator_dec);
    const totalAmount = finalAmount + relayerFee;

    try {
      const pipeContract = new ethers.Contract(
        selectedCurrency.ethPipeContract,
        selectedCurrency.id === ethId ? EthPipe.abi : EthERC20Pipe.abi,
        this.ethers
      );
      const userSigner = pipeContract.connect(this.signer);
      const lockTx = await userSigner.sendFunds(
        finalAmount,
        relayerFee,
        address.slice(0, 2) !== '0x' ? ('0x' + address) : address,
        selectedCurrency.id === ethId ? {
          from: account,
          value: totalAmount
        } : {}
      );

      toast.promise(
        lockTx.wait(), {
          pending: {
            render({data}){
              store.dispatch(setIsTrInProgress(true));
              return 'Transaction is in progress';
            }
          },
          success: {
            render({data}){
              store.dispatch(loadAppParams.request(null));
              store.dispatch(setIsTrInProgress(false));
              return 'Transaction completed'
            },
          },
          error: 'Transaction rejected'
      });
    } catch (e) {
      store.dispatch(setIsTrInProgress(false));
    }
  }

  async updateTokenSendLimit(curr_id: number, amount: any, isApprove: boolean = false) {
    const currency = CURRENCIES.find((item) => item.id === curr_id);
    const tokenContract = new ethers.Contract(
      currency.ethTokenContract,  
      abi,
      this.ethers
    );

    const ethSigner = tokenContract.connect(this.signer);
    const approveTx = await ethSigner.approve(currency.ethPipeContract, amount);

    const approvePromise = new Promise((resolve, reject) => {
      store.dispatch(setIsApproveInProgress(true));
      approveTx.wait().then((receipt)=> {
        store.dispatch(setIsApproveInProgress(false));
        store.dispatch(loadAppParams.request(null));
        resolve(true);
      }, (error) => {
        reject(error);
      });
    });

    toast.promise(
      approvePromise, {
        pending: {
          render({data}){
            return (isApprove ? 'Approve ' : 'Revoke ') + 'is in progress';
          }
        },
        success: {
          render({data}){
            return (isApprove ? 'Approve ' : 'Revoke ') + 'completed'
          },
        },
        error: (isApprove ? 'Approve ' : 'Revoke ') + 'rejected'
    });
  }

  async approveToken(curr_id: number) {
    this.updateTokenSendLimit(curr_id, ethers.constants.MaxUint256, true);
  }

  async revokeToken(curr_id: number) {
    this.updateTokenSendLimit(curr_id, BigNumber.from(REVOKE_VALUE));
  }

  async loadTransactions(address: string, contract: string, id: number) {
    let trs = [];
    const tokenTrs = await fetch(`${BRIDGES_API_URL}/tokens_transfer/${address}/${contract}`);
    trs = await tokenTrs.json();
    
    return trs;
  }

  async loadGasPrice () {
    const provider = new ethers.providers.EtherscanProvider(process.env.NETWORK, process.env.ETHERSCAN_API_KEY);
    const gp = await provider.getGasPrice();
    const gasPrice = ethers.utils.formatUnits(gp, 'gwei');
    return gasPrice;
  }

  async loadRate (rate_id: string) {
    const response = await fetch(`${COINGECKO_API_URL}?ids=${rate_id}&vs_currencies=usd`, {
      mode: 'cors',
      headers: {
        'Access-Control-Allow-Origin':'*'
      }
    });
    const promise: Promise<any> = response.json();
    return promise;
  }

  async calcRelayerFee (rate_id: string) {
    const RELAY_COSTS_IN_GAS = 120000;
    const ETH_RATE_ID = 'ethereum';

    const gasPrice = await this.loadGasPrice();
    const ethRate = await this.loadRate(ETH_RATE_ID)
    const relayCosts = RELAY_COSTS_IN_GAS * parseFloat(gasPrice) * parseFloat(ethRate[ETH_RATE_ID]['usd']) / Math.pow(10, 9);
    const currRate = await this.loadRate(rate_id);

    const RELAY_SAFETY_COEFF = 1.1;
    return RELAY_SAFETY_COEFF * relayCosts;// / parseFloat(currRate[rate_id]['usd']);
  }
}