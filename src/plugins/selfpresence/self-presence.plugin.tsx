import React from "@shared/base/discordreact";
import { UserStore } from "@shared/base/modules";
import { Popout, UserPopout } from "@shared/components/discordexports";
import { mixinChangeLog } from "@shared/mixins/changelog";
import { mixinUpdater } from "@shared/mixins/updater";
import { flexpatch } from "@shared/patch/flexpatch";
import PatchManager from "@shared/patch/PatchManager";
import { ChatClasses } from "@shared/styles/discordclasses";
import { clazz } from "@shared/styles/utils";
import { BdPlugin } from "@type/BdPlugin";
import { Discord } from "@type/DiscordTypes";
import styles from "./styles.scss";

export default mixinUpdater(mixinChangeLog(class SelfPresence extends PatchManager implements BdPlugin {
    private static CSSID = "SelfPresenceCSS";

    getName(): string { return "SelfPresence"; }
    getDescription(): string { return "Adds a button to channel headers to see your rich presence data."; }
    getVersion(): string { return "0.0.3"; }
    getAuthor(): string { return "Emma"; }

    start(): void {
        BdApi.injectCSS(SelfPresence.CSSID, styles);

        const hbar = BdApi.findModuleByProps("Divider", "Icon", "default");
        this.addPatch(flexpatch(hbar, "default", {
            after: (data) => {
                if (data.returnValue) {
                    const {channel, guild} = data.arguments[0].children?.[1]?.props ?? {};
                    if (!channel || !guild) return;

                    this.injectIntoBar(data.returnValue, channel, guild);
                }
            }
        }));
    }

    injectIntoBar(el: UnsafeAny, channel: Discord.Channel, guild: Discord.Guild) {
        const Presence: FC = () => {
            const renderPopout = (props: unknown) => {
                return <UserPopout {...props}
                    userId={UserStore.getCurrentUser().id}
                    guildId={guild.id}
                    channelId={channel.id}/>;
            };

            return (<Popout
                renderPopout={renderPopout}
                position="bottom"
                align="center"
                spacing={20}
            >
                {
                    (props) =>
                        <div className="sp-avatar-button" {...props}>
                            <img src={UserStore.getCurrentUser().avatarURL}
                                className={clazz(ChatClasses.avatar, ChatClasses.clickable)}/>
                        </div>
                }
            </Popout>);
        };

        const actions: React.ReactNode[] = el.props.children[1]?.props.children.props?.children[0];
        if (actions) {
            actions.unshift(<Presence/>);
        }
    }

    stop(): void {
        BdApi.clearCSS(SelfPresence.CSSID);
        super.stop();
    }
}));
