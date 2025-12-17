import React, { useEffect, useMemo, useState } from "react";
import {
  Button,
  Box,
  HStack,
  Text,
  VStack,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Divider,
  Badge,
  useClipboard,
  Tooltip,
} from "@chakra-ui/react";
import { useAccount, useDisconnect, useSwitchChain } from 'wagmi';
import { toast } from 'react-toastify';
import { ChevronDownIcon, CheckIcon } from '@chakra-ui/icons';

import { IconBeam, IconCopyWhite, IconEth, IconLogout } from '../icons';
import { useAddress, useTokenBalanceAndAllowance } from '../hooks';
import TokenCard from './TokenCard';
import { NETWORKS_BY_ID } from '../constants';
import AppModal from "./AppModal";

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AccountModal: React.FC<AccountModalProps> = ({ isOpen, onClose }) => {
  const { chains, switchChain } = useSwitchChain();
  const { address, chain: activeChain, connector } = useAccount();
  const { disconnect } = useDisconnect();
  const { fullAddress } = useAddress();
  const { onCopy, hasCopied } = useClipboard(fullAddress || "");

  const [selectedNetwork, setSelectedNetwork] = useState<number | undefined>(activeChain?.id);

  const { allowance } = useTokenBalanceAndAllowance({
    address: address as `0x${string}`,
    activeChainId: activeChain?.id as number,
  });

  useEffect(() => {
    setSelectedNetwork(activeChain?.id);
  }, [activeChain?.id]);

  const selectedNetworkName = useMemo(() => {
    if (!selectedNetwork) return "Select network";
    return NETWORKS_BY_ID[selectedNetwork]?.name ?? "Unknown network";
  }, [selectedNetwork]);

  const handleCopyClick = () => {
    onCopy();
    toast('Address copied to clipboard', { type: 'success' });
  };

  const handleDisconnectClick = () => {
    disconnect();
    onClose();
  };

  const formattedAddress = fullAddress
    ? `${fullAddress.slice(0, 6)}...${fullAddress.slice(-4)}`
    : "";

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <VStack spacing={1}>
          <Text fontSize={"18px"} fontWeight={"700"} textAlign={"center"}>
            {connector?.name || "Wallet"} Account
          </Text>
        </VStack>
      }
      bodyProps={{ paddingBottom: "24px", paddingTop: "20px" }}
      contentProps={{ maxW: "520px" }}
      footer={
        <Button
          onClick={handleDisconnectClick}
          bgColor={"#ff746b"}
          color={"white"}
          borderRadius={"12px"}
          padding={"12px 32px"}
          fontWeight={"600"}
          fontSize={"14px"}
          _hover={{
            bgColor: "#ff5a4d",
            transform: "translateY(-1px)",
            boxShadow: "0 4px 12px rgba(255, 116, 107, 0.3)",
          }}
          transition="all 0.2s"
          leftIcon={<IconLogout />}
        >
          Disconnect Wallet
        </Button>
      }
    >
      <VStack spacing={6} alignItems={"stretch"} width="100%">
        {/* Bridge Address & Network Section - Combined */}
        <Box>
          <Text
            fontSize={"11px"}
            fontWeight={"700"}
            letterSpacing={"2px"}
            textTransform={"uppercase"}
            color={"rgba(255, 255, 255, 0.6)"}
            mb={3}
          >
            Bridge Address & Network
          </Text>
          <HStack spacing={3} align="stretch" height="48px">
            {/* Bridge Address */}
            <Box
              flex={1}
              bg="rgba(255, 255, 255, 0.05)"
              borderRadius="12px"
              border="1px solid rgba(255, 255, 255, 0.1)"
              _hover={{
                borderColor: "rgba(255, 255, 255, 0.2)",
                bg: "rgba(255, 255, 255, 0.08)",
              }}
              transition="all 0.2s"
              display="flex"
              alignItems="center"
              px={4}
              height="100%"
            >
              <HStack justify="space-between" align="center" spacing={2} width="100%">
                <Text
                  fontSize={"14px"}
                  fontFamily="mono"
                  color={"white"}
                  fontWeight={"500"}
                  noOfLines={1}
                  flex={1}
                >
                  {formattedAddress}
                </Text>
                <Tooltip label={hasCopied ? "Copied!" : "Copy address"} placement="top">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleCopyClick}
                    minW="auto"
                    h="auto"
                    p={1.5}
                    borderRadius="6px"
                    flexShrink={0}
                    _hover={{
                      bg: "rgba(255, 255, 255, 0.1)",
                    }}
                  >
                    {hasCopied ? (
                      <CheckIcon color="green.400" w={3.5} h={3.5} />
                    ) : (
                      <IconCopyWhite width="14px" height="14px" />
                    )}
                  </Button>
                </Tooltip>
              </HStack>
            </Box>

            {/* Network Selector - Reimplemented */}
            <Box flex={1} position="relative" height="100%">
              <Menu placement="bottom-end">
                <MenuButton
                  as={Button}
                  rightIcon={<ChevronDownIcon />}
                  width="100%"
                  height="100%"
                  justifyContent="space-between"
                  bg="rgba(255, 255, 255, 0.05)"
                  border="1px solid rgba(255, 255, 255, 0.1)"
                  color="white"
                  borderRadius="12px"
                  px={4}
                  fontWeight="500"
                  fontSize="14px"
                  _hover={{
                    bg: "rgba(255, 255, 255, 0.08)",
                    borderColor: "rgba(255, 255, 255, 0.2)",
                  }}
                  _active={{
                    bg: "rgba(255, 255, 255, 0.1)",
                  }}
                  _expanded={{
                    bg: "rgba(255, 255, 255, 0.1)",
                    borderColor: "rgba(255, 255, 255, 0.3)",
                  }}
                  transition="all 0.2s"
                >
                  <Text noOfLines={1} textAlign="left" flex={1}>
                    {selectedNetworkName}
                  </Text>
                </MenuButton>
                <MenuList
                  bg="rgba(13, 77, 118, 0.98)"
                  border="1px solid rgba(255, 255, 255, 0.2)"
                  borderRadius="12px"
                  backdropFilter="blur(10px)"
                  boxShadow="0 8px 32px rgba(0, 0, 0, 0.4)"
                  padding={0}
                  minW="280px"
                  maxH="320px"
                  overflowY="auto"
                  overflowX="hidden"
                  sx={{
                    "&::-webkit-scrollbar": {
                      width: "8px",
                    },
                    "&::-webkit-scrollbar-track": {
                      background: "rgba(255, 255, 255, 0.05)",
                      borderRadius: "10px",
                      margin: "4px 0",
                    },
                    "&::-webkit-scrollbar-thumb": {
                      background: "rgba(255, 255, 255, 0.2)",
                      borderRadius: "10px",
                      "&:hover": {
                        background: "rgba(255, 255, 255, 0.3)",
                      },
                    },
                    // Firefox scrollbar
                    scrollbarWidth: "thin",
                    scrollbarColor: "rgba(255, 255, 255, 0.2) rgba(255, 255, 255, 0.05)",
                  }}
                >
                  {chains.map((chain, index) => {
                    const isFirst = index === 0;
                    const isLast = index === chains.length - 1;
                    const itemRadius =
                      isFirst && isLast
                        ? "12px"
                        : isFirst
                        ? "12px 12px 0 0"
                        : isLast
                        ? "0 0 12px 12px"
                        : "0";

                    return (
                      <MenuItem
                        key={chain.id}
                        bg={chain.id === activeChain?.id ? "rgba(255, 255, 255, 0.1)" : "transparent"}
                        color="white"
                        borderRadius={itemRadius}
                        mx={1.5}
                        my={0}
                        py={2.5}
                        px={3}
                        margin={0}
                        fontSize="14px"
                        fontWeight={chain.id === activeChain?.id ? "600" : "500"}
                        _hover={{
                          bg: "rgba(255, 255, 255, 0.15)",
                        }}
                        _focus={{
                          bg: "rgba(255, 255, 255, 0.15)",
                          outline: "none",
                        }}
                        _active={{
                          bg: "rgba(255, 255, 255, 0.2)",
                        }}
                        onClick={() => {
                          setSelectedNetwork(chain.id);
                          switchChain?.({ chainId: chain.id });
                        }}
                      >
                        <HStack justify="space-between" width="100%" spacing={3}>
                          <Text noOfLines={1} flex={1}>
                            {chain.name}
                          </Text>
                          {chain.id === activeChain?.id && (
                            <Badge
                              colorScheme="green"
                              fontSize="8px"
                              px={1.5}
                              py={0.5}
                              borderRadius="4px"
                              flexShrink={0}
                              textTransform="uppercase"
                              letterSpacing="0.5px"
                            >
                              Active
                            </Badge>
                          )}
                        </HStack>
                      </MenuItem>
                    );
                  })}
                </MenuList>
              </Menu>
            </Box>
          </HStack>
        </Box>

        <Divider borderColor="rgba(255, 255, 255, 0.1)" />

        {/* Supported Tokens Section */}
        <Box>
          <Text
            fontSize={"11px"}
            fontWeight={"700"}
            letterSpacing={"2px"}
            textTransform={"uppercase"}
            color={"rgba(255, 255, 255, 0.6)"}
            mb={3}
          >
            Supported Tokens
          </Text>
          <VStack spacing={1} align="stretch">
            <TokenCard isApproved={true} isToken={false} title={"eth"} icon={IconEth} />
            <TokenCard isApproved={!!allowance} isToken={true} title={"beam"} icon={IconBeam} />
          </VStack>
        </Box>
      </VStack>
    </AppModal>
  );
};

export default AccountModal;

