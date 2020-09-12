import dataurl from "dataurl";
import fs from "fs";
import path from "path";
import { BdPlugin } from "../../types/BdPlugin";
import React from "./discordreact";
import { assetsPath } from "./paths";

export function useImageAsset(plugin: BdPlugin, filename: string) {
    return React.useMemo(() => {
        const ipath = path.join(assetsPath(plugin.getName()), filename);
        return dataurl.convert({
            data: fs.readFileSync(ipath), mimetype: "image/" + path.extname(filename).replace(".", "")
        });
    }, []);
}
