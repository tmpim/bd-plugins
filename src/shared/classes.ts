import * as DiscordClasses from "./discordclasses";
import * as logger from "./logger";
import { getSettings, settingsIds } from "./bdsettings";
import { removeDuplicates } from "./util/arrayutils";
import { TypedProxy } from "./util/typedproxy";

const classList: Record<string, string[]> = DiscordClasses.classList;
const classModules: Record<string, Record<string, string>> = DiscordClasses.classModules;

export const undefinedClass = "tlib-undefined"

export function getDiscordClass(item: string, selector: boolean) {
    let className = undefinedClass;
    if (classList[item] === undefined) {
        logger.warn(item + " not found in DiscordClasses");
        return className;
    }
    else if (!Array.isArray(classList[item]) || classList[item].length != 2) {
        logger.warn(item + " is not an Array of Length 2 in DiscordClasses");
        return className;
    }
    else if (classModules[classList[item][0]] === undefined) {
        logger.warn(classList[item][0] + " not found in DiscordClassModules");
        return className;
    }
    else if (classModules[classList[item][0]][classList[item][1]] === undefined) {
        logger.warn(classList[item][1] + " not found in " + classList[item][0] + " in DiscordClassModules");
        return className;
    }
    else {
        className = classModules[classList[item][0]][classList[item][1]];
        if (selector) {
            className = className.split(" ").filter(n => n.indexOf("da-") != 0).join(selector ? "." : " ");
            className = className || undefinedClass;
        }
        else {
            if (getSettings(settingsIds.normalizedClasses)) className = className.split(" ").filter(n => n.indexOf("da-") != 0).map(n => n.replace(/^([A-z0-9]+?)-([A-z0-9_-]{6})$/g, "$1-$2 da-$1")).join(" ");
        }
        return removeDuplicates(className.split(" ")).join(" ");
    }
};

export const discordClassNames: { [k in keyof typeof DiscordClasses.classList]: string } = new TypedProxy(DiscordClasses.classList, {
    get(_target, item: string) {
        return getDiscordClass(item, false);
    }
});
