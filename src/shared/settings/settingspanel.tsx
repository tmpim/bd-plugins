import React from "@shared/base/discordreact";
import { Flex, FormDivider, FormTitle } from "@shared/components/forms";
import { addCommonCSS } from "@shared/styles/commonstyles";
import { BdPlugin } from "@type/BdPlugin";
import styles from "./settingspanel.scss";
import { Margins } from "@shared/styles/discordclasses";

export function createSettingsPanel(plugin: BdPlugin, children: React.ReactNode) {
    addCommonCSS("settings-panel", styles);

    const container = document.createElement("div");
    container.className = `${plugin.getName()}-settings tlib-settingspanel`;


    BdApi.ReactDOM.render(
        <DCContextProvider>
            <SettingsPanel title={plugin.getName()}>
                {children}
            </SettingsPanel>
        </DCContextProvider>
    , container);

    return container;
}

export const DCContextProvider: React.FC = (props) => {
    const Theme = React.useMemo(() => BdApi.findModule((x) => x && x.default && (x.default._currentValue === "dark" || x.default._currentValue === "light")).default, []);
    const SettingsModule = React.useMemo(() => BdApi.findModuleByProps("theme", "renderSpoilers"), []);

    const Layer = React.useMemo(() => BdApi.findModule(x => x && x.AppLayerProvider), []);

    return (
        <Layer.AppLayerProvider>
            <Theme.Provider value={SettingsModule.theme}>
                {props.children}
            </Theme.Provider>
            <Layer.AppLayerContainer/>
        </Layer.AppLayerProvider>
    );
}

export const SettingsPanel: React.FC<{
    title: string
}> = (props) => {
    return (
        <Flex direction={Flex.Direction.VERTICAL} grow={1}>
            <Flex align={Flex.Align.CENTER}>
                <FormTitle className="tlib-title" tag={"h2"}>{props.title}</FormTitle>
            </Flex>
            <FormDivider className={`${Margins.marginBottom8} ${Margins.marginTop4}`}/>
            <Flex className={`tlib-settingsinner`} direction={Flex.Direction.VERTICAL} grow={1}>
                {props.children}
            </Flex>
        </Flex>
    );
}
