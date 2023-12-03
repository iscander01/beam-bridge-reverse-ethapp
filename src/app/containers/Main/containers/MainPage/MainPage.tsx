import React, { useEffect, useState } from 'react';
import { styled } from '@linaria/react';
import { css } from '@linaria/core';

import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Window, Button, Table, BalanceCard } from '@app/shared/components';
import { selectBalance, selectIsTrInProgress } from '../../store/selectors';
import { IconSend, IconReceive } from '@app/shared/icons';
import { CURRENCIES, ROUTES } from '@app/shared/constants';
import { selectSystemState, selectTransactions } from '@app/shared/store/selectors';
import { IconDeposit, IconConfirm } from '@app/shared/icons';
import { formatActiveAddressString } from '@core/appUtils';

const Content = styled.div`
  width: 600px;
  margin: 50px auto 0 auto;
  padding: 45px 75px;
  border-radius: 10px;
  backdrop-filter: blur(10px);
  background-color: rgba(13, 77, 118, .4);
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const ContentHeader = styled.p`
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 40px;
`;

const StyledControls = styled.div`
  margin-top: 50px;
  display: flex;
  flex-direction: row;
`;

const StyledTable = styled.div`
  margin-top: 30px;
  overflow: hidden;
  border-radius: 10px;
`;

const ReceiveButtonClass = css`
  margin-left: 20px !important;
`;

const EmptyTableContent = styled.div`
  text-align: center;
  margin-top: 72px;
  font-size: 14px;
  font-style: italic;
  color: #8da1ad;
`;

const Completed = styled.div`
  display: flex;

  > .icon-deposit {
    margin-left: 2px;
    margin-right: 12px;
  }

  > .icon-receive {
    margin-right: 10px;
  }

  > .text-receive {
    color: #0BCCF7;
  }

  > .text-deposit {
    color: #DA68F5;
  }
`;

const HashLink = styled.a`
  text-decoration: none;
  color: #00f6d2;
`;

const MainPage: React.FC = () => {
  const navigate = useNavigate();
  const bridgeTransactions = useSelector(selectTransactions());
  const systemState = useSelector(selectSystemState());
  const isTrInProgress = useSelector(selectIsTrInProgress());
  const [tableData, setTableData] = useState([]);

  useEffect(() => {
    if (bridgeTransactions.length > 0) {
      const data = bridgeTransactions.map((tr) => {
        const item = { ...tr };
        item['isIncome'] = systemState.account === tr.to;
        return item;
      });
      setTableData(data);
    }
  }, [bridgeTransactions]);

  const balance = useSelector(selectBalance());

  const getDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    const yearString = date.toLocaleDateString(undefined, { year: 'numeric' });
    const monthString = date.toLocaleDateString(undefined, { month: 'numeric' });
    const dayString = date.toLocaleDateString(undefined, { day: 'numeric' });
    const time = date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    return `${dayString}.${monthString.length == 1 ? '0' + monthString.slice(-2) : monthString}.${yearString} ${time}`;
  };

  const TABLE_CONFIG = [
    {
      name: 'value',
      title: 'Amount',
      fn: (value: string, tr: any) => {
        const curr = CURRENCIES.find((item) => { 
          return item.ethTokenContract.toLowerCase() === tr.contractAddress.toLowerCase()
        });
        if (curr) {
          const amount = ((parseInt(tr.value) / Math.pow(10, curr.decimals)).toFixed(curr.validator_dec)).replace(/\.?0+$/,"");
        return `${amount} ${curr.name}`;
        }
      }
    },
    {
      name: 'timeStamp',
      title: 'Date',
      fn: (value: string, tr: any) => {
        const date = getDate(tr.timeStamp);
        return date;

      }
    },
    {
      name: 'isIncome',
      title: 'Status',
      fn: (value: string, tr: any) => {
        return (<Completed>
          { 
            tr.isIncome ? 
            <IconConfirm className='icon-receive'/> : 
            <IconDeposit className='icon-deposit'/> 
          } 
          { 
            <span className={ tr.isIncome ? 'text-receive' : 'text-deposit' }>
              completed
            </span>
          }
        </Completed>);
      }
    },
    {
      name: 'hash',
      title: 'Hash',
      fn: (value: string, tr: any) => {
        return (<HashLink href={'https://goerli.etherscan.io/tx/' + tr.hash} target='_blank'>
          {formatActiveAddressString(tr.hash)
        }</HashLink>)
      }
    }
  ];

  const handleSendClick: React.MouseEventHandler = () => {
    navigate(ROUTES.MAIN.SEND);
  };
  
  const handleReceiveClick: React.MouseEventHandler = () => {
    navigate(ROUTES.MAIN.RECEIVE);
  };

  return (
    <>
      <Window>
        <StyledControls>
          <Button icon={IconSend}
            disabled={isTrInProgress || systemState.isCorrectNetwork === false}
            pallete="purple"
            onClick={handleSendClick}>
              ethereum to beam
          </Button>
          <Button icon={IconReceive} 
            className={ReceiveButtonClass} 
            disabled={systemState.isCorrectNetwork === false}
            pallete="blue" 
            onClick={handleReceiveClick}>
              beam to ethereum
          </Button>
        </StyledControls>
        <Content>
          <ContentHeader>Balance</ContentHeader>
          { balance.map(({ curr_id, rate_id, value, icon, is_approved }) => (
            <BalanceCard icon={icon} 
              curr_id={curr_id}
              key={curr_id}
              rate_id={rate_id}
              type={icon}
              balanceValue={value}
              is_approved={is_approved}
            ></BalanceCard>
          ))}
        </Content>
        <StyledTable>
          <Table config={TABLE_CONFIG} data={tableData} keyBy='transactionIndex'/>
          {tableData.length === 0 && <EmptyTableContent>There are no transactions yet</EmptyTableContent>}
        </StyledTable>
      </Window>
    </>
  );
};

export default MainPage;
