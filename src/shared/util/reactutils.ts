export type ReactInternalStateNode = {
    props: unknown & {
        children?: unknown
    },
    forceUpdate: () => void,
    setState: (key: string, value: unknown) => void,
    _reactInternalFiber: ReactInternalElementState
}

export interface ReactInternalElementState {
    alternate?: ReactInternalElementState
    child?: ReactInternalElementState
    return: ReactInternalElementState
    elementType: string | FC
    type: string | FC

    stateNode: ReactStateAccessor | ReactInternalStateNode
}

export interface ReactStateAccessor {
    __reactInternalInstance$: ReactInternalElementState
}

export function isReactDOMNode(el: unknown): el is ReactStateAccessor {
    if ((el as ReactStateAccessor).__reactInternalInstance$) {
        return true;
    }

    return false;
}
