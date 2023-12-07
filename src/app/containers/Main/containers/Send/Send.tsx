import React, { useState, useRef, useEffect } from 'react';
import { styled } from '@linaria/react';
import { Button, Input, Window, Rate } from '@app/shared/components';
import { css } from '@linaria/core';
import { 
  IconBack,
  IconSend,
  IconDaiLarge,
  IconEthLarge,
  IconUsdtLarge,
  IconWbtcLarge,
  IconBeam,
  IconCheck,
  IconSendPink
} from '@app/shared/icons';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@app/shared/constants';
import { selectSystemState } from '@app/shared/store/selectors';
import MetaMaskController  from '@core/MetaMask';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ethId, CURRENCIES, ETH_RATE_ID } from '@app/shared/constants';
import { selectBalance, selectIsApproveInProgress, selectRate } from '../../store/selectors';
import { useFormik } from 'formik';
import { Currency } from '@app/core/types';

const metaMaskController = MetaMaskController.getInstance();
const BEAM_ADDRESS_LENGTH = 66;

interface SendFormData {
  send_amount: string;
  address: string;
}

const ControlStyled = styled.div`
  width: 600px;
  margin: 20px auto;
  flex-direction: row;
  display: flex;

  > .back {
    cursor: pointer;
    display: flex;
    flex-direction: row;

    > .back-text {
      opacity: .3;
      font-size: 14px;
      font-weight: bold;
      margin-left: 15px;
    }
  }
`;

const FormStyled = styled.form`
  width: 600px;
  border-radius: 10px;
  backdrop-filter: blur(10px);
  background-image: linear-gradient(to bottom, rgba(218, 104, 245, 0.5), rgba(218, 104, 245, 0)), linear-gradient(to bottom, #0d4d76, #0d4d76);
  padding: 50px 30px;
  display: flex;
  flex-direction: column;

  > .title {
    font-size: 24px;
    font-weight: bold;
    align-self: center;
  }

  > .address-from-params {
    word-break: break-word;
    font-size: 16px;
    margin-top: 20px;
  }

  > .address-type {
    margin-top: 8px;
    opacity: 0.5;
    font-size: 12px;
  }

  > .approve-msg {
    opacity: 0.7;
    font-style: italic;
    font-size: 14px;
    margin: 30px auto 0;
  }

  > .separator {
    height: 1px;
    width: 100%;
    background-color: rgba(255, 255, 255, 0.1);
    margin: 20px 0;
  }
`;

const FormSubtitle = styled.p`
  font-size: 14px;
  font-weight: bold;
  margin-top: 30px;
  letter-spacing: 2.63px;
`;

const InfoContainer = styled.div`
  margin-top: 20px;
  width: 600px;
  padding: 50px
  border-radius: 10px;
  background-color: rgba(13, 77, 118, .95);

  > .info-title {
    font-size: 14px;
    font-style: italic;
    opacity: 0.7;
    margin-bottom: 20px;
  }

  > ul .info-item {
    line-height: 1.57;
    font-size: 14px;
    font-style: italic;
    color: rgba(255, 255, 255, .7);
  }

  > ul li .link {
    cursor: pointer;
    font-weight: bold;
    color: #05e2c2;
  }

  > ul li .line {
    color: #ffffff;
    font-weight: bold;
    margin-right: 4px;
  }
`;

const FeeContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;

  > .fee-item .fee-value {
      font-size: 14px;
      font-weight: 600;
      color: #da68f5;
      margin-top: 10px;
  }

  > .fee-item .fee-warning{
    font-size: 14px;
    font-weight: 600;
    color: var(--color-red);
    font-style: italic;
    margin-top: 10px;
  }
`;

const AvailableContainer = styled.div`
  display: flex;
  flex-direction: column;
  margin-top: 30px;

  > .header {
    font-weight: 700;
    font-size: 14px;
    line-height: 17px;
    letter-spacing: 3.11111px;
    display: flex;

    > .add-max {
      margin-left: auto;
      cursor: pointer;
      display: flex;

      > .text {
        font-weight: 700;
        font-size: 14px;
        line-height: 17px;
        color: #DA68F5;
        margin-left: 10px;
      }
    }
  }

  > .balance {
    margin-top: 10px;
    font-weight: 400;
    font-size: 14px;
  }

  > .rate {
    margin-top: 5px;
    font-size: 12px;
    mix-blend-mode: normal;
    opacity: 0.5;
  }
`;

const CurrencyIconClass = css`
  margin: 50px auto 0;
`;

const RateStyleClass = css`
  font-size: 12px;
  align-self: start;
`;

const ApproveButtonClass = css`
  margin-top: 30px !important;
`;

const TransferButtonClass = css`
  max-width: 180px !important;
  margin-top: 50px !important;
`;

const FeeSubtitleClass = css`
  margin-top: 0 !important;
`;

const FeeSubtitleWarningClass = css`
  color: var(--color-red);
  margin-top: 0 !important;
`;

const Send = () => {
  const navigate = useNavigate();
  const addressInputRef = useRef<HTMLInputElement>();
  const amountInputRef = useRef<HTMLInputElement>();
  const systemState = useSelector(selectSystemState());
  const balance = useSelector(selectBalance());
  const rates = useSelector(selectRate());
  const isApproveInProgress = useSelector(selectIsApproveInProgress());

  const [selectedCurrency, setSelectedCurrency] = useState(null);
  const [relayerFeeVal, setRelayerFeeVal] = useState(null);
  const [ethFeeVal, setEthFeeVal] = useState(null);
  const [parsedAddressValue, setParsedAddressValue] = useState(null);
  const [isAllowed, setIsAllowed] = useState(null);
  const [isNetworkFeeAvailable, setIsNetworkFeeAvailable] = useState(false);
  
  let relayerFeeInterval = null;

  const [isLoaded, setIsLoaded] = useState(false);
  const [availableBalance, setAvailableBalance] = useState({
    value: 0,
    rate: 0
  })
  const { address: addressFromParams } = useParams();
  const ICONS = {
    beam: () => (<IconBeam className={CurrencyIconClass}/>),
    usdt: () => (<IconUsdtLarge className={CurrencyIconClass}/>),
    wbtc: () => (<IconWbtcLarge className={CurrencyIconClass}/>),
    dai: () => (<IconDaiLarge className={CurrencyIconClass}/>),
    eth: () => (<IconEthLarge className={CurrencyIconClass}/>),
  };

  const formik = useFormik<SendFormData>({
    initialValues: {
        send_amount: '',
        address: ''
    },
    isInitialValid: false,
    onSubmit: (value) => {
    
    },
    validate: (e) => validate(e),
  });

  const {
    values, setFieldValue, errors, submitForm, resetForm
  } = formik;

  //balance state
  useEffect(() => {
    if (balance.length > 0) {
      setIsLoaded(true);
    } else {
      setIsLoaded(false);
    }
  }, [balance]);
  
  //address from params
  useEffect(() => {
    if (addressFromParams && isLoaded) {
      const parsedCurrency = parseCurrency(addressFromParams);
      if (parsedCurrency) {
        setSelectedCurrency(parsedCurrency);
      }
    }
  }, [addressFromParams, isLoaded]);

  //is allowed state
  useEffect(() => {
    if (selectedCurrency && balance.length > 0) {
      if (selectedCurrency.id !== ethId) {
        const fromBalance = balance.find((item) => item.curr_id === selectedCurrency.id)
        setIsAllowed(fromBalance.is_approved);
      } else {
        setIsAllowed(true);
      }
    }
  }, [selectedCurrency, balance]);

  useEffect(() => {
    if (selectedCurrency && rates) {
      setAvailableBalance({
        value: getBalance(selectedCurrency.id),
        rate: rates[selectedCurrency.rate_id].usd
      });
      if (relayerFeeInterval) {
        relayerFeeInterval = setInterval(() => calcRelayerFee(selectedCurrency), 5000);
      }
      calcRelayerFee(selectedCurrency);
    } else {
      clearInterval(relayerFeeInterval);
      setRelayerFeeVal(null);
    }
  }, [selectedCurrency, rates]);

  const validate = async (formValues: SendFormData) => {
    const errorsValidation: any = {};
    const {
        send_amount,
        address
    } = formValues;

    let parsedCurrency = addressFromParams ? parseCurrency(addressFromParams) : null;
    if (!parsedCurrency) {
      parsedCurrency =  parseCurrency(address);
    }

    const regex = new RegExp('^[A-Za-z0-9]+$');
    if (!regex.test(address || addressFromParams) || !parsedCurrency) {
      errorsValidation.address = `Unrecognized address`;
    }
    
    if (parsedCurrency && relayerFeeVal && !metaMaskController.isDisabled) {
      const sendAmount = Number(send_amount);
      const fromBalance = balance.find((item) => item.curr_id === parsedCurrency.id);
      const ethBalance = balance.find((item) => item.curr_id === ethId);
      if (parsedCurrency.id === ethId ? 
        (sendAmount + relayerFeeVal + ethFeeVal) > fromBalance.value : 
        (sendAmount + relayerFeeVal) > fromBalance.value) {
        errorsValidation.send_amount = `Insufficient funds to complete the transaction.`;
        setIsNetworkFeeAvailable(false);
      } else {
        if (sendAmount < relayerFeeVal) {
          setIsNetworkFeeAvailable(false);
          errorsValidation.send_amount = `Insufficient funds to pay transaction fee.`;
        } else {
          setIsNetworkFeeAvailable((sendAmount + relayerFeeVal) <= fromBalance.value);

          if (parsedCurrency.id === ethId) {
            if (sendAmount < (relayerFeeVal + ethFeeVal)) {
              errorsValidation.send_amount = `Insufficient funds to pay transaction fee.`;
            }
          } else {
            if (ethBalance.value < ethFeeVal) {
              errorsValidation.send_amount = `Insufficient funds to pay transaction fee.`;
            }
          }
        }
      }
      //Maximum amount is ${fromBalance.value} ${parsedCurrency.name}      
    }

    return errorsValidation;
  };

  const isAddressValid = () => !errors.address;
  const isSendAmountValid = () => !errors.send_amount;

  const isFormDisabled = () => {
    if (!formik.isValid) return !formik.isValid;
    if (metaMaskController.isDisabled) return true;
    return false;
  };

  const resetState = () => {
    setRelayerFeeVal(null);
    setParsedAddressValue(null);
    setIsAllowed(null);
    setIsLoaded(false);
    setSelectedCurrency(null);
    metaMaskController.isDisabled = true;
  }

  const getBalance = (id: number) => {
    const balanceItem = balance.find((item) => {
      return item.curr_id === id;
    });
    return balanceItem ? balanceItem.value : 0;
  };

  const parseCurrency = (value: string):Currency => {
    const key = value.slice(-BEAM_ADDRESS_LENGTH);
    if (key.length === BEAM_ADDRESS_LENGTH) {
      const currName = value.slice(0, value.length - BEAM_ADDRESS_LENGTH);
      const parsedCurrency = findCurrency(currName);
      if (parsedCurrency) {
        setParsedAddressValue(key);
        return parsedCurrency;
      }
    }

    return null;
  };

  const findCurrency = (currencyName: string) => {
    return CURRENCIES.find((item) => {
      return item.name.toLowerCase() === currencyName;
    });
  };

  const calcRelayerFee = (curr) => {
    const feeInUsd = rates.beam.usd * 0.02;
    const feeInEth = feeInUsd / rates[curr.rate_id].usd;
    setRelayerFeeVal(feeInEth);
  };

  const getEthFee = async (amount) => {
    let address = addressFromParams ? parsedAddressValue : values.address as string;
    if (address.length > 66) {
      address = address.slice(-66)
    }
    
    const sendData = {
      address,
      amount,
      fee: relayerFeeVal,
      selectedCurrency,
      account: systemState.account
    };

    const fee = await metaMaskController.loadEthFee(sendData);
    setEthFeeVal(Number(fee));
  };

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async event => {
    event.preventDefault();
    const sendData = {
      address: parsedAddressValue,
      amount: Number(values.send_amount),
      fee: relayerFeeVal,
      selectedCurrency,
      account: systemState.account
    };

    metaMaskController.sendToken(sendData);
    resetState()
    navigate(ROUTES.MAIN.BASE);
  };

  const handleBackClick: React.MouseEventHandler = () => {
    resetState();
    navigate(ROUTES.MAIN.BASE);
  };

  const handleApproveTokenClick = (id: number) => {
    metaMaskController.approveToken(id);
  };

  const handleDownloadClick: React.MouseEventHandler = () => {
    window.open('https://beam.mw/downloads', '_blank').focus();
  }

  const debounce = (fn, delay) => {
    let timerId;
    return (...args) => {
      clearTimeout(timerId);
      timerId = setTimeout(() => fn(...args), delay);
    }
  };

  const handleAmountChange = (amount: string) => {
    const amountVal = Number(amount);
    if (metaMaskController.isDisabled && amountVal > 0) {
      metaMaskController.isDisabled = false;
    }

    setFieldValue('send_amount', amount, true);

    if (availableBalance.value >= (amountVal + relayerFeeVal) && amountVal > relayerFeeVal) {
      getEthFee(amount);
    } else {
      setEthFeeVal(null);
    }
  };

  const handleAddressChange = (address: string) => {
    setFieldValue('address', address, true);
    setFieldValue('send_amount', '', false);
    const parsedCurrency = parseCurrency(address);
    setSelectedCurrency(parsedCurrency ? parsedCurrency : null);
  }

  const handleAddMaxClick = () => {
    if (metaMaskController.isDisabled) {
      metaMaskController.isDisabled = false;
    }

    const maxValue = availableBalance.value - relayerFeeVal;
    if (maxValue > 0) {
      setFieldValue('send_amount', availableBalance.value - relayerFeeVal, true);
      getEthFee(availableBalance.value - relayerFeeVal);
    }
  }

  return (
    <Window>
      <ControlStyled>
        <div className='back' onClick={handleBackClick}>
          <IconBack/>
          <div className='back-text'>
            back
          </div>
        </div>
      </ControlStyled>
      <FormStyled autoComplete="off" noValidate onSubmit={handleSubmit}>
        <p className='title'>Ethereum to Beam</p>
        <FormSubtitle>BEAM BRIDGE ADDRESS</FormSubtitle>
        { isLoaded && 
          <> { 
            addressFromParams && parsedAddressValue
            ? (<div className='address-from-params'>{addressFromParams}</div>)
            : (<Input placeholder='Paste Beam bridge address here' 
              valid={isAddressValid()}
              variant="common"
              label={errors.address}
              value={values.address}
              onChangeHandler={handleAddressChange}
              ref={addressInputRef} 
              name="address"/>)
          }
          {
            selectedCurrency !== null &&
            <div className='address-type'>
              {`${selectedCurrency.name} address`}
            </div>
          }
        {
          isAllowed && selectedCurrency ? 
          (<>
            <FormSubtitle>AMOUNT</FormSubtitle>
            <Input 
              variant='amount'
              selectedCurrency={selectedCurrency}
              onChangeHandler={handleAmountChange}
              label={errors.send_amount}
              valid={isSendAmountValid()}
              value={values.send_amount}
              ref={amountInputRef} name="amount"></Input>
            <AvailableContainer>
              <div className='header'>
                <span className='title'>AVAILABLE</span>
                <span className='add-max' onClick={handleAddMaxClick}>
                  <IconSendPink/>
                  <span className='text'>max</span>
                </span>
              </div>
              <div className='balance'> {availableBalance.value} {selectedCurrency.name == "BEAM" ? "WBEAM" : selectedCurrency.name} </div>
              <div className='rate'>{availableBalance.rate} USD</div>
            </AvailableContainer>
            <div className='separator'/>
            <FeeContainer>
              <div className='fee-item'>
                <FormSubtitle className={FeeSubtitleClass}>RELAYER FEE</FormSubtitle>
                { relayerFeeVal && <>
                  <div className='fee-value'>{relayerFeeVal.toFixed(12).replace(/\.?0+$/,"")} {selectedCurrency.name == "BEAM" ? "WBEAM" : selectedCurrency.name}</div>
                  <Rate value={parseFloat(relayerFeeVal)}
                    selectedCurrencyId={selectedCurrency.rate_id}
                    className={RateStyleClass} />
                </>}
              </div>
              <div className='fee-item'>
                <FormSubtitle className={!isNetworkFeeAvailable ? FeeSubtitleWarningClass : FeeSubtitleClass}>
                  EXPECTED ETHEREUM NETWORK FEE
                </FormSubtitle>
                {isNetworkFeeAvailable && ethFeeVal && ethFeeVal > 0 && <>
                  <div className='fee-value'>{ethFeeVal.toFixed(12).replace(/\.?0+$/,"")} ETH</div>
                  <Rate value={parseFloat(ethFeeVal)}
                    selectedCurrencyId={ETH_RATE_ID}
                    className={RateStyleClass} />
                </>}
                {!isNetworkFeeAvailable && <div className='fee-warning'>Insufficient funds to calculate.</div>}
              </div>
            </FeeContainer>
            <Button className={TransferButtonClass}
                  type="submit"
                  disabled={isFormDisabled()}
                  pallete='purple' icon={IconSend}>
                    transfer
            </Button>
          </>) 
          : (selectedCurrency !== null &&
              <>
                {ICONS[selectedCurrency.name.toLowerCase()]()}
                <div className='approve-msg'>
                  {`To send funds to BEAM please approve W${selectedCurrency.name} token first`}
                </div>
                <Button className={ApproveButtonClass}
                  disabled={isApproveInProgress}
                  onClick={()=>handleApproveTokenClick(selectedCurrency.id)}
                  color="send"
                  pallete='green' icon={IconCheck}>
                    approve token
                </Button>
              </>)
        } 
        </>}
      </FormStyled>
      { 
        !selectedCurrency && <InfoContainer>
          <div className='info-title'>
            In order to transfer from Ethereum to Beam network, do the following:
          </div>
          <ul>
            <li className='info-item'>
              1.	Download the latest verison of <span className='link' onClick={handleDownloadClick}>Beam Wallet</span> 
            </li>
            <li className='info-item'>2.	Launch Bridges DApp from DApp store</li>
            <li className='info-item'>
              3.	Select <span className='line'>Ethereum to Beam</span> 
              and follow instructions to obtain Beam bridge address
            </li>
            <li className='info-item'>4.	Get back to this screen and paste the address</li>
          </ul>
        </InfoContainer>
      }
    </Window>
  );
};

export default Send;
