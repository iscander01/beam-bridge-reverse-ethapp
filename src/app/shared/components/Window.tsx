import React, { ReactNode, useRef } from 'react';
import { useAccount, useSwitchChain } from 'wagmi';
import { AccountButton } from '@app/shared/components';
import {
  Box,
  Flex,
  Text,
  VStack,
  HStack,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
} from '@chakra-ui/react';
import { ChevronDownIcon } from '@chakra-ui/icons';

interface WindowProps {
  onPrevious?: React.MouseEventHandler | undefined;
  state?: 'content';
  children?: ReactNode;
}

const ArrowRightIcon: React.FC = () => (
  <Box
    as="span"
    display="inline-flex"
    alignItems="center"
    justifyContent="center"
    w="18px"
    h="18px"
  >
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M4 9H14M9 4L14 9L9 14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </Box>
);

const Window: React.FC<WindowProps> = ({
  children,
  state
}) => {
  const { chain } = useAccount();
  const { chains, switchChain } = useSwitchChain();
  const rootRef = useRef<HTMLDivElement>(null);
  
  return (
    <Flex ref={rootRef}
      direction={"column"}
      alignItems={"center"}
      bgImage={"url(assets/bg.png)"}
      bgAttachment={"fixed"}
      bgPosition={"center"}
      bgRepeat={"no-repeat"}
      bgSize={"cover"}
      minH={"100%"}
      paddingBottom={"50px"}
    >
      { state !== "content" && (
        <VStack width={"100%"} justifyContent={"end"} padding={"50px 80px"}>
          <HStack ml={"auto"} spacing={3}>
            <AccountButton />
            <Menu placement="bottom-end">
              <MenuButton
                as={Button}
                height="40px"
                px="16px"
                borderRadius="20px"
                border="1px solid rgba(255, 255, 255, 0.5)"
                color="white"
                bg="rgba(0, 0, 0, 0.25)"
                _hover={{
                  bg: "rgba(0, 0, 0, 0.35)",
                  borderColor: "white",
                }}
                _active={{
                  bg: "rgba(0, 0, 0, 0.4)",
                }}
                rightIcon={<ChevronDownIcon />}
              >
                {chain
                  ? chain.id === 42161
                    ? "Arbitrum"
                    : chain.name
                  : "Select network"}
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
                  scrollbarWidth: "thin",
                  scrollbarColor: "rgba(255, 255, 255, 0.2) rgba(255, 255, 255, 0.05)",
                }}
              >
                {chains.filter((c) => c.id !== 421614).map((c, index, filteredChains) => {
                  const isFirst = index === 0;
                  const isLast = index === filteredChains.length - 1;
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
                      key={c.id}
                      bg={c.id === chain?.id ? "rgba(255, 255, 255, 0.1)" : "transparent"}
                      color="white"
                      borderRadius={itemRadius}
                      mx={1.5}
                      my={0}
                      py={2.5}
                      px={3}
                      margin={0}
                      fontSize="14px"
                      fontWeight={c.id === chain?.id ? "600" : "500"}
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
                        if (c.id !== chain?.id) {
                          switchChain?.({ chainId: c.id });
                        }
                      }}
                    >
                      <Text noOfLines={1} flex={1}>
                        {c.id === 42161 ? "Arbitrum" : c.name}
                      </Text>
                    </MenuItem>
                  );
                })}
              </MenuList>
            </Menu>
          </HStack>

          <Flex
            align="center"
            justify="center"
            fontSize="46px"
            fontWeight="900"
            mt="20px"
            mb="10px"
            gap="12px"
          >
            <Text as="span">WBEAM ({chain?.name})</Text>
            <ArrowRightIcon />
            <Text as="span">BEAM Bridge</Text>
          </Flex>
        </VStack>       
      )}
      { children }
    </Flex>
  );
};

export default Window;
