import { ChannelStore, MessageStore, UserStore, VoiceState } from "@shared/base/modules";
import { assetsPath } from "@shared/base/paths";
import { mixinChangeLog } from "@shared/mixins/changelog";
import { mixinUpdater } from "@shared/mixins/updater";
import PatchManager from "@shared/patch/PatchManager";
import { defineSettings } from "@shared/settings/persistance";
import { BdPlugin } from "@type/BdPlugin";
import { Discord } from "@type/DiscordTypes";
import React from "@shared/base/discordreact";
import path from "path";
import fs from "fs";
import dataurl from "dataurl";
import { useSettings } from "@shared/settings/hook";
import { PanelFormItem } from "@shared/components/forms";
import { createSettingsPanel } from "@shared/settings/settingspanel";

const MStore = MessageStore as unknown as {
    _dispatcher : { _subscriptions: {
        MESSAGE_CREATE: Set<unknown>
    } }
};

export default mixinUpdater(mixinChangeLog(class VoiceChat extends PatchManager implements BdPlugin {
    assetsPath = assetsPath(this);

    notificationSound?: string; // Data URL for the notification sound

    defaultSounds: Record<string, {name: string, filename: string}> = {
        teamspeak: {name: "TeamSpeak", filename: "ts_ping.wav"},
        aim_ping : {name: "AIM Ping",  filename: "aim.wav"},
    }

    get soundOptions() {
        const base = Object.entries(this.defaultSounds).map(([key, {name}]) => ({ label: name, value: key }));
        base.push({label: "Custom", value: "custom"});
        return base;
    }

    settings = defineSettings(this, {
        sound: "teamspeak", // Which sound to use
        soundpath: "", // Filepath for custom sounds
        volume: 0.8, // The volume to play notifications at
        filterbots: true, // Don't play pings from bots
    })

    getName(): string { return "VoiceChat"; }
    getDescription(): string { return "Plays a sound when someone sends a message in #voice-chat channels while you are in VC."; }
    getVersion(): string { return "0.0.1"; }
    getAuthor(): string { return "Emma"; }

    start(): void {
        this.reloadNotificationSound();
        MStore._dispatcher._subscriptions.MESSAGE_CREATE.add(this.handleMessageRef);
    }
    
    stop(): void {
        MStore._dispatcher._subscriptions.MESSAGE_CREATE.delete(this.handleMessageRef);

        super.stop();
    }

    SettingsPane(props: {plugin: VoiceChat}) {
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
                filter={[{name: "Sound", extensions: ["mp3", "ogg", "m4a", "flac", "wav"]}]}
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

                initialValue={settings.volume*100}
                onChange={(x) => {
                    settings.volume = x/100;

                    // Give the user a sample
                    props.plugin.playNotification();
                }}
                onValueRender={(e) => e.toFixed(0) + "%"}
            />

            <PanelFormItem
                label="Filter Bots"
                type="Switch"

                value={settings.filterbots}
                onChange={(x) => {
                    settings.filterbots = x;
                }}
            />
        </>);
    }

    getSettingsPanel(): HTMLElement {
        return createSettingsPanel(this, <this.SettingsPane plugin={this}/>);
    }

    private handleMessageRef = this.handleMessage.bind(this);
    handleMessage(update: {
        channelId: string
        message: Discord.Message
    }): void {
        const message = update.message;
        const user = UserStore.getCurrentUser();

        // Filter out bots if the settings is turned on.
        if (message.author.bot && this.settings.filterbots) return;

        if (VoiceState.isCurrentClientInVoiceChannel()) {
            const vcState = VoiceState.getVoiceStateForUser(user.id);
            if (!vcState) return;

            const voiceChannelId = vcState.channelId;
            const voiceChannel = ChannelStore.getChannel(voiceChannelId);
            const guildId = voiceChannel.guild_id;
            if (message.guild_id === guildId) {
                const textChannel = ChannelStore.getChannel(message.channel_id);
                if (/voice|text|no.*mic/i.test(textChannel.name)
                || voiceChannel.name.includes(textChannel.name)
                || textChannel.name.includes(voiceChannel.name)) {
                    this.playNotification();
                }
            }
        }
    }

    reloadNotificationSound() {
        const spath = (this.settings.sound == "custom")
            ? this.settings.soundpath
            : path.join(this.assetsPath, this.defaultSounds[this.settings.sound].filename);

        if (!fs.existsSync(spath)) {
            console.warn("Could not find notification sound at ", spath);
            this.notificationSound = undefined;
            return; // Don't try to load it since it doesn't exist
        }

        this.notificationSound = dataurl.convert({
            data: fs.readFileSync(spath), mimetype: "audio/" + path.extname(spath).replace(".", "")
        });
    }

    playNotification(): Promise<void> {
        if (this.notificationSound) {
            const elm = document.createElement("audio");
            elm.src = this.notificationSound;
            elm.volume = this.settings.volume;
            return elm.play();
        }

        return Promise.reject();
    }
}));
