interface TextColors {
    BRAND: string
    ERROR: string
    HEADER_PRIMARY: string
    HEADER_SECONDARY: string
    MUTED: string
    STANDARD: string
    STATUS_GREEN: string
    STATUS_RED: string
    STATUS_YELLOW: string
}

interface TextSizes {
    SIZE_10: string
    SIZE_12: string
    SIZE_14: string
    SIZE_16: string
    SIZE_20: string
    SIZE_24: string
    SIZE_32: string
}

export const Text: React.FC<{
    className?: string
    color?: string
    size?: string
}> & {
    Colors: TextColors,
    Sizes: TextSizes
} = BdApi.findModuleByDisplayName("Text")
