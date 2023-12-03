import React from 'react';
import { styled } from '@linaria/react';
import { Button, Window } from '@app/shared/components';
import { ROUTES } from '@app/shared/constants';
import { IconCopyBlue, IconBack } from '@app/shared/icons';
import { useSelector } from 'react-redux';
import { selectSystemState } from '@app/shared/store/selectors';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const ControlStyled = styled.div`
  width: 600px;
  margin: 20px auto;
  flex-direction: row;
  display: flex;
`;

const BackControl = styled.div`
  cursor: pointer;
  display: flex;
  flex-direction: row;
`;

const BackControlText = styled.p`
  opacity: .3;
  margin-left: 15px;
  font-size: 14px;
  font-weight: bold;
`;

const FormStyled = styled.div`
  width: 600px;
  border-radius: 10px;
  background-image: linear-gradient(to bottom, rgba(11, 204, 247, 0.5), rgba(11, 204, 247, 0)), linear-gradient(to bottom, #0d4d76, #0d4d76);
  padding: 50px 30px;
  display: flex;
  flex-direction: column;
`;

const FormTitle = styled.p`
  font-size: 24px;
  font-weight: bold;
  align-self: center;
`;

const ReceiveStyled = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 50px;
`;

const AddressTitle = styled.div`
  margin: 50px auto 0;
  opacity: .7;
  font-style: italic;
`;

const Address = styled.div`
  margin: 20px auto 0;
  line-height: 1.43;
`;

const InfoContainer = styled.div`
  margin-top: 20px;
  width: 600px;
  padding: 50px
  border-radius: 10px;
  backdrop-filter: blur(10px);
  background-color: rgba(13, 77, 118, .95);
`;

const InfoContainerTitle = styled.div`
  font-size: 14px;
  font-style: italic;
  opacity: 0.7;
  margin-bottom: 20px;
`;

const InfoListItem = styled.li`
  line-height: 1.57;
  font-size: 14px;
  font-style: italic;
  color: rgba(255, 255, 255, .7)
`;

const StyledLink = styled.span`
  cursor: pointer;
  font-weight: bold;
  color: #05e2c2;
`;

const StyledLine = styled.span`
  color: #ffffff;
  font-weight: bold;
`;

const Receive = () => {
  const systemState = useSelector(selectSystemState());
  const navigate = useNavigate();
  
  const handleCopyClick: React.MouseEventHandler = () => {
    navigator.clipboard.writeText(systemState.account);
    toast('Address copied to clipboard');
    navigate(ROUTES.MAIN.BASE);
  };

  const handleBackClick: React.MouseEventHandler = () => {
    navigate(ROUTES.MAIN.BASE);
  };

  const handleDownloadClick: React.MouseEventHandler = () => {
    window.open('https://beam.mw/downloads', '_blank').focus();
  }

  return (
    <Window>
      <ControlStyled>
        <BackControl onClick={handleBackClick}>
          <IconBack/>
          <BackControlText>
            back
          </BackControlText>
        </BackControl>
      </ControlStyled>
      <FormStyled>
        <FormTitle>Beam to Ethereum</FormTitle>
        <AddressTitle>Your Ethereum Bridge address:</AddressTitle>
        <Address>{systemState.account}</Address>
        <ReceiveStyled>
          <Button onClick={handleCopyClick}
          pallete='blue'
          icon={IconCopyBlue}
          color="send">copy and close</Button>
        </ReceiveStyled>
      </FormStyled>
      <InfoContainer>
        <InfoContainerTitle>In order to transfer from Beam to Ethereum network, do the following:</InfoContainerTitle>
        <ul>
          <InfoListItem>
            1.	Download the latest verison of <StyledLink onClick={handleDownloadClick}>Beam Wallet</StyledLink> 
          </InfoListItem>
          <InfoListItem>2.	Launch Bridges DApp from DApp store</InfoListItem>
          <InfoListItem>3.	Select <StyledLine>Beam to Ethereum</StyledLine> and choose currency</InfoListItem>
          <InfoListItem>4.	Paste this address to Ethereum Bridge Address field</InfoListItem>
        </ul>
      </InfoContainer>
    </Window>
  );
};

export default Receive;
