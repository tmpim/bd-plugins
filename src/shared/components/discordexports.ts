type DiscordComponentColor = "brand" | "black" | "green" | "grey" | "red" | "yellow";

export const Markdown: FC = /*#__PURE__*/ BdApi.findModuleByDisplayName("Markdown");
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
}) => React.ReactNode>  = /*#__PURE__*/ BdApi.findModuleByDisplayName("Tooltip");
