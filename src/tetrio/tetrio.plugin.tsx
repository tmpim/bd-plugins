import dataurl from "dataurl";
import fs from "fs";
import mime from "mime-types";
import path from "path";
import { BdPlugin } from "../../types/BdPlugin";
import React from "../shared/discordreact";
import { PanelFormItem } from "../shared/forms";
import { CloseIcon } from "../shared/icons";
import { assetsPath } from "../shared/paths";
import { defineSettings } from "../shared/settings/persistance";
import { createSettingsPanel } from "../shared/settings/settingspanel";
import * as spyglass from "./spyglass";
import styles from "./styles.scss";
import tetriologo from "./tetriologo";
import { useSettings } from "../shared/settings/hook";
const { useState, useEffect } = React;

class Tetrio implements BdPlugin {
    static cssID = "TetrioCSS";
    static assetsPath = assetsPath("Tetrio");

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
    })

    getName(): string { return "Tetrio"; }
    getDescription(): string { return "Pops up a message when tmpim spyglass reports an active tetr.io lobby."; }
    getVersion(): string { return "0.0.1"; }
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
            document.getElementById('tetrio-plgn-container')
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
                onValueRender={(e) => {
                    return e.toFixed(0) + "%"
                }}
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
        </>);
    }

    getSettingsPanel(): HTMLElement {
        return createSettingsPanel(this, <this.SettingsPane plugin={this}/>);
    }

    reloadNotificationSound() {
        const spath = (this.settings.sound == "custom")
            ? this.settings.soundpath
            : path.join(Tetrio.assetsPath, this.defaultSounds[this.settings.sound].filename);

        if (!fs.existsSync(spath)) {
            this.notificationSound = undefined;
            return; // Don't try to load it since it doesn't exist
        }

        const mimetype = mime.lookup(spath);
        if (mimetype) {
            this.notificationSound = dataurl.convert({
                data: fs.readFileSync(spath), mimetype
            });
        } else {
            console.error("Unable to determine MIME type for '" + spath + "', does it exist?");
        }
    }

    lastSound?: HTMLAudioElement;
    playNotification(): Promise<void> {
        if (this.notificationSound) {
            if (this.lastSound) {
                this.lastSound.pause();
            }

            const elm = document.createElement("audio");
            elm.src = this.notificationSound;
            elm.volume = this.settings.volume;
            this.lastSound = elm;
            return elm.play();
        }
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

        useEffect(
            () => spyglass.removeListener.bind(this, spyglass.registerListener((msg) => {
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
                    }

                    setUrl(tetData.url);
                }
            })), [lobbyWasOff, url, shown]);

        const closeMe = () => {
            setClosing(true);
            setTimeout(() => setShown(false), 500);
        }

        const openTetrio = () => {
            if (props.plugin.settings.launchDesktop) {
                window.open(`tetrio://${url.match("#(.+)")[1]}`);
            } else {
                window.open(url);
            }
            closeMe();
        }

        return shown && (
            <div className={"TetraBanner" + (closing ? " closing" : "")}>
                <img src={tetriologo} onClick={openTetrio} />
                <span className="tet-text" onClick={openTetrio}>
                    A tmpim TETR.IO lobby has started! <br />
                    <span className="join">Click to Join</span>
                </span>
                <div className="tet-icon" onClick={closeMe}><CloseIcon /></div>
            </div>
        );
    }
}

export = Tetrio;
