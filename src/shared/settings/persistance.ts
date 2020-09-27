import { TypedProxy } from "@shared/util/typedproxy";
import { BdPlugin } from "@type/BdPlugin";

export function defineSettings<T extends Record<string, unknown>>(plugin: BdPlugin, defaults: T): T {
    const settings = Object.assign({}, defaults);
    for (const setting in defaults) {
        const val = BdApi.loadData(plugin.getName(), setting);

        if (val !== undefined) {
            settings[setting] = val;
        }
    }

    return new TypedProxy<T, T>(settings, {
        set(target, setting: string, val) {
            BdApi.saveData(plugin.getName(), setting, val);
            (target as Record<string, unknown>)[setting] = val;

            return true;
        }
    });
}
