type DiscordComponentColor = "brand" | "black" | "green" | "grey" | "red" | "yellow";

export const Markdown: FC
    = /*#__PURE__*/ BdApi.findModuleByDisplayName("Markdown");

export const Tooltip: FC<{
    text: string
    hideOnClick?: boolean
    position?: "top" | "bottom" | "left" | "right"
    color?: DiscordComponentColor
    delay?: number
    forceOpen?: boolean
    className?: string
}, (props: {
    onMouseEnter: () => void,
    onMouseLeave: () => void,
    onClick: () => void,
}) => React.ReactNode>
    = /*#__PURE__*/ BdApi.findModuleByDisplayName("Tooltip");

export const Popout: FC<{
    renderPopout: (props: unknown) => JSX
    position: "top" | "bottom" | "left" | "right"
    align: "top" | "bottom" | "left" | "right" | "center"
    spacing: number
    onShiftClick?: () => void
}, (props: {onClick: () => void}) => JSX.Element>
    = /*#__PURE__*/ BdApi.findModuleByDisplayName("Popout");

export const UserPopout: FC<{
    userId: string
    guildId: string
    channelId: string
}>
    = /*#__PURE__*/ BdApi.findModuleByDisplayName("UserPopout");
