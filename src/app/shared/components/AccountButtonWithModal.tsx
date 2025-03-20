import React, { useEffect, useState } from 'react';
import { formatActiveAddressString } from '@core/appUtils';
import { 
  Button,
  Flex,
  HStack,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  useDisclosure,
  VStack,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
} from '@chakra-ui/react';
import { useAccount, useDisconnect, useSwitchChain } from 'wagmi';
import { toast } from 'react-toastify';
import { ChevronDownIcon } from '@chakra-ui/icons';

import { IconBeam, IconCopyWhite, IconEth, IconLogout } from '../icons';
import { useAddress, useTokenBalanceAndAllowance } from '../hooks';
import TokenCard from './TokenCard';
import { NETWORKS_BY_ID } from '../constants';

const AccountButtonWithModal: React.FC = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { chains, switchChain } = useSwitchChain();
  const { address, chain: activeChain, connector } = useAccount();
  const { disconnect } = useDisconnect();
  const { fullAddress } = useAddress();

  const [ formattedAddress, setFormattedAddress ] = useState<string>("");
  const [selectedNetwork, setSelectedNetwork] = useState(activeChain?.id);

  const { allowance } = useTokenBalanceAndAllowance({
    address: address as `0x${string}`,
    activeChainId: activeChain?.id as number,
  });

  useEffect(() => {
    if (fullAddress) {
      setFormattedAddress(formatActiveAddressString(fullAddress));
    }
  }, [fullAddress]);

  const handleCopyClick = () => {
    navigator.clipboard.writeText(fullAddress || "");
    toast('Address copied to clipboard');
  };
  
  return (
    <>
      <Button
        onClick={onOpen}
        borderRadius={"22px"}
        border={"solid 1px #fff"}
        bgColor={"rgba(255, 255, 255, 0.1)"}
        color={"#fff"}
      >
        { formattedAddress }
      </Button>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent bgColor={"rgba(13, 77, 118)"}>
          <ModalHeader fontSize={"16px"} textAlign={"center"}>
            {connector?.name} wallet
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody paddingBottom={"20px"}>
            <VStack alignItems={"start"}>
              <Text fontSize={"14px"} fontWeight={"bold"} letterSpacing={"2.6px"}>
                BRIDGE ADDRESS
              </Text>
              <HStack >
                <Text fontSize={"14px"}>
                  {fullAddress}
                </Text>
                <IconCopyWhite onClick={handleCopyClick} cursor={"pointer"} width={"15px"} height={"15px"}/>
              </HStack>

              <Text fontSize={"14px"} fontWeight={"bold"} letterSpacing={"2.6px"}>
                NETWORK
              </Text>

              <Menu>
                <MenuButton
                  as={Button}
                  rightIcon={<ChevronDownIcon />}
                  bg="transparent"
                  border={"1px solid #fff"}
                  color={"#fff"}
                  _hover={{
                    bg: "transparent"
                  }}
                  _active={{
                    bg: "transparent"
                  }}
                >
                  {NETWORKS_BY_ID[selectedNetwork].name}
                </MenuButton>
                <MenuList bg="rgba(13, 77, 118)" border="1px solid #fff" borderRadius="md">
                  {chains.map((chain) => (
                    <MenuItem
                      _hover={{ bg: "teal.100" }}
                      bg={"transparent"}
                      key={chain.id}
                      onClick={(e) => {
                        setSelectedNetwork(chain.id);
                        switchChain?.({ chainId: chain.id });
                      }}
                    >
                      {chain.name}
                    </MenuItem>
                  ))}
                </MenuList>
              </Menu>

              <Text fontSize={"14px"} fontWeight={"bold"} letterSpacing={"2.6px"}>
                SUPPORTED TOKENS
              </Text>

              <Flex direction={"column"}>
                <TokenCard 
                  isApproved={true}
                  isToken={false}
                  title={"eth"}
                  icon={IconEth}
                />

                <TokenCard 
                  isApproved={!!allowance}
                  isToken={true}
                  title={"beam"}
                  icon={IconBeam}
                />
              </Flex>
            </VStack>
          </ModalBody>
          <ModalFooter justifyContent={"center"}>
            <Button onClick={() => disconnect()}
              bgColor={"#ff746b"}
              borderRadius={"22px"}
              padding={"0 25px"}
            >
              <IconLogout />
              <Text ml={"10px"}>
                disconnect wallet
              </Text>
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
)};

export default AccountButtonWithModal;
