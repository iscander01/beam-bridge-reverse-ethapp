import React, { useRef } from 'react';
import { styled } from '@linaria/react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { selectPopupsState } from '@app/containers/Main/store/selectors';
import { selectSystemState } from '@app/shared/store/selectors';
import { Button, AccountPopup } from './';
import { setPopupState } from '@app/containers/Main/store/actions';
import { ActiveAccount } from '@app/shared/components';

interface WindowProps {
  onPrevious?: React.MouseEventHandler | undefined;
  state?: 'content';
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  background-image: url(assets/bg.png);
  background-attachment: fixed;
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
  min-height: 100%;
  padding-bottom: 50px;

  > .wrong-network {
    height: 40px;
    background-color: #F0CF0A;
    width: 100%;
    font-size: 30px;
    font-weight: 900;
    text-align: center;
    color: #000000;
  }
`;

const Title = styled.h1`
  font-size: 56px;
  font-weight: 900;
  margin-bottom: 50px;
  margin-top: 20px;
`;

const Window: React.FC<WindowProps> = ({
  children,
  onPrevious,
  state
}) => {
  const navigate = useNavigate();
  const rootRef = useRef();
  const dispatch = useDispatch();

  const popupsState = useSelector(selectPopupsState());
  const systemState = useSelector(selectSystemState());

  const setPopupVisible = () => {
    dispatch(setPopupState({type: 'account', state: true}));
  };
  
  return (
    <Container ref={rootRef}>
      { systemState.isCorrectNetwork === false && 
        <div className='wrong-network'> Wrong network! Change network to Goerli.</div>}
      { state !== "content" ?
      <>  
        {
          systemState.account ? 
          <ActiveAccount text={systemState.account} onClick={()=>{setPopupVisible()}}></ActiveAccount> :
          <></>
        }
        <Title>Ethereum to Beam Bridge</Title>
        { children }
        <AccountPopup visible={popupsState.account} onCancel={()=>{
          dispatch(setPopupState({type: 'account', state: false}));
        }}/>
      </> : 
      <>
      { children }
      </>
      }
    </Container>
  );
};

export default Window;
