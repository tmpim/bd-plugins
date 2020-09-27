import { getSettings, settingsIds } from "@shared/settings/bdsettings";
import { removeDuplicates } from "@shared/util/arrayutils";
import { TypedProxy } from "@shared/util/typedproxy";
import { DiscordClassNames as DCN } from "@type/DiscordClasses";

function buildProxy<T extends {[k: string]: string}>(ns: T): T {
    return new TypedProxy<T, T>(ns, {
        get(obj, prop: keyof T) {
            if (!obj[prop]) return "";
            let className: string = obj[prop];

            if (getSettings(settingsIds.normalizedClasses)) {
                className = className.split(" ")
                    .filter(n => n.indexOf("da-") != 0)
                    .map(n => n.replace(/^([A-z0-9]+?)-([A-z0-9_-]{6})$/g, "$1-$2 da-$1"))
                    .join(" ");
            }

            return removeDuplicates(className.split(" ")).join(" ");
        }
    });
}

// Hoist duplicate property accesses, and clean up the PURE declarations
const findByProps = BdApi.findModuleByProps;
const findModule = BdApi.findModule;

export const ContextMenuClasses    = /*#__PURE__*/ buildProxy<DCN.ContextMenu>     (/*#__PURE__*/ findByProps("menu", "item"));
export const ScrollerClasses       = /*#__PURE__*/ buildProxy<DCN.Scrollers>       (/*#__PURE__*/ findByProps("scrollerBase", "none", "fade"));
export const AccountDetailClasses  = /*#__PURE__*/ buildProxy<DCN.AccountDetails>  (/*#__PURE__*/ findByProps("container", "avatar", "hasBuildOverride"));
export const TypingClasses         = /*#__PURE__*/ buildProxy<DCN.Typing>          (/*#__PURE__*/ findByProps("typing", "text"));
export const UserPopoutClasses     = /*#__PURE__*/ buildProxy<DCN.UserPopout>      (/*#__PURE__*/ findByProps("userPopout"));
export const PopoutRoleClasses     = /*#__PURE__*/ buildProxy<DCN.PopoutRoles>     (/*#__PURE__*/ findByProps("roleCircle"));
export const UserModalClasses      = /*#__PURE__*/ buildProxy<DCN.UserModal>       (/*#__PURE__*/ findByProps("profileBadge"));
export const TextareaClasses       = /*#__PURE__*/ buildProxy<DCN.Textarea>        (/*#__PURE__*/ findByProps("channelTextArea", "textArea"));
export const PopoutClasses         = /*#__PURE__*/ buildProxy<DCN.Popouts>         (/*#__PURE__*/ findByProps("popouts", "popout"));
export const TitleClasses          = /*#__PURE__*/ buildProxy<DCN.Titles>          (/*#__PURE__*/ findByProps("defaultMarginh5"));
export const NoticeClasses         = /*#__PURE__*/ buildProxy<DCN.Notices>         (/*#__PURE__*/ findByProps("notice", "platformIcon"));
export const NoticePlatformClasses = /*#__PURE__*/ buildProxy<DCN.PlatformNotices> (/*#__PURE__*/ findByProps("iconAndroid", "textLink"));
export const BackdropClasses       = /*#__PURE__*/ buildProxy<DCN.Backdrop>        (/*#__PURE__*/ findByProps("backdrop"));
export const ModalClasses          = /*#__PURE__*/ buildProxy<DCN.Modals>          (/*#__PURE__*/ findModule(m => m.modal && m.inner && !m.header));
export const AuditLogClasses       = /*#__PURE__*/ buildProxy<DCN.AuditLog>        (/*#__PURE__*/ findByProps("userHook"));
export const ChannelListClasses    = /*#__PURE__*/ buildProxy<DCN.ChannelList>     (/*#__PURE__*/ Object.assign({}, /*#__PURE__*/ findByProps("containerDefault"), /*#__PURE__*/ findByProps("name", "unread"), /*#__PURE__*/ findByProps("sidebar", "hasNotice")) as DCN.ChannelList);
export const MemberListClasses     = /*#__PURE__*/ buildProxy<DCN.MemberList>      (/*#__PURE__*/ Object.assign({}, /*#__PURE__*/ findByProps("member", "memberInner"), /*#__PURE__*/ findByProps("members", "membersWrap")) as unknown as DCN.MemberList);
export const TitleWrapClasses      = /*#__PURE__*/ buildProxy<DCN.TitleWrap>       (/*#__PURE__*/ findByProps("titleWrapper"));
export const TitlebarClasses       = /*#__PURE__*/ buildProxy<DCN.Titlebar>        (/*#__PURE__*/ findByProps("titleBar"));
export const EmbedClasses          = /*#__PURE__*/ buildProxy<DCN.Embeds>          (/*#__PURE__*/ findByProps("embed", "embedAuthor"));
export const LayerClasses          = /*#__PURE__*/ buildProxy<DCN.Layers>          (/*#__PURE__*/ findByProps("layers", "layer"));
export const TooltipLayerClasses   = /*#__PURE__*/ buildProxy<DCN.TooltipLayers>   (/*#__PURE__*/ findByProps("layerContainer", "layer"));
export const Margins               = /*#__PURE__*/ buildProxy<DCN.Margins>         (/*#__PURE__*/ findModule(m => !m.title && m.marginBottom40 && m.marginTop40));
export const Dividers              = /*#__PURE__*/ buildProxy<DCN.Dividers>        (/*#__PURE__*/ Object.assign({}, /*#__PURE__*/ findByProps("dividerDefault"), /*#__PURE__*/ findModule(m => Object.keys(m).length == 1 && m.divider)));
export const ChangelogClasses      = /*#__PURE__*/ buildProxy<DCN.Changelog>       (/*#__PURE__*/ Object.assign({}, /*#__PURE__*/ findByProps("container", "added"), /*#__PURE__*/ findByProps("content", "modal", "size")) as unknown as DCN.Changelog);
export const BasicInputClasses     = /*#__PURE__*/ buildProxy<DCN.BasicInputs>     (/*#__PURE__*/ findByProps("inputDefault"));
export const MessagesClasses       = /*#__PURE__*/ buildProxy<DCN.Messages>        (/*#__PURE__*/ findByProps("message", "mentioned"));
export const GuildClasses          = /*#__PURE__*/ buildProxy<DCN.Guilds>          (/*#__PURE__*/ findByProps("wrapper", "lowerBadge", "svg"));
export const EmojiPickerClasses    = /*#__PURE__*/ buildProxy<DCN.EmojiPicker>     (/*#__PURE__*/ findByProps("emojiPicker", "inspector"));
export const ReactionClasses       = /*#__PURE__*/ buildProxy<DCN.Reactions>       (/*#__PURE__*/ findByProps("reaction", "reactionInner"));
export const CheckboxClasses       = /*#__PURE__*/ buildProxy<DCN.Checkbox>        (/*#__PURE__*/ findByProps("checkbox", "checkboxInner"));
export const TooltipClasses        = /*#__PURE__*/ buildProxy<DCN.Tooltips>        (/*#__PURE__*/ findByProps("tooltip", "tooltipBlack"));
