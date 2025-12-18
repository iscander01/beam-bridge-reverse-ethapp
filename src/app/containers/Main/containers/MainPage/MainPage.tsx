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

const ArrowRightIcon: React.FC = () => (
  <Box
    as="span"
    display="inline-flex"
    alignItems="center"
    justifyContent="center"
    w="18px"
    h="18px"
  >
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M4 9H14M9 4L14 9L9 14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </Box>
);

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
        <Flex
          direction="row"
          justify="center"
          mt="24px"
          gap="16px"
        >
          <Button
            disabled={isTrInProgress}
            bgGradient="linear(to-r, #da68f5, #f29cfe)"
            borderRadius="999px"
            fontWeight="700"
            px="28px"
            py="18px"
            color="white"
            boxShadow="0 0 5px rgba(218, 104, 245, 0.35)"
            _hover={{
              bgGradient: "linear(to-r, #e472ff, #f8b4ff)",
              transform: "translateY(-1px)",
              boxShadow: "0 10px 24px rgba(218, 104, 245, 0.45)",
            }}
            _active={{
              transform: "translateY(0)",
              boxShadow: "0 4px 12px rgba(218, 104, 245, 0.35)",
            }}
            onClick={handleSendClick}
          >
            <IconSend />
            <Flex ml="10px" align="center" gap="6px">
              <Text>WBEAM ({activeChain?.name})</Text>
              <ArrowRightIcon />
              <Text>BEAM</Text>
            </Flex>
          </Button>
          <Button
            bgGradient="linear(to-r, #0bccf7, #52e0ff)"
            borderRadius="999px"
            fontWeight="700"
            px="28px"
            py="18px"
            color="white"
            boxShadow="0 0 5px rgba(11, 204, 247, 0.35)"
            _hover={{
              bgGradient: "linear(to-r, #1fd6ff, #7be8ff)",
              transform: "translateY(-1px)",
              boxShadow: "0 10px 24px rgba(11, 204, 247, 0.45)",
            }}
            _active={{
              transform: "translateY(0)",
              boxShadow: "0 4px 12px rgba(11, 204, 247, 0.35)",
            }}
            onClick={handleReceiveClick}
          >
            <IconReceive />
            <Flex ml="10px" align="center" gap="6px">
              <Text>BEAM</Text>
              <ArrowRightIcon />
              <Text>WBEAM ({activeChain?.name})</Text>
            </Flex>
          </Button>
        </Flex>
        <Box
          width="100%"
          maxW="640px"
          mt="40px"
          mx="auto"
          px="40px"
          py="32px"
          borderRadius="16px"
          backdropFilter="blur(16px)"
          backgroundColor="rgba(6, 35, 58, 0.8)"
          boxShadow="0 24px 80px rgba(0, 0, 0, 0.65)"
        >
          <Text fontSize="20px" fontWeight="700" mb="8px">
            Wallet balance
          </Text>
          <Text fontSize="13px" color="rgba(255, 255, 255, 0.7)" mb="24px">
            Overview of your available assets on the connected Ethereum network.
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
          <Box
            width="100%"
            maxW="860px"
            mt="40px"
            mx="auto"
            px="32px"
            py="24px"
            borderRadius="16px"
            backdropFilter="blur(14px)"
            backgroundColor="rgba(4, 26, 44, 0.9)"
            boxShadow="0 24px 80px rgba(0, 0, 0, 0.65)"
          >
            <Text fontSize="18px" fontWeight="700" mb="16px">
              Recent activity
            </Text>
            <Box overflow="hidden" borderRadius="10px">
              <Table config={tableConfig} data={tableData} keyBy='transactionIndex' />
            </Box>
          </Box>
        ) : (
          <></>
        )}
      </Window>
    </>
  );
};

export default MainPage;
