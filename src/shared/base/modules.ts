export const GuildStore  = /*#__PURE__*/ BdApi.findModuleByProps("getGuild", "getGuilds");
export const IconUtils   = /*#__PURE__*/ BdApi.findModuleByProps("getGuildIconURL", "getGuildBannerURL");
export const ModalStack  = /*#__PURE__*/ BdApi.findModuleByProps("push", "update", "pop", "popWithKey");
export const Changelog   = /*#__PURE__*/ BdApi.findModule((m => m.defaultProps && m.defaultProps.selectable == false));
export const LayerModule = /*#__PURE__*/ BdApi.findModule(x => x && x.AppLayerProvider);
