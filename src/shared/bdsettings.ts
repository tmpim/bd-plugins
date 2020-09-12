const oldSettings = !Array.isArray(BdApi.settings);
export const settingsIds = oldSettings ? {
    automaticLoading: "fork-ps-5",
    coloredText: "bda-gs-7",
    normalizedClasses: "fork-ps-4",
    showToasts: "fork-ps-2"
} : {
    automaticLoading: "settings.addons.autoReload",
    coloredText: "settings.appearance.coloredText",
    normalizedClasses: "settings.general.classNormalizer",
    showToasts: "settings.general.showToasts"
};

export function getSettings(key: string) {
    if (typeof key == "string") return BdApi.isSettingEnabled(...key.split("."));
};
