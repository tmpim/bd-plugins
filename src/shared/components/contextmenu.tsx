import React from "@shared/base/discordreact";
import { CancelFlexPatch, flexpatch } from "@shared/patch/flexpatch";
import PatchManager from "@shared/patch/PatchManager";
import { memo } from "@shared/util/memo";
import { extractProperties } from "@shared/util/objutils";
import { logger } from "@shared/base/logger";
import { Discord } from "@type/DiscordTypes";

const ContextModule = memo(() => BdApi.findModuleByProps("closeContextMenu", "openContextMenu"));

export type ContextMenuType =
    "GuildChannelUser" | "UserGeneric" | "Developer" | "DMUser" | "GroupDMUser" | "NativeTextArea" |
    "Guild" | "ApplicationLaunchOptions" | "NativeImage" | "NativeLink" | "NativeText" | "Guild" |
    "RecentsNotificationSettings" | "ChannelListTextChannel" | "SlateTextArea" | "Message" |
    "SystemMessage" | "ChannelAuditLog" | "AuditLogUser" | "BannedUser" | "WelcomeChannelsSettings" |
    "GuildSettingsUser" | "GuildSettingsRole" | "GroupDM" | "ChannelListTextChannel" | "Stream" |
    "ChannelListStoreChannel" | "ChannelListTextChannel" | "ChannelListThread" |"ChannelListVoiceChannel" |
    "GuildIconNew" | "GuildFolder" | "ApplicationGame" | "ChannelListVoiceChannel" | "MessageSearchResult" |
    "GuildChannelList" | "UserSettingsCog";

interface ContextMenuProps {
    channel: Discord.Channel
    guild: Discord.Guild
    className: string
    position: "top" | "bottom" | "left" | "right"
    target: HTMLElement
    theme: "light" | "dark"
}

export type OpenContextMenuEvent<Ts = ContextMenuType> = {
    props: ContextMenuProps,
    ctxMenuType: Ts,
    ctxMenuObject: React.ReactElement
};

// Top level CTXMenu Hooker
export function hookContextMenu<MenuType extends ContextMenuType>(
    types: MenuType[], hook: (e: OpenContextMenuEvent<MenuType>) => void
): CancelFlexPatch {
    const patchCancels: CancelFlexPatch[] = [];
    const patchedModules: Set<GenericFunction> = new Set();

    const hookCancel = flexpatch(ContextModule.get(), "openContextMenu", {
        before(call) {
            const menuObj = call.arguments[1]();
            // First check if this is the type of context menu that we want to hook
            const whichType = types.find(
                t => (menuObj?.type
                    ?.displayName as string)
                    ?.startsWith(t));

            if (whichType) {
                // Now check that we haven't already patched it
                if (!patchedModules.has(menuObj.type)) {
                    patchedModules.add(menuObj.type);

                    const HostModule = BdApi.findModule(m => m?.default === menuObj.type);
                    if (HostModule) {
                        // Perform the actual patch
                        patchCancels.push(flexpatch(HostModule, "default", {
                            after(ctxcall) {
                                if (ctxcall.returnValue) {
                                    console.log(ctxcall.returnValue);
                                    hook({
                                        props: ctxcall.arguments[0],
                                        ctxMenuType: whichType,
                                        ctxMenuObject: ctxcall.returnValue as React.ReactElement
                                    });
                                }
                            }
                        }));
                    } else {
                        logger.warn("ContextMenu hook found a suitable hook target, but couldnt find the host module!");
                    }
                }
            }
        }
    });

    return function() {
        hookCancel();
        patchCancels.forEach(p => p());
    };
}

// ============
// Components & Utils for manipulating the context menus

/*

TODO:

MenuCheckboxItem: (...)
MenuControlItem: (...)
MenuGroup: (...)
MenuItem: (...)
MenuRadioItem: (...)
MenuSeparator: (...)

*/

const MenuAPIItems: {
    MenuCheckboxItem: FC
    MenuControlItem: FC
    MenuGroup: FC
    MenuItem: FC<GenericMenuItemProps & {action?: () => void}>
    MenuRadioItem: FC
    MenuSeparator: FC
} = BdApi.findModuleByProps("MenuItem", "MenuGroup");

export interface GenericMenuItemProps {
    id: string
    label: string
    disabled?: boolean
    render?: (props: unknown) => React.ReactNode
}

export const MenuItem = MenuAPIItems.MenuItem;
export const MenuGroup = MenuAPIItems.MenuGroup;

const CustomMenuItemWrapper: React.FC<{
    childProps?: unknown
    disabled?: boolean
}> = function(props) {
    const [hovered, setHovered] = React.useState(false);

    return <div onMouseEnter = {() => setHovered(true)}
        onMouseLeave = {() => setHovered(false)}>
        {React.createElement(props.children as React.FC, Object.assign({}, props.childProps, { isFocused: hovered && !props.disabled }) as Record<string, unknown>)}
    </div>;
};

const NativeCheckbox = BdApi.findModuleByDisplayName("MenuCheckboxItem");
export const MenuUncontrolledCheckboxItem: React.FC<GenericMenuItemProps & {
    initialChecked: boolean
    action?: (value: boolean) => void
}> = function(props) {
    const [checked, setChecked] = React.useState(props.initialChecked);
    return <NativeCheckbox {...props} action={() => {
        props.action?.(!checked);
        setChecked(!checked);
    }} checked={checked}/>;
};

export const MenuControlledCheckboxItem: React.FC<GenericMenuItemProps & {
    checked: boolean
}> = NativeCheckbox;

const realMenuItems = Object.values(MenuAPIItems);
export function transformContextMenuItem(item: React.ReactElement | null): React.ReactElement | null {
    if (!item) return null;

    if (realMenuItems.find(x => x === item.type)) {
        const children = item.props.children;
        if (Array.isArray(children)) {
            item.props.children = children.map(c => transformContextMenuItem(c)).filter(x => x);
        } else if (children) {
            item.props.children = transformContextMenuItem(children);
        }

        return item;
    } else {
        const props = item.props;
        return <MenuItem
            id={props.id}
            label={undefined!}
            disabled={props.disabled}
            render={menuItemProps => {
                props.state = props.state ?? extractProperties(props, ["checked", "value"]);
                return <CustomMenuItemWrapper
                    childProps={Object.assign({}, props, menuItemProps)}
                    disabled={props.disabled}
                >{item.type}</CustomMenuItemWrapper>;
            }}
        />;
    }
}


export function injectContextMenuItems(obj: React.ReactElement, ...items: React.ReactElement[]): void {
    const target = obj.props.children;

    for (const item of items) {
        const pobj = transformContextMenuItem(item);

        target.push(pobj);
    }
}

// Even higher level abstractions past here

export function addContextMenuItems<MenuType extends ContextMenuType>(
    manager: PatchManager,
    types: MenuType[],
    itemFactory: (e: OpenContextMenuEvent<MenuType>) => React.ReactElement
): void {
    manager.addPatch(hookContextMenu(types, (e) => {
        injectContextMenuItems(e.ctxMenuObject, itemFactory(e));
    }));
}
