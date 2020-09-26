export function addCommonCSS(id: string, css: string) {
    const cssid = `commoncss-${id}`;
    BdApi.clearCSS(cssid);

    BdApi.injectCSS(cssid, css);
}
