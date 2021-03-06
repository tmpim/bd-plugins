export function findDefaultModuleByDisplayName(displayName: string): {
    default: FC<unknown>
} {
    return BdApi.findModule(x => x.default && x.default.displayName == displayName);
}

export const GuildStore    = /*#__PURE__*/ BdApi.findModuleByProps("getGuild", "getGuilds");
export const IconUtils     = /*#__PURE__*/ BdApi.findModuleByProps("getGuildIconURL", "getGuildBannerURL");
export const ModalStack    = /*#__PURE__*/ BdApi.findModuleByProps("push", "update", "pop", "popWithKey");
export const AvatarModule  = /*#__PURE__*/ BdApi.findModuleByProps("AnimatedAvatar", "default");
export const UserStore     = /*#__PURE__*/ BdApi.findModuleByProps("getUser", "getCurrentUser");
export const AccountModule = /*#__PURE__*/ BdApi.findModule(x => x.default && x.default.displayName == "AccountConnected");
export const Changelog     = /*#__PURE__*/ BdApi.findModule((m => m.defaultProps && m.defaultProps.selectable == false));
export const LayerModule   = /*#__PURE__*/ BdApi.findModule(x => x && x.AppLayerProvider);
export const RoutingModule = /*#__PURE__*/ BdApi.findModuleByProps("transitionTo", "getFingerprintLocation");
export const RoutesModule  = /*#__PURE__*/ BdApi.findModuleByProps("Routes").Routes;
export const MessageStore  = /*#__PURE__*/ BdApi.findModuleByProps("getMessage", "getMessages");
export const VoiceState    = /*#__PURE__*/ BdApi.findModuleByProps("getVoiceStateForUser", "isCurrentClientInVoiceChannel")
export const ChannelStore  = /*#__PURE__*/ BdApi.findModuleByProps("getChannel", "getDMFromUserId");
