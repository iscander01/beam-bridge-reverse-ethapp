import React, { useState, useRef, useEffect } from 'react';
import { styled } from '@linaria/react';
import { Button, Input, Window, Rate } from '@app/shared/components';
import { css } from '@linaria/core';
import { estimateGas } from '@wagmi/core';
import { config } from "@core/wagmiConfig";
import EthERC20Pipe from '@app/shared/constants/eth-pipe/EthERC20Pipe.json';
import { 
  IconBack,
  IconSend,
  IconCheck,
  IconSendPink
} from '@app/shared/icons';
import { useNavigate } from 'react-router-dom';
import { CURRENCY_IDS, NETWORKS_BY_ID, ROUTES } from '@app/shared/constants';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { CURRENCIES, ETH_RATE_ID } from '@app/shared/constants';
import { useFormik } from 'formik';
import { Box, Divider, HStack, Text, VStack } from '@chakra-ui/react';
import { useTokenBalanceAndAllowance } from '@app/shared/hooks';
import { useAccount, useSwitchChain, useWaitForTransactionReceipt, useWriteContract } from 'wagmi';
import { Currency } from '@app/shared/interface/Common';
import { parseNetwork, parseAddress, amountToBigInt } from "@core/appUtils";
import { encodeFunctionData, erc20Abi, maxUint256 } from 'viem';
import { ethers } from 'ethers';

import { selectGasPrices, selectIsApproveInProgress, selectRates } from '../../store/selectors';
import { loadGasPrices } from '../../store/actions';
import { toast } from 'react-toastify';

interface SendFormData {
  send_amount: string;
  address: string;
}

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
  padding: 50px;
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

const DEFAULT_RELAYER_FEE = 0.02;

const Send = () => {
  const navigate = useNavigate();
  const addressInputRef = useRef<HTMLInputElement>(null);
  const amountInputRef = useRef<HTMLInputElement>(null);
  const dispatch = useDispatch();
  const rates = useSelector(selectRates());
  const gasPrices = useSelector(selectGasPrices());
  const isApproveInProgress = useSelector(selectIsApproveInProgress());

  const [selectedCurrency, setSelectedCurrency] = useState<Currency>();
  const [relayerFeeVal, setRelayerFeeVal] = useState<number>(DEFAULT_RELAYER_FEE);
  const [ethFeeVal, setEthFeeVal] = useState<number>();
  const [parsedAddressValue, setParsedAddressValue] = useState<string>("");
  const [selectedNetworkId, setSelectedNetworkId] = useState<string>("");
  const [isNetworkFeeAvailable, setIsNetworkFeeAvailable] = useState(false);

  const { address, chain: activeChain } = useAccount();
  const { switchChain } = useSwitchChain();
  const { writeContract, data: hash } = useWriteContract();


  const { tokenBalance, ethBalance, allowance, isLoading, error } = useTokenBalanceAndAllowance({
    address: address as `0x${string}`,
    activeChainId: activeChain?.id as number,
  });

  const { data: receipt, isLoading: isTxLoading, isSuccess: isTxSuccess, isError: isTxError } = useWaitForTransactionReceipt({
    hash,
  });
  
  let relayerFeeInterval: NodeJS.Timer;

  const { address: addressFromParams } = useParams();

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
  
  useEffect(() => {
    if (isTxLoading) {
      toast("Transaction is in progress");
    }

    if (isTxSuccess) {
      toast("Transaction completed");
      // resetState()
      // navigate(ROUTES.MAIN.BASE);
    }

    if (isTxError) {
      toast("Transaction declined");
    }
  }, [isTxLoading, isTxSuccess, isTxError]);

  useEffect(() => {
    if (rates) {
      dispatch(loadGasPrices.request());
    }
  }, [rates]);
  
  useEffect(() => {
    if (addressFromParams) {
      const { networkIndicator, parsedAddress } = parseAddress(addressFromParams);
      setParsedAddressValue(parsedAddress);
      const { networkId } = parseNetwork(networkIndicator);
      setSelectedNetworkId(networkId);
      setSelectedCurrency(CURRENCIES[networkId][CURRENCY_IDS.BEAM]);
    }
  }, [addressFromParams]);

  useEffect(() => {
    if (selectedNetworkId && Number(selectedNetworkId) !== activeChain?.id) {
      switchChain?.({ chainId: Number(selectedNetworkId) });
    }
  }, [selectedNetworkId, activeChain]);

  useEffect(() => {
    if (selectedNetworkId && Object.keys(rates).length > 0 && selectedCurrency) {
      if (relayerFeeInterval) {
        relayerFeeInterval = setInterval(() => calcRelayerFee(rates[selectedCurrency.rate_id].usd), 5000);
      }
      calcRelayerFee(rates[selectedCurrency.rate_id].usd);
    } else {
      clearInterval(relayerFeeInterval);
      setRelayerFeeVal(DEFAULT_RELAYER_FEE);
    }
  }, [selectedNetworkId, rates, selectedCurrency]);

  const calcRelayerFee = (rate: number) => {
    setRelayerFeeVal((rate * 0.02) / rate);
  };

  const validate = async (formValues: SendFormData) => {
    const errorsValidation: any = {};
    const {
        send_amount,
        address
    } = formValues;

    let parsedCurrency = addressFromParams ? parseAddress(addressFromParams) : null;
    if (!parsedCurrency) {
      parsedCurrency =  parseAddress(address);
    }

    const regex = new RegExp('^[A-Za-z0-9]+$');
    const addressToTest = address || addressFromParams || '';
    if (!regex.test(addressToTest) || !parsedCurrency) {
      errorsValidation.address = `Unrecognized address`;
    }
    
    if (parsedCurrency && relayerFeeVal) {
      const sendAmount = Number(send_amount);
      if ((sendAmount + relayerFeeVal) > Number(tokenBalance?.formatted)) {
        errorsValidation.send_amount = `Insufficient funds to complete the transaction.`;
        setIsNetworkFeeAvailable(false);
      } else {
        if (sendAmount < relayerFeeVal) {
          setIsNetworkFeeAvailable(false);
          errorsValidation.send_amount = `Insufficient funds to pay transaction fee.`;
        } else {
          setIsNetworkFeeAvailable((sendAmount + relayerFeeVal) <= Number(tokenBalance?.formatted));

          if (ethFeeVal && Number(ethBalance?.formatted) < ethFeeVal) {
            errorsValidation.send_amount = `Insufficient funds to pay transaction fee.`;
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
    return false;
  };

  const resetState = () => {
    setRelayerFeeVal(DEFAULT_RELAYER_FEE);
    setParsedAddressValue("");
    setSelectedCurrency(undefined);
  }

  const getEthFee = async (amount: number) => {
    if (selectedCurrency) {
      let addressBeam = addressFromParams ? parsedAddressValue : values.address as string;
      if (addressBeam.length > 66) {
        addressBeam = addressBeam.slice(-66)
      }

      const finalAmount = amountToBigInt(amount, selectedCurrency.decimals, selectedCurrency.validator_dec);
      const relayerFee = amountToBigInt(relayerFeeVal, selectedCurrency.decimals, selectedCurrency.validator_dec);

      const functionName = 'sendFunds';
      const data = encodeFunctionData({
        abi: EthERC20Pipe.abi,
        functionName,
        args: [
          finalAmount,
          relayerFee,
          addressBeam.slice(0, 2) !== '0x' ? ('0x' + addressBeam) : addressBeam,
        ],
      });

      const gasEstimate = await estimateGas(config, {
        to: selectedCurrency.ethPipeContract as `0x${string}`,
        data: data,
      });

      const gasPrice = ethers.BigNumber.from(
        gasPrices[NETWORKS_BY_ID[selectedNetworkId].relayerFeeNetworkId]
      );
      const gasEstimateBN = ethers.BigNumber.from(gasEstimate);
      
      const feeValue = ethers.utils.formatUnits(
        gasPrice.mul(gasEstimateBN),
        "ether"
      );

      setEthFeeVal(Number(feeValue));
    }
  };

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async event => {
    event.preventDefault();

    if (selectedCurrency) {
      const finalAmount = amountToBigInt(Number(values.send_amount), selectedCurrency.decimals, selectedCurrency.validator_dec);
      const relayerFee = amountToBigInt(relayerFeeVal, selectedCurrency.decimals, selectedCurrency.validator_dec);
      const beamAddress = parsedAddressValue.slice(0, 2) !== '0x' ? ('0x' + parsedAddressValue) : parsedAddressValue;

      writeContract({
        address: selectedCurrency.ethPipeContract as `0x${string}`,
        abi: EthERC20Pipe.abi,
        functionName: 'sendFunds',
        args: [
          finalAmount,
          relayerFee,
          beamAddress,
        ],
      });
    }
  };

  const handleBackClick: React.MouseEventHandler = () => {
    resetState();
    navigate(ROUTES.MAIN.BASE);
  };

  const handleApproveTokenClick = (id: number) => {
    toast('Approve is in progress');
    writeContract({
      address: selectedCurrency?.ethTokenContract as `0x${string}`,
      abi: erc20Abi,
      functionName: 'approve',
      args: [selectedCurrency?.ethPipeContract as `0x${string}`, maxUint256],
    });
  };

  const handleDownloadClick: React.MouseEventHandler = () => {
    window.open('https://beam.mw/downloads', '_blank');
  }

  const handleAmountChange = (amount: string) => {
    const amountVal = Number(amount);
    setFieldValue('send_amount', amount, true);

    if (Number(tokenBalance?.formatted) >= (amountVal + relayerFeeVal) && amountVal > relayerFeeVal) {
      getEthFee(amountVal);
    } else {
      setEthFeeVal(undefined);
    }
  };

  const handleAddressChange = (address: string) => {
    setFieldValue('address', address, true);
    setFieldValue('send_amount', '', false);

    const { networkIndicator, parsedAddress } = parseAddress(address);
    setParsedAddressValue(parsedAddress);
    const { networkId } = parseNetwork(networkIndicator);
    if (networkId) {
      setSelectedNetworkId(networkId);
      setSelectedCurrency(CURRENCIES[networkId][CURRENCY_IDS.BEAM]);
    }
  }

  const handleAddMaxClick = () => {
    if (relayerFeeVal) {
      const maxValue = Number(tokenBalance?.formatted) - relayerFeeVal;
      if (maxValue > 0) {
        setFieldValue('send_amount', maxValue, true);
        getEthFee(maxValue);
      }
    }
  }

  return (
    <Window>
      <HStack width="600px" margin="20px auto">
        <HStack cursor={"pointer"} onClick={handleBackClick}>
          <IconBack style={{ width: "15px", height: "15px" }}/>
          <Text ml={"5px"} fontSize={"14px"} fontWeight={"bold"} opacity={".3"}>
            back
          </Text>
        </HStack>
      </HStack>

      <FormStyled autoComplete="off" noValidate onSubmit={handleSubmit}>
        <Text fontSize={"24px"} fontWeight={"bold"} alignSelf={"center"}>Ethereum to Beam</Text>
        <Text fontSize={"14px"} fontWeight={"bold"} mt={"30px"} letterSpacing={"2.6px"}>BEAM BRIDGE ADDRESS</Text>
        { addressFromParams && parsedAddressValue ? (
          <Text wordBreak={"break-word"} fontSize={"16px"} mt={"20px"}>{addressFromParams}</Text>
        ) : (
          <Input
            placeholder='Paste Beam bridge address here' 
            valid={isAddressValid()}
            variant="common"
            label={errors.address}
            value={values.address}
            onChangeHandler={handleAddressChange}
            ref={addressInputRef} 
            name="address"
          />
        )}

        {/* { selectedCurrency && (
          <Text mt={"8px"} opacity={"0.5"} fontSize={"12px"}>
            {`${selectedCurrency?.name} address`}
          </Text>
        )} */}
        { !!allowance && selectedCurrency ? (
          <>
            <Text fontSize={"14px"} fontWeight={"bold"} mt={"30px"} letterSpacing={"2.6px"}>AMOUNT</Text>
            <Input 
              variant='amount'
              selectedCurrency={selectedCurrency}
              onChangeHandler={handleAmountChange}
              label={errors.send_amount}
              valid={isSendAmountValid()}
              value={values.send_amount}
              ref={amountInputRef} name="amount"
            />

            <HStack mt={"30px"}>
              <VStack gap={0} alignItems={"start"}>
                <Text
                  fontWeight={"bold"}
                  fontSize={"14px"}
                  letterSpacing={"3.1px"}
                >
                  AVAILABLE
                </Text>
                <Text mt={"10px"} fontWeight={"400"} fontSize={"14px"}>
                  {tokenBalance?.formatted} {tokenBalance?.symbol}
                </Text>
                <Text mt={"5px"} fontSize={"12px"} opacity={"0.5"}>
                  {Number(tokenBalance?.formatted) * rates?.beam?.usd} USD
                </Text>
              </VStack>
              <HStack ml={"auto"} cursor={"pointer"} onClick={handleAddMaxClick}>
                <IconSendPink width={"20px"} height={"15px"}/>
                <Text color={"#DA68F5"} fontWeight={"bold"} fontSize={"14px"} letterSpacing={"3.1px"}>max</Text>
              </HStack>
            </HStack>
            
            <Divider borderColor={"rgba(255, 255, 255, 0.1)"} margin={"20px 0"}/>

            <FeeContainer>
              <div className='fee-item'>
                <FormSubtitle className={FeeSubtitleClass}>RELAYER FEE</FormSubtitle>
                { relayerFeeVal && <>
                  <div className='fee-value'>
                    {relayerFeeVal.toFixed(12).replace(/\.?0+$/,"")} {selectedCurrency.name == "BEAM" ? "WBEAM" : selectedCurrency.name}
                  </div>
                  <Rate value={relayerFeeVal}
                    selectedCurrencyId={selectedCurrency.rate_id}
                    className={RateStyleClass}
                  />
                </>}
              </div>
              <div className='fee-item'>
                <FormSubtitle className={!isNetworkFeeAvailable ? FeeSubtitleWarningClass : FeeSubtitleClass}>
                  EXPECTED ETHEREUM NETWORK FEE
                </FormSubtitle>
                {isNetworkFeeAvailable && ethFeeVal && ethFeeVal > 0 && (
                  <Box>
                    <div className='fee-value'>{ethFeeVal.toFixed(12).replace(/\.?0+$/,"")} ETH</div>
                    <Rate value={ethFeeVal}
                      selectedCurrencyId={ETH_RATE_ID}
                      className={RateStyleClass} />
                  </Box>
                )}
                {!isNetworkFeeAvailable && (
                  <div className='fee-warning'>Insufficient funds to calculate.</div>
                )}
              </div>
            </FeeContainer>

            <Button
              className={TransferButtonClass}
              type="submit"
              disabled={isFormDisabled()}
              pallete='purple' icon={IconSend}
            >
              transfer
            </Button>
          </>
          ) : (selectedCurrency && (
            <Box>
              {/* {ICONS[selectedCurrency.name.toLowerCase()]()} */}
              <div className='approve-msg'>
                {`To send funds to BEAM please approve W${selectedCurrency?.name} token first`}
              </div>
              <Button className={ApproveButtonClass}
                disabled={isApproveInProgress}
                onClick={()=>handleApproveTokenClick(selectedCurrency?.id)}
                color="send"
                pallete='green' icon={IconCheck}>
                  approve token
              </Button>
            </Box>
          ))
        }
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
