import { GuildStore, IconUtils } from "@shared/base/modules";
import { mixinChangeLog } from "@shared/mixins/changelog";
import { mixinUpdater } from "@shared/mixins/updater";
import { flexpatch } from "@shared/patch/flexpatch";
import PatchManager from "@shared/patch/PatchManager";
import { BdPlugin } from "@type/BdPlugin";

export default mixinUpdater(mixinChangeLog(class TmpBanner extends PatchManager implements BdPlugin {
    guildId = "591488795040546818" // Tmpim Guild id
    bannerURL = "https://media.discordapp.net/attachments/743809200664346654/819683395227091004/tmpim_yakuza.jpg"

    getName(): string { return "TmpBanner"; }
    getDescription(): string { return "Puts a server banner in the Tmpim guild"; }
    getVersion(): string { return "0.0.1"; }
    getAuthor(): string { return "Emma"; }

    start(): void {
        this.addPatch(flexpatch(GuildStore, "getGuild", { after: d => {
            if (d.returnValue && d.arguments[0] === this.guildId) {
                (d.returnValue as { banner: string }).banner = this.bannerURL;
            }
        } }));

        this.addPatch(flexpatch(IconUtils, "getGuildBannerURL", { instead: d => {
            return d.arguments[0].id === this.guildId 
                ? d.arguments[0].banner // Inject our own banner
                : d.originalMethod(...d.arguments);
        } }));
    }

    stop(): void {
        super.stop();
    }
}));