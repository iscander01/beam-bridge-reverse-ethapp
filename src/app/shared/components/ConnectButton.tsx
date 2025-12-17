import React from "react";
import { Button } from "@chakra-ui/react";
import { useDisclosure } from "@chakra-ui/react";
import ConnectModal from "./ConnectModal";

const ConnectButton: React.FC = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <>
      <Button onClick={onOpen}>
        Connect wallet
      </Button>

      <ConnectModal isOpen={isOpen} onClose={onClose} />
    </>
  );
};

export default ConnectButton;

