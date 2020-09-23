import React from "@shared/base/discordreact";
import { Text } from "./text";
import { FormTitle } from "./forms";
import { Margins } from "@shared/styles/discordclasses";

enum TransitionState {
    CLOSED  = 0,
    OPENING = 1,
    OPEN    = 2,
    CLOSING = 3
}

interface ModalProps {
    onClose(): void,
    transitionState: TransitionState
}

const NativeModalUtils: {
    openModal(
        factory: (props: ModalProps) => React.ReactNode,
        hooks: { onCloseRequest: GenericFunction }
    ): void
} = BdApi.findModuleByProps("openModal", "hasModalOpen")

const ModalComponents: {
    ModalRoot: any,
    ModalHeader: any,
    ModalContent: any,
    ModalFooter: any
} = BdApi.findModuleByProps("ModalRoot", "ModalContent");

export interface ModalConfig {
    header?: string
    subheader?: string
    text?: string
    content?: React.ReactNode

    className?: string
    headerClassName?: string
}

export function openModal(config: ModalConfig, jsx?: JSX) {
    let modalProps: ModalProps | undefined;
    const closeModal = () => modalProps?.onClose();

    NativeModalUtils.openModal(props => {
        modalProps = props;
    return <ModalWrapper transitionState={props.transitionState} {...config}>{jsx}</ModalWrapper>
    }, {
        onCloseRequest: closeModal
    })
}

const identityComponent: () => FC = () => (props) => { return <>{props.children}</> }

export const ModalHeader = identityComponent();
export const ModalContent = identityComponent();
export const ModalFooter = identityComponent();

const ModalWrapper: React.FC<ModalConfig & {
    transitionState: TransitionState
}> = (props) => {
    // useEffect(function mount() {


    //     return function onUnmount() {

    //     }
    // }, []);
    let headerNode, contentNode, footerNode;
    if (Array.isArray(props.children)) {
        props.children.forEach(child => {
            if (React.isValidElement(child)) {
                if      (child.type === ModalHeader)  headerNode  = child;
                else if (child.type === ModalContent) contentNode = child;
                else if (child.type === ModalFooter)  footerNode  = child;
            }
        });

        if (!(headerNode || contentNode || footerNode)) {
            contentNode = props.children;
        }
    } else {
        contentNode = props.children;
    }

    // Props based methods
    if (!headerNode) {
        headerNode = (<>
            <FormTitle tag="h4">{props.header}</FormTitle>
            {props.subheader && <Text size={Text.Sizes.SIZE_12}>{props.subheader}</Text>}
        </>);
    }

    if (!contentNode) {
        contentNode = <Text className={Margins.marginTop8} size={Text.Sizes.SIZE_16}>{props.text}</Text>;
    }

    return (
        <ModalComponents.ModalRoot
            className={props.className}
            transitionState={props.transitionState}
        >
            <ModalComponents.ModalHeader>{headerNode}</ModalComponents.ModalHeader>
            <ModalComponents.ModalContent>{contentNode}</ModalComponents.ModalContent>
            <ModalComponents.ModalFooter>{footerNode}</ModalComponents.ModalFooter>
        </ModalComponents.ModalRoot>
    );
}
