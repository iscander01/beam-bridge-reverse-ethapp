import React, { useEffect, useState } from "react";
import { Button, Text, HStack, Tooltip, useClipboard } from "@chakra-ui/react";
import { useDisclosure } from "@chakra-ui/react";
import { formatActiveAddressString } from '@core/appUtils';
import { useAddress } from '../hooks';
import { IconCopyWhite } from '../icons';
import AccountModal from './AccountModal';

const AccountButton: React.FC = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { fullAddress } = useAddress();
  const [formattedAddress, setFormattedAddress] = useState<string>("");
  const { onCopy, hasCopied } = useClipboard(fullAddress || "");

  useEffect(() => {
    if (fullAddress) {
      setFormattedAddress(formatActiveAddressString(fullAddress));
    }
  }, [fullAddress]);

  return (
    <>
      <Button
        onClick={onOpen}
        height="40px"
        px="16px"
        borderRadius="20px"
        border="1px solid rgba(255, 255, 255, 0.5)"
        bg="rgba(0, 0, 0, 0.25)"
        color="white"
        fontSize="14px"
        fontWeight="500"
        _hover={{
          bg: "rgba(0, 0, 0, 0.35)",
          borderColor: "white",
        }}
        _active={{
          bg: "rgba(0, 0, 0, 0.4)",
        }}
      >
        <HStack spacing={2}>
          <Text as="span" noOfLines={1}>
            {formattedAddress}
          </Text>
          {fullAddress && (
            <Tooltip
              label={hasCopied ? "Copied!" : "Copy address"}
              placement="bottom"
              hasArrow
              openDelay={150}
            >
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  onCopy();
                }}
                style={{ display: "inline-flex", alignItems: "center", cursor: "pointer" }}
              >
                <IconCopyWhite width="14px" height="14px" />
              </span>
            </Tooltip>
          )}
        </HStack>
      </Button>

      <AccountModal isOpen={isOpen} onClose={onClose} />
    </>
  );
};

export default AccountButton;

