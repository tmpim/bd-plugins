import path from "path";

// Extracted from BdAPI
export let dataPath = "";
if (process.platform === "win32") dataPath = process.env.APPDATA;
else if (process.platform === "darwin") dataPath = path.join(process.env.HOME, "Library", "Preferences");
else dataPath = process.env.XDG_CONFIG_HOME ? process.env.XDG_CONFIG_HOME : path.join(process.env.HOME, ".config");
dataPath = path.join(dataPath, "BetterDiscord");

export const assetsPath = (pluginname: string) => path.join(dataPath, "plugins", "assets", pluginname.toLowerCase())
