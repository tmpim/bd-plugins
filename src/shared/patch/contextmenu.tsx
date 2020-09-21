import { memo } from "../memo"
import { flexpatch, CancelFlexPatch } from "./flexpatch";
import React from "../discordreact";
import * as logger from "../logger";
import { extractProperties } from "../util/objutils";
import PatchManager from "../extends/PatchManager";

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

export type OpenContextMenuEvent<Ts = ContextMenuType> = {
    props: any,
    ctxMenuType: Ts,
    ctxMenuObject: any
};

// Top level CTXMenu Hooker
export function hookContextMenu<MenuType extends ContextMenuType>(
    types: MenuType[], hook: (e: OpenContextMenuEvent<MenuType>) => void
): CancelFlexPatch {
    let patchCancels: CancelFlexPatch[] = [];
    let patchedModules: Set<Function> = new Set();

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
                                    hook({
                                        props: ctxcall.arguments[0],
                                        ctxMenuType: whichType,
                                        ctxMenuObject: ctxcall.returnValue
                                    })
                                }
                            }
                        }))
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
    }
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
    MenuCheckboxItem: any
    MenuControlItem: any
    MenuGroup: any
    MenuItem: any
    MenuRadioItem: any
    MenuSeparator: any
} = BdApi.findModuleByProps("MenuItem", "MenuGroup");

export interface GenericMenuItemProps {
    id: string
    label: string
    disabled?: boolean
    render?: (props: any) => React.ReactNode
}

export const MenuItem: React.FC<GenericMenuItemProps & {action?: () => void}> = MenuAPIItems.MenuItem;

export const MenuGroup: React.FC = MenuAPIItems.MenuGroup;

const CustomMenuItemWrapper: React.FC<{
    childProps?: any
    disabled?: boolean
}> = function(props) {
    const [hovered, setHovered] = React.useState(false);

    return <div onMouseEnter = {() => setHovered(true)}
                onMouseLeave = {() => setHovered(false)}>
        {React.createElement(props.children as any, Object.assign({}, props.childProps, { isFocused: hovered && !props.disabled }))}
    </div>
};

const NativeCheckbox = BdApi.findModuleByDisplayName("MenuCheckboxItem");
export const MenuUncontrolledCheckboxItem: React.FC<GenericMenuItemProps & {
    initialChecked: boolean
    action?: (value: boolean) => void
}> = function(props) {
    const [checked, setChecked] = React.useState(props.initialChecked);
    return <NativeCheckbox {...props} action={() => {
        props.action?.(!checked);
        setChecked(!checked)
    }} checked={checked}/>
}

export const MenuControlledCheckboxItem: React.FC<GenericMenuItemProps & {
    checked: boolean
}> = NativeCheckbox;

const realMenuItems = Object.values(MenuAPIItems);
export function transformContextMenuItem(item: React.ReactNode) {
    const fitem = item as any;
    if (realMenuItems.find(x => x === fitem.type)) {
        const children = fitem.props.children;
        if (Array.isArray(children)) {
            fitem.props.children = children.map(c => transformContextMenuItem(c));
        } else if (children) {
            fitem.props.children = transformContextMenuItem(children);
        }

        return item;
    } else {
        const props = fitem.props;
        return <MenuItem
            id={props.id}
            label={undefined}
            disabled={props.disabled}
            render={menuItemProps => {
                props.state = props.state ?? extractProperties(props, ["checked", "value"]);
                return <CustomMenuItemWrapper
                    childProps={Object.assign({}, props, menuItemProps)}
                    disabled={props.disabled}
                    children={fitem.type}
                />
            }}
        />;
    }
}


export function injectContextMenuItems(obj: any, ...items: React.ReactNode[]) {
    const target = obj.props.children;

    for (const item of items) {
        const pobj = transformContextMenuItem(item);

        target.push(pobj);
    }
}

// Even higher level abstractions past here

export function addContextMenuItems(manager: PatchManager, types: ContextMenuType[], itemFactory: () => React.ReactNode): void {
    manager.addPatch(hookContextMenu(types, (e) => {
        injectContextMenuItems(e.ctxMenuObject, itemFactory());
    }));
}
