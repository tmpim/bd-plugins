/**
 * @name NoDrag
 * @authorId 333530784495304705
 */

import React from "@shared/base/discordreact";
import { addContextMenuItems, MenuGroup, MenuUncontrolledCheckboxItem } from "@shared/components/contextmenu";
import { FormText, PanelFormItem } from "@shared/components/forms";
import { flexpatch } from "@shared/patch/flexpatch";
import PatchManager from "@shared/patch/PatchManager";
import { useSettings } from "@shared/settings/hook";
import { defineSettings } from "@shared/settings/persistance";
import { createSettingsPanel } from "@shared/settings/settingspanel";
import { BdPlugin } from "@type/BdPlugin";
import { Margins } from "@shared/styles/discordclasses";
import { mixinChangeLog } from "@shared/mixins/changelog";
import { mixinUpdater } from "@shared/mixins/updater";

export default mixinChangeLog(mixinUpdater(class NoDrag extends PatchManager implements BdPlugin {
    private shouldBlockDrags: boolean = true;

    settings = defineSettings(this, {
        reset_delay: 2
    })

    getName(): string { return "NoDrag"; }
    getDescription(): string { return "Adds a setting to disable reordering of channels/categories."; }
    getVersion(): string { return "0.1.1"; }
    getAuthor(): string { return "Emma"; }

    manageChannelsPermission = BdApi.findModuleByProps("Permissions").Permissions.MANAGE_CHANNELS;
    permissionsModule = BdApi.findModuleByProps("can", "canManageUser");

    start() {
        this.patchPermissions();
        addContextMenuItems(this, ["GuildChannelList", "ChannelListTextChannel", "ChannelListVoiceChannel"],
            (e) => this.permissionsModule.can(this.manageChannelsPermission, e.props.guild) &&
                <MenuGroup>
                    <MenuUncontrolledCheckboxItem
                        id="reorder"
                        label="Reorder channels"
                        action={this.handleToggleEnabled.bind(this)}
                        initialChecked={!this.shouldBlockDrags}/>
                </MenuGroup>);
    }

    SettingsPane(props: {plugin: NoDrag}) {
        const settings = useSettings(props.plugin);

        return (<>
            <PanelFormItem
                type="TextInput" childProps={{type: "number"}} min={0} max={30}

                label="Delay before re-disabling channel drag (minutes)"
                value={settings.reset_delay}
                onChange={(data) => {
                    settings.reset_delay = +data;
                }}

                basis="20%"
            />

            <FormText className={Margins.marginBottom8} tag="h4" align="right">
                Setting the delay to 0 turns off auto-reenable.
            </FormText>
        </>);
    }

    getSettingsPanel(): HTMLElement {
        return createSettingsPanel(this, <this.SettingsPane plugin={this}/>)
    }

    patchPermissions() {
        this.addPatch(flexpatch(this.permissionsModule, "can", {
            after: (data) => {
                if (this.shouldBlockDrags) {
                    if (data.arguments[0]?.data === this.manageChannelsPermission.data) {
                        const x = new Error();
                        if (x.stack?.toString().includes("canDrag")) {
                            return false;
                        }
                    }
                }
            }
        }));
    }

    private enableTimeout: NodeJS.Timeout;
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
}));
