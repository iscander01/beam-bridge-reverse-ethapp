import React, { ReactNode, useRef } from 'react';
import { useAccount } from 'wagmi';
import { AccountButton } from '@app/shared/components';
import { Box, Flex, Text, VStack } from '@chakra-ui/react';

interface WindowProps {
  onPrevious?: React.MouseEventHandler | undefined;
  state?: 'content';
  children?: ReactNode;
}

const Window: React.FC<WindowProps> = ({
  children,
  state
}) => {
  const { chain } = useAccount();
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
          <Box ml={"auto"}>
            <AccountButton />
          </Box>

          <Text textAlign={"center"} fontSize={"46px"} fontWeight={"900"} margin={"20px 0 10px"}>
            WBEAM ({chain?.name}) ={'>'} BEAM Bridge
          </Text>
        </VStack>       
      )}
      { children }
    </Flex>
  );
};

export default Window;
