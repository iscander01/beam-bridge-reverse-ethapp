import React, { useEffect, useMemo } from 'react';

import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Window, TokenCard, Table } from '@app/shared/components';
import { selectIsTrInProgress } from '../../store/selectors';
import { IconSend, IconReceive, IconEth, IconBeam } from '@app/shared/icons';
import { CURRENCIES, CURRENCY_IDS, NETWORK_EXPLORER, ROUTES } from '@app/shared/constants';
import { selectTransactions } from '@app/shared/store/selectors';
import { IconDeposit, IconConfirm } from '@app/shared/icons';
import { formatActiveAddressString } from '@core/appUtils';
import { Box, Flex, Text, Button } from '@chakra-ui/react';
import { useAccount } from 'wagmi';
import { useTokenBalanceAndAllowance } from '@app/shared/hooks';
import { loadTransactions } from '@app/shared/store/actions';
import { Transaction } from '@app/shared/interface';

const getDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    const yearString = date.toLocaleDateString(undefined, { year: 'numeric' });
    const monthString = date.toLocaleDateString(undefined, { month: 'numeric' });
    const dayString = date.toLocaleDateString(undefined, { day: 'numeric' });
    const time = date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    return `${dayString}.${monthString.length == 1 ? '0' + monthString.slice(-2) : monthString}.${yearString} ${time}`;
};

const createTableConfig = (activeChain: ReturnType<typeof useAccount>['chain']) => {
  return [
    {
      name: 'value',
      title: 'Amount',
      fn: (_value: string, tr: Transaction & { isIncome?: boolean }) => {
        if (!activeChain) return null;
        const currency = CURRENCIES[activeChain.id][CURRENCY_IDS.BEAM];
        const raw = Number(tr.value);
        if (Number.isNaN(raw)) return null;
        const amount = ((raw / Math.pow(10, currency.decimals)).toFixed(currency.validator_dec)).replace(/\.?0+$/,'');
        return `${amount} ${currency.name}`;
      }
    },
    {
      name: 'timeStamp',
      title: 'Date',
      fn: (_value: string, tr: Transaction) => getDate(Number(tr.timeStamp)),
    },
    {
      name: 'isIncome',
      title: 'Status',
      fn: (_value: string, tr: Transaction & { isIncome?: boolean }) => (
        <Flex align="center">
          {tr.isIncome ? (
            <IconConfirm className="icon-receive" style={{ marginRight: 10 }} />
          ) : (
            <IconDeposit className="icon-deposit" style={{ marginLeft: 2, marginRight: 12 }} />
          )}
          <Text
            as="span"
            fontSize="14px"
            fontWeight="500"
            color={tr.isIncome ? '#0BCCF7' : '#DA68F5'}
          >
            completed
          </Text>
        </Flex>
      ),
    },
    {
      name: 'hash',
      title: 'Hash',
      fn: (_value: string, tr: Transaction) => {
        if (!activeChain) return null;
        return (
          <Text
            as="a"
            href={NETWORK_EXPLORER[activeChain.id] + tr.hash}
            target="_blank"
            rel="noreferrer"
            textDecoration="none"
            color="#00f6d2"
          >
            {formatActiveAddressString(tr.hash)}
          </Text>
        );
      },
    },
  ];
};

const MainPage: React.FC = () => {
  const navigate = useNavigate();
  const bridgeTransactions = useSelector(selectTransactions());
  const isTrInProgress = useSelector(selectIsTrInProgress());
  const dispatch = useDispatch();
  const { address, chain: activeChain } = useAccount();

  const { tokenBalance, ethBalance, allowance } = useTokenBalanceAndAllowance({
    address: address as `0x${string}`,
    activeChainId: activeChain?.id as number,
  });

  useEffect(() => {
    if (address && activeChain) {
      dispatch(loadTransactions.request({
        address,
        chain: activeChain.id,
      }));
    }
  }, [address, activeChain, dispatch]);

  const tableData = useMemo<Transaction[]>(() => {
    if (!bridgeTransactions.length) return [];
    return bridgeTransactions.map((tr) => ({
      ...tr,
      isIncome: address ? address.toLowerCase() === tr.to.toLowerCase() : false,
    }));
  }, [bridgeTransactions, address]);

  const tableConfig = useMemo(
    () => createTableConfig(activeChain),
    [activeChain],
  );

  const handleSendClick: React.MouseEventHandler = () => {
    navigate(ROUTES.MAIN.SEND);
  };
  
  const handleReceiveClick: React.MouseEventHandler = () => {
    navigate(ROUTES.MAIN.RECEIVE);
  };

  return (
    <>
      <Window>
        <Flex direction="row">
          <Button //icon={IconSend}
            disabled={isTrInProgress}
            backgroundColor={"#da68f5"}
            borderRadius={"22px"}
            fontWeight={"bold"}
            padding={"0 30px"}
            onClick={handleSendClick}>
              <IconSend />
              <Text ml={"10px"}>
                WBEAM ({activeChain?.name}) ={'>'} BEAM
              </Text>
          </Button>
          <Button
            backgroundColor={"#0bccf7"}
            borderRadius={"22px"}
            fontWeight={"bold"}
            padding={"0 30px"}
            ml={"20px"}
            onClick={handleReceiveClick}>
              <IconReceive />
              <Text ml={"10px"}>
                BEAM ={'>'} WBEAM ({activeChain?.name})
              </Text>
          </Button>
        </Flex>
        <Box
          width="600px"
          mt="50px"
          mx="auto"
          px="75px"
          py="45px"
          borderRadius="10px"
          backdropFilter="blur(10px)"
          backgroundColor="rgba(13, 77, 118, 0.4)"
          display="flex"
          flexDirection="column"
          alignItems="center"
        >
          <Text fontSize="24px" fontWeight="bold" mb="40px">
            Balance
          </Text>
          <TokenCard
            isApproved={true}
            isToken={false}
            title={"eth"}
            icon={IconEth}
            balance={ethBalance?.value}
            decimals={ethBalance?.decimals}
          />

          <TokenCard 
            isApproved={!!allowance}
            isToken={true}
            title={"beam"}
            icon={IconBeam}
            balance={tokenBalance?.value}
            decimals={tokenBalance?.decimals}
          />
        </Box>
        {tableData.length > 0 ? (
          <Box mt="30px" overflow="hidden" borderRadius="10px">
            <Table config={tableConfig} data={tableData} keyBy='transactionIndex' />
          </Box>
        ) : (
          <></>
        )}
      </Window>
    </>
  );
};

export default MainPage;
