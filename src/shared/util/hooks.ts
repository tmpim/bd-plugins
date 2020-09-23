import React from "@shared/base/discordreact";
import { assetsPath } from "@shared/base/paths";
import { BdPlugin } from "@type/BdPlugin";
import dataurl from "dataurl";
import fs from "fs";
import path from "path";

export function useImageAsset(plugin: BdPlugin, filename: string) {
    return React.useMemo(() => {
        const ipath = path.join(assetsPath(plugin.getName()), filename);
        return dataurl.convert({
            data: fs.readFileSync(ipath), mimetype: "image/" + path.extname(filename).replace(".", "")
        });
    }, []);
}
