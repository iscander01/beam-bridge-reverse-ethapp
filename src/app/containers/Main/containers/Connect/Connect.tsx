import React from 'react';
import { styled } from '@linaria/react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Button, Window, InstallPopup } from '@app/shared/components';
import { IconMetamask } from '@app/shared/icons';
import { selectPopupsState } from '../../store/selectors';
import { setIsLocked, setPopupState } from '../../store/actions';
import { ROUTES } from '@app/shared/constants';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Title = styled.h1`
  margin-top: 240px
  font-size: 56px;
  font-weight: 900;
`;

const Subtitle = styled.h2`
  margin-top: 30px;
  font-size: 24px;
  text-align: center;
`;

const Connect: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const popupsState = useSelector(selectPopupsState());

  const connectToMetamask = () => {
    if (window.ethereum) {
        if (localStorage.getItem('locked')) {
          localStorage.removeItem('locked');
          dispatch(setIsLocked(false));
          navigate(ROUTES.MAIN.BASE);
        }
        window.ethereum
            .request({ method: 'eth_requestAccounts' })
            .then(accounts => console.log('success!'))
    } else {
        localStorage.setItem('wasReloaded', '1');
        window.location.reload();
    }
  }

  return (
    <>
      <Window state="content">
        <Container>
          <Title>ETH to BEAM Bridge</Title>
          <Subtitle>
            Transfer ETH and BEAM.<br/>
            More tokens coming soon!
          </Subtitle>
          <Button icon={IconMetamask}
            pallete="white"
            variant="connect"
            onClick={connectToMetamask}>
              CONNECT WALLET
            </Button>
        </Container>
        <InstallPopup visible={popupsState.install} onCancel={()=>{
          dispatch(setPopupState({type: 'install', state: false}));
        }}/>
      </Window>
    </>
  );
};

export default Connect;
