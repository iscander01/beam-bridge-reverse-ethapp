import React, { useEffect, useState } from "react";
import { Button, Text } from "@chakra-ui/react";
import { useDisclosure } from "@chakra-ui/react";
import { useAccount } from 'wagmi';
import { formatActiveAddressString } from '@core/appUtils';
import { useAddress } from '../hooks';
import AccountModal from './AccountModal';

const AccountButton: React.FC = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { fullAddress } = useAddress();
  const [formattedAddress, setFormattedAddress] = useState<string>("");

  useEffect(() => {
    if (fullAddress) {
      setFormattedAddress(formatActiveAddressString(fullAddress));
    }
  }, [fullAddress]);

  return (
    <>
      <Button
        onClick={onOpen}
        borderRadius={"22px"}
        border={"solid 1px #fff"}
        bgColor={"rgba(255, 255, 255, 0.1)"}
        color={"#fff"}
      >
        {formattedAddress}
      </Button>

      <AccountModal isOpen={isOpen} onClose={onClose} />
    </>
  );
};

export default AccountButton;

