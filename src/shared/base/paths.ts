import path from "path";
import { BdPlugin } from "@type/BdPlugin";

// Extracted from BdAPI
export let dataPath = "";
if (process.platform === "win32") dataPath = process.env.APPDATA!;
else if (process.platform === "darwin") dataPath = path.join(process.env.HOME!, "Library", "Preferences");
else dataPath = process.env.XDG_CONFIG_HOME ? process.env.XDG_CONFIG_HOME : path.join(process.env.HOME!, ".config");
dataPath = path.join(dataPath, "BetterDiscord");

export const pluginDirectory = path.join(dataPath, "plugins");
export const assetsPath = (plugin: BdPlugin) => path.join(dataPath, "plugins", "assets", plugin.getName().toLowerCase())

export function pluginNameToFilename(name: string) {
    return name
        .split(/[\s-]/).join("")
        .replace(/(?!^)[A-Z]/g, l => "-" + l)
        .toLowerCase();
}
