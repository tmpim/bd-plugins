/**
 * @name AddQuote
 * @authorId 333530784495304705
 */

import { BdPlugin } from "../types/BdPlugin";
import { CancelPatch } from "../types/BdApi";
import { Discord } from "../types/DiscordTypes";

class AddQuote implements BdPlugin {
    cancelRenderPatch: CancelPatch;

    TextBoxModule: any;
    nativeTextBox: React.ComponentClass;

    RichDocumentModule: {
        deserialize(s: string): any;
    };

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
    };

    MessageStore: {
        getMessages(channelId: string): {
            get(messageId: string): Discord.Message | null;

            // Gets the message immediately after the supplied msg, if it exists
            getAfter(messageId: string): Discord.Message | null;

            last(): Discord.Message | null;

            toArray(): Discord.Message[];
        }
    };

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
        this.MessageStore = BdApi.findModuleByProps("getMessage", "getMessages");
        this.RichDocumentModule = BdApi.findModuleByProps("deserialize", "serialize");

        this.performHookPatch();
        this.injectCSS();
    }

    stop(): void {
        this.TextBoxModule.default = this.nativeTextBox;
        this.cancelRenderPatch();
        this.cleanupCSS();
    }

    currentTextBox: any;
    performHookPatch() {
        const PanelModule = BdApi.findModuleByProps("useConnectedUtilitiesProps");
        this.cancelRenderPatch = BdApi.monkeyPatch(PanelModule.default, "type", {
            after: (data) => {
                const MenuActionsInstance = data.returnValue.props.children.props.children[1];
                const MenuActions = MenuActionsInstance.type;
                MenuActionsInstance.type = this.performMenuPatch(MenuActions);
            }
        });

        this.TextBoxModule = BdApi.findModule(x => x && x.default && x.default.displayName === "ChannelEditorContainer");
        this.nativeTextBox = this.TextBoxModule.default;

        const self = this;
        const nTB = this.nativeTextBox as any;
        this.TextBoxModule.default = class ProxyTextBox extends nTB {
            constructor(props: any) {
                super(props);
                
                this.originalHandleTabOrEnter = this.handleTabOrEnter;
                this.handleTabOrEnter = this.handleTabOrEnterOverride.bind(this);
            }

            render() {
                self.currentTextBox = this;

                const channel = this.props.channel;
                if (this.props.textValue.startsWith("!addquote")
                &&  channel.guild_id === "591488795040546818") {
                    self.parseRange(channel.id, this.props.textValue);
                } else {
                    const channel = this.props.channel.id;
                    if (self.selectedMessages[channel]) {
                        self.selectedMessages[channel] = null;
                        self.clearClasses();        
                    }
                }

                return super.render();
            }

            handleTabOrEnterOverride() {
                const channel = this.props.channel.id;
                self.selectedMessages[channel] = null;
                self.clearClasses();

                return this.originalHandleTabOrEnter(arguments);
            }
        }
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

    sortSnowflakes(...snowflakes: string[]) {
        return snowflakes
            .map(BigInt)
            .sort((a, b) => Number(a - b))
            .map(String);
    }

    getMessagesFromRange(channelId: string): Discord.Message[] {
        const range = this.selectedMessages[channelId];
        if (!range) return;

        const channel = this.MessageStore.getMessages(channelId);
        const messages: Discord.Message[] = [];

        const [begin, end] = this.sortSnowflakes(range.first, range.second);

        let tempMsg = channel.get(begin);
        while (true) {
            if (!tempMsg) break;

            messages.push(tempMsg);
            if (tempMsg.id === end) break;

            tempMsg = channel.getAfter(tempMsg.id);
        }

        return messages;
    }

    renderSelectedMessages(messages: Discord.Message[]) {
        // First clear out the old selection
        this.clearClasses();

        messages.sort((a, b) => Number(BigInt(a.id) - BigInt(b.id)));

        // Now add the class to all the new messages
        let lastNode: HTMLElement;
        for (const message of messages) {
            const messageNode = document.getElementById("chat-messages-" + message.id);
            if (messageNode instanceof HTMLElement) {
                messageNode.classList.add("addquote-selected");

                if (messageNode.classList.contains("da-groupStart") || !lastNode) {
                    lastNode?.classList.add("addquote-endGroup");
                    messageNode.classList.add("addquote-startGroup");
                }

                lastNode = messageNode;
            }
        }

        lastNode?.classList.add("addquote-endGroup");
    }

    static RANGE_RE = /^!addquote (\d{4,})(\+\d+)?$/;
    static REL_RANGE_RE = /^!(?:addquote |addquote)(?:\~(\d+))?(\+\d+)?$/;
    parseRange(channel: string, text: string) {
        const fail = () => {
            this.selectedMessages[channel] = null;
            this.clearClasses();
        }

        let snowflake, length;

        const messages = this.MessageStore.getMessages(channel);

        let matchResult = AddQuote.RANGE_RE.exec(text);
        if (matchResult) {
            [, snowflake, length] = matchResult;
        } else {
            matchResult = AddQuote.REL_RANGE_RE.exec(text);
            if (matchResult) {
                let relative;
                [, relative, length] = matchResult;
                if (length && !relative) {
                    length = +length - 1;
                }

                const cached = messages.toArray();
                const msg = cached[cached.length - +(relative || "1") - +(length || "0")];
                if (msg) {
                    snowflake = msg.id;
                } else {
                    return fail();
                }
            } else {
                return fail();
            }
        }

        let firstMessage = messages.get(snowflake);
        if (!firstMessage) {
            this.selectedMessages[channel] = null;
            this.clearClasses();
            return;
        };

        let endMessage = firstMessage;
        if (length) {
            for (let i = 0; i < +length; i++) {
                const nextMsg = messages.getAfter(endMessage.id);
                if (nextMsg) endMessage = nextMsg;
                else break;
            }
        }

        const currentRange = this.selectedMessages[channel];
        if (currentRange) {
            if (currentRange.first === snowflake) {
                this.selectedMessages[channel] = {
                    first: snowflake,
                    second: endMessage.id
                };
            } else {
                this.selectedMessages[channel] = {
                    first: endMessage.id,
                    second: snowflake
                };
            }
        } else {
            this.selectedMessages[channel] = {
                first: snowflake,
                second: endMessage.id
            };
        }

        const messageRange = this.getMessagesFromRange(channel);
        this.renderSelectedMessages(messageRange);
    }

    formatRange(rangeSize: number, range: { first: string, second: string }) {
        const [beginMsg] = this.sortSnowflakes(range.first, range.second);
        if (rangeSize === 1) {
            return beginMsg;
        } else {
            return `${beginMsg}+${rangeSize - 1}`;
        }
    }

    proccessAddQuote(channel: Discord.Channel, message: Discord.Message) {
        if (channel.guild_id !== "591488795040546818") {
            return BdApi.showToast(
                "Can't use addquote in a non tmpim guild", 
                { type: "error" }
            );
        }

        let newRange: AddQuote["selectedMessages"][keyof AddQuote["selectedMessages"]];
        if (!this.selectedMessages[channel.id]) {
            this.selectedMessages[channel.id] = newRange = {
                first: message.id,
                second: message.id
            }
        } else {
            newRange = this.selectedMessages[channel.id];
            newRange.first = newRange.second;
            newRange.second = message.id;
        }

        const messageRange = this.getMessagesFromRange(channel.id);
        this.renderSelectedMessages(messageRange);

        const currentTextBox = this.currentTextBox;
        if (currentTextBox) {
            const quoteRange = this.formatRange(messageRange.length, newRange);
            const quoteText = "!addquote " + quoteRange;

            const editor = currentTextBox.ref.current.editorRef;
            editor.moveToRangeOfDocument().insertText(quoteText);
            currentTextBox.focus();
        }
    }

    // Record of channel id -> message range
    selectedMessages: Record<string, { first: string, second: string }> = {};

    overiddenMenuItems: any;
    performMenuPatch(MenuActions: React.FunctionComponent<any>): Function {
        if (this.overiddenMenuItems) return this.overiddenMenuItems;
        const self = this;

        this.overiddenMenuItems = class NewMenu extends BdApi.React.Component {
            render() {
                return BdApi.React.createElement<any>(function(props) {
                    const renderValue = MenuActions(props);
                    const children: any[] = renderValue.props.children;
                    children.splice(children.length - 2, 0, 
                        self.renderIconButton({
                            channel: props.channel,
                            message: props.message,
                            disabled: false,
                            label: "Add Quote",
                            icon: self.QuoteIcon,
                            onClick: self.proccessAddQuote.bind(self)
                        }));

                    return renderValue;
                }, this.props);
            }
        }

        return this.overiddenMenuItems;
    }

    cssNode: string = "pluginAddQuoteCSS"
    injectCSS() {
        // .da-cozyMessage
        BdApi.injectCSS(this.cssNode, `
            .addquote-selected {
                background: rgba(250, 166, 26, 0.3) !important;
            }

            .addquote-selected:hover {
                background: rgba(250, 166, 26, 0.3) !important;
            }

            .addquote-startGroup.da-cozy {
                border-radius: 12px 12px 0 0;
            }

            .addquote-endGroup.da-cozy {
                border-radius: 0 0 12px 12px;
            }

            .addquote-startGroup.addquote-endGroup.da-cozy {
                border-radius: 12px;
            }
        `);
    }

    cleanupCSS() {
        this.clearClasses();
        BdApi.clearCSS(this.cssNode);
    }

    clearClasses() {
        const oldSelection = document.getElementsByClassName("addquote-selected");

        // Because HTMLCollections update themselves as you iterate
        const collection = [];
        for (const x of oldSelection) collection.push(x);

        for (const message of collection) {
            if (message instanceof HTMLElement) {
                message.classList.remove("addquote-selected");
                message.classList.remove("addquote-startGroup")
                message.classList.remove("addquote-endGroup")
            }
        }
    }
}

export = AddQuote;
