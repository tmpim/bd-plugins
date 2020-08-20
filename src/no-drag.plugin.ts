/**
 * @name NoDrag
 * @authorId 333530784495304705
 */

import { BdPlugin } from "../types/BdPlugin";
import { CancelPatch } from "../types/BdApi";
import { BDFPlugin, ContextMenuEvent } from "../types/BDFBD";

class NoDrag implements BdPlugin, BDFPlugin {
    name: string;
    started: boolean;
    stopping: boolean;
    defaults: { settings: NoDrag["settings"] };
    settings: {
        reset_delay: number;
    };

    SettingsUpdated: boolean;

    shouldBlockDrags: boolean = true;
    enableTimeout: NodeJS.Timeout;

    permissionsModule: { can: Function }
    manageChannelsPermission: { data: BigInt }
    removePermissionPatch: CancelPatch

    MenuItemCheckbox: any;

    getName(): string { return "NoDrag"; }
    getDescription(): string { return "Adds a setting to disable reordering of channels/categories."; }
    getVersion(): string { return "0.0.1"; }
    getAuthor(): string { return "Emma"; }

    getSettingsPanel() {
        if (!window.BDFDB || typeof BDFDB != "object" || !BDFDB.loaded || !this.started) return;
        let settingsPanel, settingsItems = [];

        settingsItems.push(BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.SettingsSaveItem, {
            type: "TextInput",
            className: BDFDB.disCN.marginbottom8,
            plugin: this,
            keys: ["settings", "reset_delay"],
            label: "Delay before re-disabling channel drag (minutes)",
            basis: "20%",
            childProps: {type: "number"},

            min: 0,
            max: 30,
            value: this.settings.reset_delay
        }));

        settingsItems.push(BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.FormComponents.FormText, {
            tag: BDFDB.LibraryComponents.FormComponents.FormTitleTags.H4,
            className: BDFDB.disCN.marginbottom8,
            align: "right",
            children: "Setting the delay to 0 turns off auto-reenable."
        }));

        return settingsPanel = BDFDB.PluginUtils.createSettingsPanel(this, settingsItems);
    }

    forceUpdateAll() {
        this.settings = BDFDB.DataUtils.get(this, "settings");

        BDFDB.ModuleUtils.forceAllUpdates(this);
    }

    start(): void {
        if (!window.BDFDB) window.BDFDB = {myPlugins:{}};
        if (window.BDFDB && window.BDFDB.myPlugins && typeof window.BDFDB.myPlugins == "object") window.BDFDB.myPlugins[this.getName()] = this;
        let libraryScript = document.querySelector("head script#BDFDBLibraryScript");
        if (!libraryScript || (performance.now() - +libraryScript.getAttribute("date")) > 600000) {
            if (libraryScript) libraryScript.remove();
            libraryScript = document.createElement("script");
            libraryScript.setAttribute("id", "BDFDBLibraryScript");
            libraryScript.setAttribute("type", "text/javascript");
            libraryScript.setAttribute("src", "https://mwittrien.github.io/BetterDiscordAddons/Plugins/BDFDB.min.js");
            libraryScript.setAttribute("date", performance.now().toString());
            libraryScript.addEventListener("load", _ => {this.initialize();});
            document.head.appendChild(libraryScript);
        }
        else if (window.BDFDB && typeof BDFDB === "object" && BDFDB.loaded) this.initialize();
        setTimeout(_ => {
            try {return this.initialize();}
            catch (err) {console.error(`%c[${this.getName()}]%c`, "color: #3a71c1; font-weight: 700;", "", "Fatal Error: Could not initiate plugin! " + err);}
        }, 30000);
    }

    initConstructor(): void {
        this.defaults = {
            settings: {
                reset_delay: 2
            }
        }
    }

    initialize(): void {
        if (window.BDFDB && typeof BDFDB === "object" && BDFDB.loaded) {
            if (this.started) return;
            BDFDB.PluginUtils.init(this);

            this.forceUpdateAll();

            this.performPatch();
        }
    }

    stop(): void {
        this.cleanupPatch();

        if (window.BDFDB && typeof BDFDB === "object" && BDFDB.loaded) {
            this.stopping = true;

            this.forceUpdateAll();

            BDFDB.PluginUtils.clear(this);
        }
    }

    onSettingsClosed() {
        if (this.SettingsUpdated) {
            delete this.SettingsUpdated;

            this.forceUpdateAll();
        }
    }

    onGuildContextMenu(e: ContextMenuEvent) {
        if (e.type === "GuildChannelListContextMenu") {
            let [children] = BDFDB.ContextMenuUtils.findItem(e.returnvalue, {id: "create", group: true});
            this.injectItem(e.instance, children, -1);
        }
    }

    onChannelContextMenu(e: any) {
        if (e.type === "ChannelListTextChannelContextMenu" ||
            e.type === "ChannelListVoiceChannelContextMenu") {

            let [children] = BDFDB.ContextMenuUtils.findItem(e.returnvalue, {id: "create", group: true});
            this.injectItem(e.instance, children, -1);
        }
    }

    injectItem(instance: any, children: any[], index: number) {
        const guild = instance.props.guild;
        const actuallyHasPermission = this.permissionsModule.can(this.manageChannelsPermission, guild);

        children.splice(index > -1 ? index : children.length, 0, BDFDB.ContextMenuUtils.createItem(BDFDB.LibraryComponents.MenuItems.MenuGroup, {
            children: [
                BDFDB.ContextMenuUtils.createItem(this.MenuItemCheckbox, {
                    label: "Reorder channels",
                    id: BDFDB.ContextMenuUtils.createItemId(this.name, "openmenu"),
                    checked: !this.shouldBlockDrags,
                    action: this.handleToggleEnabled.bind(this),
                    disabled: !actuallyHasPermission
                }),
            ]
        }));
    }

    handleToggleEnabled(allowDrags: boolean): void {
        this.shouldBlockDrags = !allowDrags;

        clearTimeout(this.enableTimeout);
        if (!this.shouldBlockDrags && +this.settings.reset_delay > 0) {
            this.enableTimeout = setTimeout(() => {
                this.shouldBlockDrags = true;
                BdApi.showToast("Channel Reordering automatically disabled.")
            }, +this.settings.reset_delay * 60 * 1000);
        }
    }

    performPatch(): void {
        this.manageChannelsPermission = BdApi.findModuleByProps("Permissions").Permissions.MANAGE_CHANNELS;
        this.permissionsModule = BdApi.findModuleByProps("can", "canManageUser");
        this.removePermissionPatch = BdApi.monkeyPatch(this.permissionsModule, "can", {
            after: (data) => {
                if (this.shouldBlockDrags) {
                    if (data.methodArguments[0]?.data === this.manageChannelsPermission.data) {
                        const x = new Error();
                        if (x.stack.toString().includes("canDrag")) {
                            data.returnValue = false;
                        }
                    }
                }
            }
        });

        // The BDFDB MenuCheckbox doesn't passthrough the 'disabled' prop, so we have to extend it ourselves
        const nativeCheckbox = BdApi.findModuleByDisplayName("MenuCheckboxItem");
        this.MenuItemCheckbox = class MenuItemCheckbox extends BdApi.React.Component {
            props: {
                disabled: boolean;
                action: (checked: boolean, instance: MenuItemCheckbox) => void;

                state: {
                    checked: boolean;
                }
            }

            handleClick() {
                if (this.props.state) {
                    this.props.state.checked = !this.props.state.checked;
                    if (typeof this.props.action == "function") this.props.action(this.props.state.checked, this);
                }

                BDFDB.ReactUtils.forceUpdate(this);
            }

            render() {
                return BDFDB.ReactUtils.createElement(nativeCheckbox, Object.assign({}, this.props, {
                    checked: this.props.state?.checked,
                    disabled: this.props.disabled,
                    action: this.handleClick.bind(this)
                }));
            }
        };
    }

    cleanupPatch(): void {
        this?.removePermissionPatch();
    }
}

export = NoDrag;
