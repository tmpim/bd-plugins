import { CancelPatch } from "@type/BdApi";
import { BdPlugin } from "@type/BdPlugin";
import { mixinUpdater } from "@shared/mixins/updater";
import { mixinChangeLog } from "@shared/mixins/changelog";
import PatchManager from "@shared/patch/PatchManager";
import { findDefaultModuleByDisplayName } from "@shared/base/modules";

export default mixinChangeLog(mixinUpdater(class BadgeClasses extends PatchManager implements BdPlugin {
    static cssID = "MentionDotCSS";

    ChannelItem: { default: FC };
    ChannelUtils: {
        getMentionCount(channelId: string): number;
    }

    cancelRenderPatch: CancelPatch;

    getName(): string { return "BadgeClass"; }
    getDescription(): string { return "Adds CSS classes to the channel badges when you have pings."; }
    getVersion(): string { return "0.0.3"; }
    getAuthor(): string { return "Emma"; }

    start(): void {
        this.ChannelUtils = BdApi.findModuleByProps("getUnreadCount", "getMentionCount");
        this.ChannelItem = findDefaultModuleByDisplayName("ChannelItem");

        BdApi.injectCSS(BadgeClasses.cssID, `
            .da-pill .da-item {
                margin-left: 0;
                min-height: 16px;
            }

            .da-containerDefault .da-wrapper .da-unread {
                width: 8px;
                height: 16px;
                margin-top: -8px;
            }

            .da-containerDefault .da-wrapper.da-unread-mention .da-unread {
                background-color: #f04747;
            }
        `);

        this.patchRender();
    }

    stop(): void {
        BdApi.clearCSS(BadgeClasses.cssID);
        this.cancelRenderPatch();

        super.stop();
    }

    patchRender() {
        this.cancelRenderPatch = BdApi.monkeyPatch(this.ChannelItem,
            "default", { after: (data) => {
                if (data.returnValue) {
                    console.log(data.methodArguments);
                    const props = data.methodArguments[0];
                    const channel = props.channel;
                    if (this.ChannelUtils.getMentionCount(channel.id) > 0) {
                        data.returnValue.props.children.props.className += " " + "da-unread-mention";
                    }
                }
            } });
    }
}));
