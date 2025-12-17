import React, { ReactNode } from "react";
import {
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalContentProps,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  ModalProps,
} from "@chakra-ui/react";

type AppModalProps = Omit<ModalProps, "children"> & {
  title?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  contentProps?: ModalContentProps;
  bodyProps?: React.ComponentProps<typeof ModalBody>;
};

const AppModal: React.FC<AppModalProps> = ({
  title,
  children,
  footer,
  contentProps,
  bodyProps,
  ...modalProps
}) => {
  return (
    <Modal isCentered motionPreset="slideInBottom" {...modalProps}>
      <ModalOverlay bg="blackAlpha.700" />
      <ModalContent
        bgColor="rgba(13, 77, 118)"
        border="1px solid rgba(255, 255, 255, 0.15)"
        color="#fff"
        {...contentProps}
      >
        {title !== undefined && <ModalHeader>{title}</ModalHeader>}
        <ModalCloseButton />
        <ModalBody {...bodyProps}>{children}</ModalBody>
        {footer !== undefined && <ModalFooter>{footer}</ModalFooter>}
      </ModalContent>
    </Modal>
  );
};

export default AppModal;

