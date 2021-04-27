/* eslint-disable @typescript-eslint/no-explicit-any */
import { findDefaultModuleByDisplayName } from "@shared/base/modules";
import { mixinChangeLog } from "@shared/mixins/changelog";
import { mixinUpdater } from "@shared/mixins/updater";
import { flexpatch } from "@shared/patch/flexpatch";
import PatchManager from "@shared/patch/PatchManager";
import { BdPlugin } from "@type/BdPlugin";
import { Editor, Value } from "slate";

export default mixinChangeLog(mixinUpdater(class Smol extends PatchManager implements BdPlugin {
    getName(): string { return "Smol"; }
    getDescription(): string { return "Allows generation of ˢᵐᵃˡˡᵗᵉˣᵗ by surrounding text in ^{}"; }
    getVersion(): string { return "0.0.1"; }
    getAuthor(): string { return "Emma"; }

    start() {
        this.patchTextbox();
    }

    stop() {
        super.stop();
    }

    patchCache = new Map()
    patchTextbox() {
        const textarea = findDefaultModuleByDisplayName("SlateChannelTextArea");

        this.addPatch(flexpatch(textarea.default.prototype, "render", {
            before: (data) => {
                const ctx = data.thisValue as { handleKeyDown(e: React.KeyboardEvent, editor: Editor, finish: () => void): void };

                if (this.patchCache.get(ctx) !== ctx.handleKeyDown) {
                    const o = ctx.handleKeyDown;
                    ctx.handleKeyDown = (e, editor, finish) => {
                        if (e.key === "}") {
                            this.handleKeyDown(e, editor);
                        }

                        o.call(ctx, e, editor, finish);
                    };

                    if (!this.patchCache.has(ctx)) {
                        this.patchCache.set(ctx, ctx.handleKeyDown);
                    }
                }
            }
        }));
    }

    changeText(editor: Editor, _e: React.KeyboardEvent, matches: { before: RegExpMatchArray }) {
        const alphabet: Record<string, string> = {
            "0":"⁰","1":"¹","2":"²","3":"³","4":"⁴","5":"⁵","6":"⁶","7":"⁷","8":"⁸","9":"⁹",

            "a":"ᵃ","b":"ᵇ","c":"ᶜ","d":"ᵈ","e":"ᵉ","f":"ᶠ","g":"ᵍ","h":"ʰ","i":"ᶦ","j":"ʲ","k":"ᵏ","l":"ˡ","m":"ᵐ",
            "n":"ⁿ","o":"ᵒ","p":"ᵖ","q":"ᵠ","r":"ʳ","s":"ˢ","t":"ᵗ","u":"ᵘ","v":"ᵛ","w":"ʷ","x":"ˣ","y":"ʸ","z":"ᶻ",

            "A":"ᴬ","B":"ᴮ","C":"ᶜ","D":"ᴰ","E":"ᴱ","F":"ᶠ","G":"ᴳ","H":"ᴴ","I":"ᴵ","J":"ᴶ","K":"ᴷ","L":"ᴸ","M":"ᴹ",
            "N":"ᴺ","O":"ᴼ","P":"ᴾ","Q":"ᵠ","R":"ᴿ","S":"ˢ","T":"ᵀ","U":"ᵁ","V":"ⱽ","W":"ᵂ","X":"ˣ","Y":"ʸ","Z":"ᶻ",
            
            "+":"⁺","-":"⁻","=":"⁼","(":"⁽",")":"⁾", "?":"ˀ", "!":"ᵎ"
        };

        editor.insertText(matches.before[1].slice(2).replace(/./g, c => alphabet[c] ?? c));
    }

    opts = {
        before: /(\^{.+)/
    }

    handleKeyDown(event: React.KeyboardEvent, editor: Editor) {
        const { value } = editor;
        const { selection } = value;
        console.log("ON ", value.startText.text);
        if (selection.isExpanded) return;

        const { startBlock } = value;
        if (!startBlock) return;
    
        const matches = this.getMatches(this.opts, value);
        if (!matches) return;
    
        event.preventDefault();

        const { start } = selection;
        let startOffset = start.offset;
        let totalRemoved = 0;
        const offsets = this.getOffsets(matches, startOffset);

        console.log(offsets);

        offsets.forEach(offset => {
            editor
                .moveAnchorTo(offset.start)
                .moveFocusTo(offset.end)
                .delete();
            totalRemoved += offset.total;
        });

        startOffset -= totalRemoved;
        editor.moveTo(startOffset);
        editor.command(this.changeText.bind(this), event, matches);
    }

    getMatches(opts: {
        before?: string | RegExp
        after?: string | RegExp
    }, value: Value) {
        const { selection, startText } = value;
        const { start } = selection;
        const { text } = startText;
        let after = null;
        let before = null;

        if (opts.after) {
            const string = text.slice(start.offset);
            after = string.match(opts.after);
        }

        if (opts.before) {
            const string = text.slice(0, start.offset);
            before = string.match(opts.before);
        }

        // If both sides, require that both are matched, otherwise null.
        if (opts.before && opts.after && !before) return null;
        if (opts.before && opts.after && !after) return null;

        // Return null unless we have a match.
        if (!before && !after) return null;

        if (after) after[0] = after[0].replace(/\s+$/, "");
        if (before) before[0] = before[0].replace(/^\s+/, "");

        return { before, after };
    }

    getOffsets(matches: {
        before: RegExpMatchArray | null
        after: RegExpMatchArray | null
    }, start: number) {
        const { before, after } = matches;
        const offsets: {
            start: number
            end: number
            total: number
        }[] = [];
        let totalRemoved = 0;

        if (before) {
            const match = before[0];
            let startOffset = 0;
            let matchIndex = 0;

            before.slice(1, before.length).forEach(current => {
                if (current === undefined) return;

                matchIndex = match.indexOf(current, matchIndex);
                startOffset = start - totalRemoved + matchIndex - match.length;

                offsets.push({
                    start: startOffset,
                    end: startOffset + current.length,
                    total: current.length,
                });

                totalRemoved += current.length;
                matchIndex += current.length;
            });
        }

        if (after) {
            const match = after[0];
            let startOffset = 0;
            let matchIndex = 0;

            after.slice(1, after.length).forEach(current => {
                if (current === undefined) return;

                matchIndex = match.indexOf(current, matchIndex);
                startOffset = start - totalRemoved + matchIndex;

                offsets.push({
                    start: startOffset,
                    end: startOffset + current.length,
                    total: 0,
                });

                totalRemoved += current.length;
                matchIndex += current.length;
            });
        }

        return offsets;
    }

}));