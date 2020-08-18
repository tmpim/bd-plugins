/**
 * @name BadgeClasses
 * @authorId 333530784495304705
 */

import { BdPlugin } from "../types/BdPlugin";
import { CancelPatch } from "../types/BdApi";

class BadgeClasses implements BdPlugin {
    static cssID = "MentionDotCSS";

    ChannelItem: any;
    ChannelUtils: {
        getMentionCount(channelId: string): number;
    }

    cancelRenderPatch: CancelPatch;

    getName(): string { return "BadgeClasses"; }
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
}

export = BadgeClasses;
