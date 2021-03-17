import React from "@shared/base/discordreact";
import { assetsPath } from "@shared/base/paths";
import { BdPlugin } from "@type/BdPlugin";
import fs from "fs";
import path from "path";
import { convertToDataURL } from "./dataurl";

export function useImageAsset(plugin: BdPlugin, filename: string): string {
    return React.useMemo(() => {
        const ipath = path.join(assetsPath(plugin), filename);
        return convertToDataURL({
            data: fs.readFileSync(ipath), mimeType: "image/" + path.extname(filename).replace(".", "")
        });
    }, []);
}
