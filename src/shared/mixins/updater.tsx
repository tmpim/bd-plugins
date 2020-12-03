import React from "@shared/base/discordreact";
import { BdPlugin } from "@type/BdPlugin";
import { pluginNameToFilename, pluginDirectory } from "@shared/base/paths";
import { SemVer } from "@shared/util/semver";
import { NoticeClasses, LayerClasses, NoticePlatformClasses } from "@shared/styles/discordclasses";
import { clazz } from "@shared/styles/utils";
import { writeFile as writeFileCallback } from "fs";
import * as path from "path";
import { promisify } from "util";
import { TmpimLogo } from "@shared/components/icons";
import { LayerModule } from "@shared/base/modules";
import { Tooltip } from "@shared/components/discordexports";
import styles from "./updater.scss";
import { addCommonCSS } from "@shared/styles/commonstyles";
const { useEffect } = React;

const updaterCSSID = "TLib-Update-Mixin";
const writeFile = promisify(writeFileCallback);

export function mixinUpdater<P extends Constructor<BdPlugin>>(plugin: P,
    versionRoot = "https://bd.its-em.ma/"
): Constructor<BdPlugin> {
    return class UpdaterPlugin extends plugin {
        static BannerID = "tlib-update-banner";
        private get __mount() {
            return document.getElementsByClassName(LayerClasses.layers)[0];
        }

        private __specializer = pluginNameToFilename(this.getName());
        private __upbanner?: HTMLElement;

        private checkInterval: NodeJS.Timeout;

        start() {
            addCommonCSS(updaterCSSID, styles);

            this.__checkForUpdates();
            // Check again every couple hours
            this.checkInterval = setInterval(
                () => this.__checkForUpdates(),
                2 * 60 * 60 * 1000
            );

            super.start();
        }

        stop() {
            clearInterval(this.checkInterval);
            this.__removeUpdateBanner();
            super.stop();
        }

        async __checkForUpdates() {
            const req = await fetch(versionRoot + "versions/" + this.__specializer);
            const latestVersion = new SemVer(await req.text());
            const currentVersion = new SemVer(this.getVersion());

            if (latestVersion.gt(currentVersion)) {
                // Show update banner

                this.__showUpdateBanner();
            }
        }

        __observer?: MutationObserver;
        __showUpdateBanner() {
            if (document.getElementById(UpdaterPlugin.BannerID)) {
                // Someone else is already updating, wait for them...
                if (!this.__observer) {
                    this.__observer = new MutationObserver((records) => {
                        for (const record of records) {
                            for (const node of record.removedNodes) {
                                if (node instanceof HTMLElement && node.id == UpdaterPlugin.BannerID) {
                                    this.__showUpdateBanner();
                                    return;
                                }
                            }
                        }
                    });
                    this.__observer.observe(this.__mount.parentElement!, {childList: true});
                }
            } else {
                this.__removeUpdateBanner();

                this.__upbanner = document.createElement("div");
                this.__upbanner.id = UpdaterPlugin.BannerID;
                this.__mount.parentElement!.insertBefore(this.__upbanner, this.__mount);

                BdApi.ReactDOM.render(<LayerModule.AppLayerProvider>
                    <this.UpdateBanner plugin={this}/>
                    <LayerModule.AppLayerContainer/>
                </LayerModule.AppLayerProvider>, this.__upbanner);
            }
        }

        __removeUpdateBanner() {
            this.__observer?.disconnect();
            this.__observer = undefined;

            if (this.__upbanner) {
                this.__upbanner.parentElement!.removeChild(this.__upbanner);
                this.__upbanner = undefined;
            }
        }

        async __performUpdate() {
            this.__removeUpdateBanner();

            try {
                const req = await fetch(versionRoot + "plugins/" + this.__specializer + ".plugin.js");
                const pluginData = await req.text();
                if (req.status !== 200) throw pluginData;

                // Stop the rest of the plugin before continuing
                super.stop();

                await writeFile(path.join(pluginDirectory, pluginNameToFilename(this.getName()) + ".plugin.js"), pluginData);

                const versionStr = pluginData.match(/getVersion[^a-zA-Z]+?(?:return)?\s*(['"][0-9]+\.[0-9]+\.[0-9]+['"])/);
                if (versionStr) {
                    const newVersion = versionStr[1].slice(1, -1);
                    BdApi.showToast(`Updated ${this.getName()} from v${this.getVersion()} to v${newVersion}`, { type: "info" });
                } else {
                    BdApi.showToast(`Updated ${this.getName()}`, { type: "error" });
                }
            } catch (e) {
                console.error(e);

                BdApi.showToast(`Error occurred updating ${this.getName()}, check console`, { type: "error" });
            }
        }

        UpdateBanner(this: unknown, props: {plugin: UpdaterPlugin}) {
            const { plugin } = props;

            let tooltipProps: {
                onMouseEnter: () => void;
                onMouseLeave: () => void;
                onClick: () => void;
            };
            useEffect(() => (setTimeout(() => {
                tooltipProps?.onMouseEnter();
            }), undefined), []);

            return (
                <div className="tlib-up-container">
                    <div
                        className={clazz(NoticeClasses.notice, NoticeClasses.colorInfo, "tlib-up-notice")}
                    >
                        <i className={NoticePlatformClasses.platformIcon}><TmpimLogo/></i>
                        An update is available for &nbsp;
                        <Tooltip
                            position="bottom"
                            text="Click to update!"
                            color="black"
                            hideOnClick={true}
                        >
                            {(props) => {
                                tooltipProps = props;

                                return <strong {...props}
                                    className="tlib-up-pluginname"
                                    onClick={() => (props.onClick(), plugin.__performUpdate())}
                                >
                                    {plugin.getName()}
                                </strong>;
                            }}
                        </Tooltip>!
                    </div>
                    <button className={NoticeClasses.closeButton} style={{zIndex: 102}}
                        onClick={plugin.__removeUpdateBanner.bind(plugin)}/>
                </div>
            );
        }
    };
}
