import React from "@shared/base/discordreact";
import { findDefaultModuleByDisplayName } from "@shared/base/modules";
import { Flex, FormDivider, NativeButton, PanelFormItem } from "@shared/components/forms";
import { mixinChangeLog } from "@shared/mixins/changelog";
import { mixinUpdater } from "@shared/mixins/updater";
import PatchManager from "@shared/patch/PatchManager";
import { CTree, findChildrenBy, processComponentType } from "@shared/patch/typepatch";
import { useSettings } from "@shared/settings/hook";
import { defineSettings } from "@shared/settings/persistance";
import { createSettingsPanel } from "@shared/settings/settingspanel";
import { Margins } from "@shared/styles/discordclasses";
import { clazz } from "@shared/styles/utils";
import { BdPlugin } from "@type/BdPlugin";
const { useState } = React;

interface Whomst {
    [k: string]: {
        name: string;
        timezone?: string;
        discord?: string[];
        [k: string]: unknown;
    };
}

const WHOMST_API = "https://auth.tmpim.pw/whomst";

export default mixinChangeLog(mixinUpdater(class Clocks extends PatchManager implements BdPlugin {
    private UserPopout = findDefaultModuleByDisplayName("UserPopout");

    private whomst?: Whomst;
    private discordLookup?: Record<string, string>; // Discord ID -> Whomst ID

    settings = defineSettings(this, {
        token: "",
        use24hr: false,
    })

    getName(): string { return "Clocks"; }
    getDescription(): string { return "Adds local time data to tmpim members' profiles."; }
    getVersion(): string { return "0.0.2"; }
    getAuthor(): string { return "Emma"; }

    start() {
        this.addPatch(processComponentType(this.UserPopout, (props, rvalue) => {
            const userId = props.userId as string;
            const personId = this.discordLookup?.[userId];
            if (!personId) return; // Doesn't exist in whomst

            const person = this.whomst?.[personId];
            const timezone = person?.timezone;
            if (!timezone) return; // Can't generate a time

            const header = findChildrenBy(rvalue as CTree,
                p => {
                    return (p.className as string)?.includes("da-headerText");
                });

            if (header) {
                const children = header.props.children as CTree[];
                if (children) {
                    const currentTime = new Date().toLocaleString("en-US",
                        {
                            timeZone: timezone,
                            hour: "numeric", minute: "numeric",
                            hour12: !this.settings.use24hr
                        });

                    children.push(<div className={Margins.marginTop8} style={{
                        color: props.activity || props.isApplicationStreaming
                            ? "white" : "var(--header-secondary)"
                    }}>
                        <span>{currentTime} Local</span>
                    </div>);
                }
            }
        }));

        void this.fetchWhomst();
    }

    stop(): void {
        super.stop();
    }

    SettingsPane(props: {plugin: Clocks}) {
        const settings = useSettings(props.plugin);

        const [tokenVisible, setTokenVisible] = useState(!settings.token);

        const refresh = async () => {
            if (await props.plugin.fetchWhomst()) {
                BdApi.showToast(
                    "Clocks: Whomst successfully refetched!",
                    {
                        timeout: 4000,
                        type: "success"
                    }
                );
            }
        };

        return (<>
            <Flex>
                <PanelFormItem
                    label="TmpAuth Token"
                    type="TextInput"
                    childProps={{type: tokenVisible ? "text" : "password"}}
                    value={settings.token}
                    onChange={(data) => {
                        settings.token = data;
                    }}/>

                <NativeButton
                    onClick={() => setTokenVisible(!tokenVisible)}
                    look={NativeButton.Looks.FILLED}
                >
                    {tokenVisible
                        ? "Hide"
                        : "Reveal"
                    }
                </NativeButton>
            </Flex>

            <PanelFormItem
                label="Use 24-hour format"
                type="Switch"
                value={settings.use24hr}
                onChange={() => {
                    settings.use24hr = !settings.use24hr;
                }}/>

            <FormDivider/>

            <Flex className={clazz(Margins.marginTop20, Margins.marginBottom8)}>
                <Flex.Child/>
                <NativeButton
                    onClick={refresh}
                    look={NativeButton.Looks.FILLED}
                >Refetch Whomst</NativeButton>
            </Flex>
        </>);
    }

    getSettingsPanel(): HTMLElement {
        return createSettingsPanel(this, <this.SettingsPane plugin={this}/>);
    }

    showSetup() {
        BdApi.showToast(
            "Clocks requires a TmpAuth token to work, please go to settings to add one",
            {
                timeout: 8000,
                type: "info"
            }
        );
    }

    async fetchWhomst() {
        if (!this.settings.token) {
            return this.showSetup();
        }

        try {
            const res = await fetch(WHOMST_API, { headers: {
                ["X-Tmpauth-Token"]: this.settings.token
            }});

            this.whomst = await res.json();
            this.discordLookup = {};
            for (const personId in this.whomst) {
                const personData = this.whomst[personId];

                if (!personData.discord) continue;
                for (const discordId of personData.discord) {
                    this.discordLookup[discordId] = personId;
                }
            }
        } catch (e) {
            BdApi.showToast(
                "Clocks: An error occurred fetching whomst, please check your auth token",
                {
                    timeout: 5000,
                    type: "error"
                }
            );

            return false;
        }

        return true;
    }

}));
