export function addCommonCSS(id: string, css: string): void {
    const cssid = `commoncss-${id}`;
    BdApi.clearCSS(cssid);

    BdApi.injectCSS(cssid, css);
}
