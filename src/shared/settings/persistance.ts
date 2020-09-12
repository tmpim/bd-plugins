import { TypedProxy } from "../util/typedproxy";
import { BdPlugin } from "../../../types/BdPlugin";

export function defineSettings<T extends Record<string, any>>(plugin: BdPlugin, defaults: T): T {
    const settings = Object.assign({}, defaults);
    for (const setting in defaults) {
        const val = BdApi.loadData(plugin.getName(), setting);

        if (val) {
            settings[setting] = val;
        }
    }

    return new TypedProxy<T, T>(settings, {
        set(target, setting: string, val) {
            BdApi.saveData(plugin.getName(), setting, val);
            (target as Record<string, any>)[setting] = val;

            return true;
        }
    });
}
