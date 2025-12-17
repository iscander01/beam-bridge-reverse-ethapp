import React from "react";
import {
  Button,
  VStack,
  Img,
  Text,
} from "@chakra-ui/react";
import { useConnect } from 'wagmi';
import { IconMetamask } from '../icons';
import AppModal from "./AppModal";

interface ConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ConnectModal: React.FC<ConnectModalProps> = ({ isOpen, onClose }) => {
  const { connectors, connect, isPending } = useConnect();

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      title="Connect a wallet"
      bodyProps={{ paddingBottom: "20px" }}
      contentProps={{ maxW: "420px" }}
    >
      <VStack>
        {connectors.map((connector) => (
          <Button
            key={connector.uid}
            onClick={() => {
              connect({ connector });
              onClose();
            }}
            width={"200px"}
            isDisabled={isPending}
          >
            {connector.name === "MetaMask" ? (
              <IconMetamask width={"34px"} height={"34px"} />
            ) : null}
            {connector.icon ? <Img src={connector.icon} width={"34px"} height={"34px"} /> : null}
            <Text ml={"5px"}>{connector.name}</Text>
          </Button>
        ))}
      </VStack>
    </AppModal>
  );
};

export default ConnectModal;

