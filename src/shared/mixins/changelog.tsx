import React from "@shared/base/discordreact";
import { pluginNameToFilename } from "@shared/base/paths";
import { BdPlugin } from "@type/BdPlugin";
import { ChangelogClasses } from "@shared/styles/discordclasses";
import { clazz } from "@shared/styles/utils";
import { ModalStack, Changelog } from "@shared/base/modules";
import { Flex, FormTitle } from "@shared/components/forms";
import { Text } from "@shared/components/text";
import { Markdown } from "@shared/components/discordexports";


const VERSION_TAG = "__installed_version";

type MarkdownText = string;

// Types for the changelog json files
export interface ChangeSet {
    type: "added" | "fixed" | "improved" | "progress" | string;
    content: MarkdownText
}

export interface ChangeLogVersion {
    version: string;
    changes: ChangeSet[];
}

function parseChangelogFromMarkdown(targetVersion: string, markdown: string): ChangeLogVersion | null {
    let content: ChangeSet[] | null = null;
    let activeSet: ChangeSet | null = null;
    for (let line of markdown.split("\n")) {
        line = line.trimLeft();
        if (line.match(/^#[^#]/)) {
            const version = (line.match(/^#(.+)/)?.[1] ?? "").trim();
            if (version == targetVersion) {
                activeSet = {
                    type: "",
                    content: ""
                };

                content = [activeSet];
            } else if (content) {
                return {
                    version: targetVersion,
                    changes: content
                };
            }
        } else if (content && activeSet) {
            if (line.match(/^##[^#]/)) {
                if (activeSet.content.match(/^\s*$/)) content.pop();

                const section = (line.match(/^##(.+)/)?.[1] ?? "").trim();
                activeSet = {
                    type: section,
                    content: ""
                };

                content.push(activeSet);
            } else {
                activeSet.content += line + "\n";
            }
        }
    }

    return content ? {
        version: targetVersion,
        changes: content
    } : null;
}

export function mixinChangeLog<P extends Constructor<BdPlugin>>(plugin: P,
    logRoot = "https://raw.githubusercontent.com/tmpim/bd-plugins/master/changelogs/",
    logFileName?: string
): Constructor<BdPlugin> {
    return class ChangeLoggedPlugin extends plugin {
        private fileName = logFileName || `${pluginNameToFilename(super.getName())}.md`

        start() {
            this.__cl_checkForChanges();
            super.start();
        }

        async __cl_checkForChanges() {
            const installedVersion = BdApi.getData(this.getName(), VERSION_TAG);
            if (installedVersion !== this.getVersion()) {
                const realVersion = this.getVersion();
                if (realVersion === null) return;

                BdApi.saveData(this.getName(), VERSION_TAG, realVersion);

                // Show changelog
                if (installedVersion) {
                    const changelog = await fetch(logRoot + this.fileName);
                    const changeset = parseChangelogFromMarkdown(realVersion, await changelog.text());

                    if (changeset) {
                        this.showChangelogModal(this.getName(), changeset);
                    }
                } else {
                    // First launch
                    // So do nothing
                }
            }
        }

        showChangelogModal(title: string, changelog: ChangeLogVersion, footer?: string) {
            const logItems: JSX[] = [];
            for (const section of changelog.changes) {
                const typeClass = ChangelogClasses[section.type as Exclude<typeof section.type, string>] ?? ChangelogClasses.added;
                if (section.type.length) {
                    logItems.push(
                        <h1 className={clazz(typeClass, ChangelogClasses.marginTop)}>
                            {section.type.toLocaleUpperCase()}
                        </h1>);
                }

                logItems.push(<Markdown>{section.content.trim()}</Markdown>);
            }

            const renderHeader = () => (<Flex.Child grow={1} shrink={1}>
                <FormTitle tag="h4">{title}</FormTitle>
                <Text
                    size={Text.Sizes.SIZE_14}
                    color={Text.Colors.BRAND}
                    className={ChangelogClasses.date}
                >
                    Version {changelog.version}
                </Text>
            </Flex.Child>);

            const renderFooter = footer && (() => <Markdown>{footer}</Markdown>);

            ModalStack.push((props: unknown) =>
                <Changelog
                    className={ChangelogClasses.container}
                    selectable={true}
                    renderHeader={renderHeader}
                    renderFooter={renderFooter}
                    {...props}
                >
                    {logItems}
                </Changelog>);
        }
    };
}
