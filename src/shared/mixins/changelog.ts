import { pluginNameToFilename } from "@shared/base/paths";
import { BdPlugin } from "@type/BdPlugin";
import coerce from "semver/functions/coerce";


const VERSION_TAG = "__installed_version";

// Types for the changelog json files
export type ChangeSet = string[][];

export interface ChangeLog {
    welcome?: {
        description?: string[]
    }

    versions: {
        version: string
        added?: ChangeSet
        removed?: ChangeSet
        fixed?: ChangeSet
        changed?: ChangeSet
    }[]
}


export function mixinChangeLog<P extends Constructor<BdPlugin>>(plugin: P,
    logRoot = "https://raw.githubusercontent.com/tmpim/bd-plugins/master/changelogs/",
    logFileName?: string
) {
    return class ChangeLoggedPlugin extends plugin {
        private fileName = logFileName || `${pluginNameToFilename(super.getName())}.json`

        constructor(...args: any[]) {
            super(...args);
        }

        start() {
            this.__cl_checkForChanges();
            super.start();
        }

        __cl_checkForChanges() {
            const installedVersion = BdApi.getData(this.getName(), VERSION_TAG);
            if (installedVersion !== this.getVersion()) {
                const realVersion = coerce(this.getVersion());
                BdApi.saveData(this.getName(), VERSION_TAG, realVersion);

                // Show changelog

            }
        }
    }
}
