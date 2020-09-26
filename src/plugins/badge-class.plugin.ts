import { CancelPatch } from "@type/BdApi";
import { BdPlugin } from "@type/BdPlugin";
import { mixinUpdater } from "@shared/mixins/updater";
import { mixinChangeLog } from "@shared/mixins/changelog";

export default mixinChangeLog(mixinUpdater(
class BadgeClasses implements BdPlugin {
    static cssID = "MentionDotCSS";

    ChannelItem: any;
    ChannelUtils: {
        getMentionCount(channelId: string): number;
    }

    cancelRenderPatch: CancelPatch;

    getName(): string { return "BadgeClass"; }
    getDescription(): string { return "Adds CSS classes to the channel badges when you have pings."; }
    getVersion(): string { return "0.0.1"; }
    getAuthor(): string { return "Emma"; }

    start(): void {
        this.ChannelUtils = BdApi.findModuleByProps("getUnreadCount", "getMentionCount");
        this.ChannelItem = BdApi.findModuleByDisplayName("ChannelItem");

        BdApi.injectCSS(BadgeClasses.cssID, `
            .da-containerDefault .da-wrapper .da-unread.da-unread-mention {
                background-color: #f04747;
            }
        `);

        this.patchRender();
    }

    stop(): void {
        BdApi.clearCSS(BadgeClasses.cssID);
        this.cancelRenderPatch();
    }

    patchRender() {
        this.cancelRenderPatch = BdApi.monkeyPatch(this.ChannelItem.prototype,
            "renderUnread", { after: (data) => {
                if (data.returnValue) {
                    const channel = (data.thisObject as any).props.channel;
                    if (this.ChannelUtils.getMentionCount(channel.id) > 0) {
                        data.returnValue.props.className += " " + "da-unread-mention";
                    }
                }
            } });
    }
}));
