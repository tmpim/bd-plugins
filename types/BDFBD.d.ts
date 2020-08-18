import { DiscordCSSClass } from "./dc-classes";

// TODO: Very not complete

type RequireOnlyOne<T, Keys extends keyof T = keyof T> =
    Pick<T, Exclude<keyof T, Keys>>
    & {
        [K in Keys]-?:
            Required<Pick<T, K>>
            & Partial<Record<Exclude<Keys, K>, undefined>>
    }[Keys]

type ArgumentTypes<F extends Function> = F extends (...args: infer A) => any ? A : never;

declare global {
    interface Window {
        BDFDB: Partial<typeof BDFDBModule>
    }

    const BDFDB: Partial<typeof BDFDBModule>
}

export interface ContextMenuEvent {
    instance: any;
    methodname: string;
    returnvalue: any;
    type: string;
}

export type SettingDefaults = boolean | number | string | {[p: string]: SettingDefaults};

export interface BDFPlugin {
    name: string;
    started: boolean;
    stopping: boolean;

    defaults: SettingDefaults;
    SettingsUpdated?: boolean;

    initialize(): void;
    initConstructor?(): void;

    onGuildContextMenu?(e: ContextMenuEvent): void;
}

export type TextAlign = "left" | "center" | "right";

export type NoticeType = "PRIMARY" | "DANGER" | "WARNING"
                       | "SUCCESS" | "BRAND"  | "CUSTOM";

export type FormTags = {
    H1: "h1"
    H2: "h2"
    H3: "h3"
    H4: "h4"
    H5: "h5"
    LABEL: "label"
};


type ReactComponent<T> = (props: T) => any;

export namespace BDFDBModule {
    type Plugin = any;

    const loaded: boolean;

    const myPlugins: Record<string, Plugin>;

    const LibraryComponents: {
        // SettingsItem(props: {
        //     type: "Select",

        // }): any;
        SettingsSaveItem(props: {
            type: "TextInput",
            className: string,
            plugin: any,
            keys: string[],
            label: string,
            basis: string,
            childProps: Partial<HTMLInputElement>,
            min?: number,
            max?: number,
            value: string | number
        }): any;

        MenuItems: {
            MenuItem(props: any): any
            MenuCheckboxItem(props: any): any

            MenuGroup(props: any): any
        }

        FormComponents: {
            FormNotice(props: {
                type: NoticeType,
                className: string,
                title?: string,
                body: string,
            }): any;

            FormText(props: {
                className: string,
                tag: FormTags[keyof FormTags],
                children: string,
                align: TextAlign,
            }): any;

            FormTitleTags: FormTags
        }
    }


    const PluginUtils: {
        init(plugin: any): void;
        clear(plugin: any): void;

        createSettingsPanel(plugin: any, items: any[]): HTMLElement;
    };

    const DataUtils: {
        get(plugin: any, key: string): any;
    }

    const ModuleUtils: {
        forceAllUpdates(plugin: any): void;
    }

    const ContextMenuUtils: {
        findItem(
            returnvalue: any, 
            config: RequireOnlyOne<{
                id: string,
                label: string,
                group: boolean
            }, "id" | "label">
        ): [any[], number]

        createItem(component: any, props: object): void
        createItemId(...strings: string[]): string
    }

    const ReactUtils: {
        createElement<P, T extends ReactComponent<P>>(component: T, props: ArgumentTypes<T>[0]): any;
        forceUpdate(component: any): void;
    }

    const disCN: Record<DiscordCSSClass, string>;
}
