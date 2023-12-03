import React from 'react';
import { styled } from '@linaria/react';
import { Button } from '.';
import { IconUsdt, IconWbtc, IconDai, IconEth, IconBeam } from '@app/shared/icons';
import MetaMaskController from '@core/MetaMask';
import { ethId } from '@app/shared/constants';
import { useSelector } from 'react-redux';
import { selectIsApproveInProgress } from '@app/containers/Main/store/selectors';

const metaMaskController = MetaMaskController.getInstance();

interface CardProps {
  balanceValue?: number,
  type?: string,
  rate_id: string,
  curr_id: number,
  icon: string,
  is_approved: boolean
}
const CardStyled = styled.div<CardProps>`
  width: 275px;
  height: 66px;
  margin-top: 10px
  padding: 20px;
  border-radius: 10px;
  background-image: linear-gradient(102deg, 
    ${({ type }) => `var(--color-${type.toLowerCase()}-from)`} 2%, rgb(0, 69, 143, .3) 98%);
  display: flex;
  flex-direction: row;
  align-items: center;
`;

const BalanceValue = styled.div`
  font-size: 16px;
  margin-left: 10px;
`;

const StyledApproveButton = styled.span`
  margin-left: auto;
`;

const ICONS = {
  beam: () => (<IconBeam/>),
  usdt: () => (<IconUsdt/>),
  wbtc: () => (<IconWbtc/>),
  dai: () => (<IconDai/>),
  eth: () => (<IconEth/>),
};

const TokenCard: React.FC<CardProps> = ({
  children,
  type,
  is_approved,
  curr_id,
  icon,
  ...rest
}) => {
  const currency = type.toUpperCase();
  const isApproveInProgress = useSelector(selectIsApproveInProgress());
  const revokeTokenClicked = (id: number) => {
    metaMaskController.revokeToken(id);
  }

  return (
    <CardStyled is_approved={is_approved} icon={icon} curr_id={curr_id} type={type} {...rest}>
      { ICONS[icon]() }
      <BalanceValue>{currency}</BalanceValue>
      {is_approved && curr_id !== ethId ? (
      <StyledApproveButton>
        <Button 
          variant='revoke'
          disabled={isApproveInProgress}
          onClick={()=>revokeTokenClicked(curr_id)}>
            revoke
        </Button>
      </StyledApproveButton>
      ) : <></>}
    </CardStyled>
  )
};

export default TokenCard;
