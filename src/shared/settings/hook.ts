import React from "@shared/base/discordreact";
import { TypedProxy } from "@shared/util/typedproxy";
import { BdPlugin } from "@type/BdPlugin";

export function useSettings<T extends object>(plugin: BdPlugin & {settings: T}): T {
    const hooks: {[k in keyof T]: [T[k], React.Dispatch<React.SetStateAction<T[k]>>]} = {} as any;
    for (const setting in plugin.settings) {
        hooks[setting] = React.useState(plugin.settings[setting]);
    }

    return new TypedProxy<T, T>(plugin.settings, {
        get(_target, setting: keyof T) {
            return hooks[setting][0]
        },

        set(target, setting: keyof T, val) {
            hooks[setting][1](val);
            target[setting] = val

            return true;
        }
    });
}
