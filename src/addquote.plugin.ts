/**
 * @name AddQuote
 * @authorId 333530784495304705
 */

import { BdPlugin } from "../types/BdPlugin";
import { CancelPatch } from "../types/BdApi";

class AddQuote implements BdPlugin {
    cancelRenderPatch: CancelPatch;
    cancelMenuActionsPatch: CancelPatch;

    Tooltip: any;
    ButtonComponents: {
        Separator: any,
        Button: any
    };
    ButtonClasses: {
        container: string,
        icon: string,
        isHeader: string
    };

    QuoteIcon: any;

    MessageUtils: {
        sendMessage(channelId: string, message: {
            content: string,
            tts: boolean,
            invalidEmojis: Array<any>,
            validNonShortcutEmojis: Array<any>
        }): Promise<any>;
    }

    getName(): string { return "AddQuote"; }
    getDescription(): string { return "Adds an 'Add Quote' button to message action bar."; }
    getVersion(): string { return "0.0.1"; }
    getAuthor(): string { return "Emma"; }

    start(): void {
        this.Tooltip = BdApi.findModuleByDisplayName("Tooltip");
        this.ButtonComponents = BdApi.findModuleByProps("Separator", "Button")
        this.ButtonClasses = BdApi.findModuleByProps("container", "icon", "isHeader");

        // TODO: Find a better way to reference this module
        this.QuoteIcon = BdApi.findModule(x => typeof x === "function" 
            && x.toString().includes("M19.8401 5.39392C20.1229 4.73405"));

        if (!this.QuoteIcon) {
            BdApi.showToast("AddQuote was unable to locate the Quote icon, please bug @Emma to fix this.", 
                { type: "error", timeout: 10000 });

            return;
        }

        this.MessageUtils = BdApi.findModuleByProps("sendMessage");

        this.performHookPatch();
    }

    stop(): void {
        this.cancelRenderPatch();
    }

    performHookPatch() {
        const PanelModule = BdApi.findModuleByProps("useConnectedUtilitiesProps");
        this.cancelRenderPatch = BdApi.monkeyPatch(PanelModule.default, "type", {
            after: (data) => {
                const MenuActionsInstance = data.returnValue.props.children.props.children[1];
                const MenuActions = MenuActionsInstance.type;
                MenuActionsInstance.type = this.performMenuPatch(MenuActions);
            }
        });
    }

    filterProperties(obj: any, props: string[]) {
        if (obj == null) return {};

        const result: any = {};
        const keys = Object.keys(obj);
        for (let i = 0; i < keys.length; i++) {
            const n = keys[i];
            props.indexOf(n) >= 0 || (result[n] = obj[n]);
        }

        return result
    }

    renderIconButton(props: {
        label: string,
        icon: React.ComponentClass<{className: string}> 
            | React.FunctionComponent<{className: string}>,
        channel: any,
        message: any,
        onClick: (channel: any, message: any, e: MouseEvent) => void,
        key?: string,
        disabled: boolean
    } & {[p: string]: any}) {
        const Button = this.ButtonComponents.Button;
        const ButtonClasses = this.ButtonClasses;

        const label = props.label
            , iconComponent = props.icon
            , channelRef = props.channel
            , messageRef = props.message
            , onClick = props.onClick
            , key = props.key
            , disabled = props.disabled
            , passthroughProps = this.filterProperties(props, ["label", "icon", "channel", "message", "onClick", "key", "disabled"]);
        return BdApi.React.createElement(this.Tooltip, {
            text: label,
            hideOnClick: true,
            key: key
        }, (function(props: any) {
            var onMouseEnter = props.onMouseEnter
                , onMouseLeave = props.onMouseLeave
                , btnOnClick = props.onClick;
            return BdApi.React.createElement(Button, Object.assign({
                onMouseEnter: onMouseEnter,
                onMouseLeave: onMouseLeave,
                onClick: function(e: MouseEvent) {
                    null != btnOnClick && btnOnClick(),
                    onClick(channelRef, messageRef, e)
                },
                "aria-label": label,
                disabled: disabled
            }, passthroughProps), BdApi.React.createElement(iconComponent, {
                className: ButtonClasses.icon
            }))
        }
        ));
    }

    overiddenMenuItems: any;
    performMenuPatch(MenuActions: React.FunctionComponent<any>): Function {
        if (this.overiddenMenuItems) return this.overiddenMenuItems;

        const renderIconButton = this.renderIconButton.bind(this);
        const QuoteIcon = this.QuoteIcon;
        const MessageUtils = this.MessageUtils;

        this.overiddenMenuItems = class NewMenu extends BdApi.React.Component {
            render() {
                return BdApi.React.createElement<any>(function(props) {
                    const renderValue = MenuActions(props);
                    const children: any[] = renderValue.props.children;
                    children.splice(children.length - 2, 0, 
                        renderIconButton({
                            channel: props.channel,
                            message: props.message,
                            disabled: false,
                            label: "Add Quote",
                            icon: QuoteIcon,
                            onClick: (channel: any, message: any) => {
                                if (channel.guild_id !== "591488795040546818") {
                                    return BdApi.showToast(
                                        "Can't use addquote in a non tmpim guild", 
                                        { type: "error" }
                                    );
                                }

                                MessageUtils.sendMessage(channel.id, {
                                    content: `!addquote ${message.id}`,
                                    tts: false,
                                    invalidEmojis: new Array(),
                                    validNonShortcutEmojis: new Array()
                                  })
                            }
                        }));

                    return renderValue;
                }, this.props);
            }
        }

        return this.overiddenMenuItems;
    }
}

export = AddQuote;
