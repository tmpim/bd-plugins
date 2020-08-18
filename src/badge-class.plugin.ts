/**
 * @name BadgeClasses
 * @authorId 333530784495304705
 */

import { BdPlugin } from "../types/BdPlugin";

class BadgeClasses implements BdPlugin {
    static cssID = "MentionDotCSS";

    getName(): string { return "BadgeClasses"; }
    getDescription(): string { return "Adds CSS classes to the channel badges when you have pings."; }
    getVersion(): string { return "0.0.1"; }
    getAuthor(): string { return "Emma"; }

    start(): void {
        BdApi.injectCSS(BadgeClasses.cssID, `
            .da-containerDefault .da-wrapper .da-unread.da-unread-mention {
                background-color: #f04747;
            }
        `);
    }

    stop(): void {
        BdApi.clearCSS(BadgeClasses.cssID);
    }

    observer?(changes: MutationRecord): void {
        const badge = changes.addedNodes?.[0];
        if (badge instanceof HTMLElement) {
            if (badge.classList.contains("da-mentionsBadge")) {
                badge.parentElement.parentElement.parentElement
                    .querySelector(".da-unread")
                    ?.classList.add("da-unread-mention")
            }
        }
    }
}

export = BadgeClasses;
