import React from "react";
import { Window, ConnectButton } from "@app/shared/components";
import { Text, VStack } from "@chakra-ui/react";

const Connect: React.FC = () => {
  return (
    <Window state="content">
      <VStack height={"100vh"} justifyContent={"center"} alignItems={"center"}>
        <Text fontSize={"56px"} fontWeight={"900"} textAlign={"center"}>
          WBEAM (Ethereum) ={">"} BEAM Bridge
        </Text>
        <Text textAlign={"center"} fontSize={"24px"} fontWeight={"bold"} mt={"30px"}>
          Transfer ETH and BEAM.<br/>
          More tokens coming soon!
        </Text>
        <ConnectButton />
      </VStack>
    </Window>
  );
};

export default Connect;
