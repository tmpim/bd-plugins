import fs from "fs";
import path from "path";
import { BdPlugin } from "@type/BdPlugin";
import React from "@shared/base/discordreact";
import { PanelFormItem } from "@shared/components/forms";
import { CloseIcon } from "@shared/components/icons";
import { assetsPath } from "@shared/base/paths";
import { defineSettings } from "@shared/settings/persistance";
import { createSettingsPanel } from "@shared/settings/settingspanel";
import * as spyglass from "./spyglass";
import styles from "./styles.scss";
import { useSettings } from "@shared/settings/hook";
import { useImageAsset } from "@shared/util/hooks";
import { mixinUpdater } from "@shared/mixins/updater";
import { mixinChangeLog } from "@shared/mixins/changelog";
import { convertToDataURL } from "@shared/util/dataurl";
const { useState, useEffect } = React;

export default mixinChangeLog(mixinUpdater(class Tetrio implements BdPlugin {
    static cssID = "TetrioCSS";
    assetsPath = assetsPath(this);

    notificationSound?: string; // Data URL for the notification sound

    defaultSounds: Record<string, {name: string, filename: string}> = {
        showscore: {name: "Score",    filename: "showscore.mp3"},
        mmstart  : {name: "Mission",  filename: "mmstart.mp3"},
        overture : {name: "Overture", filename: "overture.mp3"},
    }

    get soundOptions() {
        const base = Object.entries(this.defaultSounds).map(([key, {name}]) => ({ label: name, value: key }));
        base.push({label: "Custom", value: "custom"});
        return base;
    }

    settings = defineSettings(this, {
        sound: "showscore", // Which sound to use
        soundpath: "", // Filepath for custom sounds
        volume: 0.4, // The volume to play notifications at
        launchDesktop: false, // Whether to launch the desktop client directly or not
        ignoreFirstTime: false, // Whether to show the popup at plugin load (w/to ignore already running games)
        respectDND: true, // Respects when status is set to DND: sounds won't play
    })

    getName(): string { return "Tetrio"; }
    getDescription(): string { return "Pops up a message when tmpim spyglass reports an active tetr.io lobby."; }
    getVersion(): string { return "0.0.5"; }
    getAuthor(): string { return "Emma"; }

    start(): void {
        spyglass.connect();

        this.reloadNotificationSound();

        const container = document.createElement("div");
        container.id = "tetrio-plgn-container";
        document.body.appendChild(container);

        BdApi.injectCSS(Tetrio.cssID, styles);

        BdApi.ReactDOM.render(
            <this.LobbyPopup plugin={this}/>,
            document.getElementById("tetrio-plgn-container")
        );
    }

    stop(): void {
        BdApi.clearCSS(Tetrio.cssID);

        const elm = document.getElementById("tetrio-plgn-container");
        if (elm instanceof HTMLElement) {
            document.body.removeChild(elm);
        }

        spyglass.close();
    }

    SettingsPane(props: {plugin: Tetrio}) {
        const settings = useSettings(props.plugin);

        return (<>
            <PanelFormItem
                label="Notification Sound"
                type="Select"
                options={props.plugin.soundOptions}
                value={settings.sound}
                onChange={(data) => {
                    settings.sound = data.value; // Persist

                    // Give the user a sample
                    props.plugin.reloadNotificationSound();
                    props.plugin.playNotification();
                }}
                disabled={false}
                clearable={false}
                searchable={false}/>

            <PanelFormItem
                label="Path to Sound"
                type="File"
                value={settings.soundpath}
                filter={[{name: "Sound", extensions: ["mp3", "ogg", "m4a", "flac"]}]}
                onChange={(newPath) => {
                    settings.soundpath = newPath;

                    // Give the user a sample
                    props.plugin.reloadNotificationSound();
                    props.plugin.playNotification();
                }}
                disabled={settings.sound !== "custom"}/>

            <PanelFormItem
                label="Volume"
                type="Slider"
                minValue={0}
                maxValue={100}

                initialValue={props.plugin.settings.volume*100}
                onChange={(x) => {
                    props.plugin.settings.volume = x/100;

                    // Give the user a sample
                    props.plugin.playNotification();
                }}
                onValueRender={(e) => e.toFixed(0) + "%"}
            />

            <PanelFormItem
                label="Trigger on load"
                type="Switch"
                value={!settings.ignoreFirstTime}
                onChange={() => {
                    settings.ignoreFirstTime = !settings.ignoreFirstTime;
                }}
            />

            <PanelFormItem
                label="Launch with tetrio-desktop"
                type="Switch"
                value={settings.launchDesktop}
                onChange={() => {
                    settings.launchDesktop = !settings.launchDesktop;
                }}
            />

            <PanelFormItem
                label="Mute when status set to DND"
                type="Switch"
                value={settings.respectDND}
                onChange={() => {
                    settings.respectDND = !settings.respectDND;
                }}
            />
        </>);
    }

    getSettingsPanel(): HTMLElement {
        return createSettingsPanel(this, <this.SettingsPane plugin={this}/>);
    }

    reloadNotificationSound() {
        const spath = (this.settings.sound == "custom")
            ? this.settings.soundpath
            : path.join(this.assetsPath, this.defaultSounds[this.settings.sound].filename);

        if (!fs.existsSync(spath)) {
            this.notificationSound = undefined;
            return; // Don't try to load it since it doesn't exist
        }

        this.notificationSound = convertToDataURL({
            data: fs.readFileSync(spath), mimeType: "audio/" + path.extname(spath).replace(".", "")
        });
    }

    isStatusDND() {
        const SettingsModule = BdApi.findModuleByProps("status", "nativePhoneIntegrationEnabled");
        return SettingsModule.status == "dnd";
    }

    lastSound?: HTMLAudioElement;
    playNotification(): Promise<void> {
        if (this.notificationSound) {
            if (this.lastSound) {
                this.lastSound.pause();
            }

            if (this.settings.respectDND && this.isStatusDND()) {
                return Promise.resolve(); // Don't interrupt!!!
            }

            const elm = document.createElement("audio");
            elm.src = this.notificationSound;
            elm.volume = this.settings.volume;
            this.lastSound = elm;
            return elm.play();
        }

        return Promise.reject();
    }

    // React FC for the actual Popup
    LobbyPopup(
        props: {
            plugin: Tetrio
        }
    ) {
        const [shown, setShown] = useState(false);
        const [lobbyWasOff, setLobbyPrev] = useState(true);
        const [closing, setClosing] = useState(false);
        const [url, setUrl] = useState("");
        const [playerCount, setPlayerCount] = useState(0);

        useEffect(
            () => spyglass.removeListener.bind(this, spyglass.registerListener((msg) => {
                if (typeof msg !== "string") return;

                // We recieved an update from spyglass
                const { reporters } = JSON.parse(msg);
                if (reporters.tetrio) {
                    // It has a tetrio update

                    const tetData = reporters.tetrio;
                    if (tetData.users) {
                        if (tetData.users.length > 1 && lobbyWasOff) {
                            if (props.plugin.settings.ignoreFirstTime && url === "") {
                                // We got a lobby on first-load, this means it was already on-going,
                                // and the user doesn't want to see that, don't show the popup
                                setLobbyPrev(false);
                            } else {
                                if (!shown) props.plugin.playNotification();
                                setShown(true);
                                setClosing(false);
                                setLobbyPrev(false);
                            }
                        } else if (tetData.users.length <= 1 && !lobbyWasOff) {
                            setLobbyPrev(true);
                        }

                        setPlayerCount(tetData.users.length - 1); // minus 1 for Warma
                        if ((tetData.users.length - 1) === 0 && shown) {
                            closeMe();
                        }
                    }

                    setUrl(tetData.url);
                }
            })), [lobbyWasOff, url, shown]);

        const closeMe = () => {
            setClosing(true);
            setTimeout(() => setShown(false), 500);
        };

        const openTetrio = () => {
            if (props.plugin.settings.launchDesktop) {
                const roomid = url.match("#(.+)")?.[1];
                if (roomid) window.open(`tetrio://${roomid}`);
                else BdApi.showToast("Spyglass returned invalid room url!", {type: "error"});
            } else {
                window.open(url);
            }
            closeMe();
        };

        const tetrioLogo = useImageAsset(props.plugin, "tetrio.png");

        return (<>{shown && (
            <div className={"TetraBanner" + (closing ? " closing" : "")}>
                <img src={tetrioLogo} onClick={openTetrio} />
                <span className="tet-text" onClick={openTetrio}>
                    A tmpim TETR.IO lobby has started! <br />
                    <span className="join">Click to Join ({playerCount} {playerCount === 1 ? "Player" : "Players"})</span>
                </span>
                <div className="tet-icon" onClick={closeMe}><CloseIcon /></div>
            </div>
        )}</>);
    }
}));
