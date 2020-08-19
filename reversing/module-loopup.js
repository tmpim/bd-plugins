function lookupModuleByNumber(n) {
    let found = [];
    webpackJsonp.forEach(([,source]) => {
        if (source instanceof Array) {
            if (source[n]) {
                found.push(source[n]);
            }
        }
    });

    if (found.length > 1) return found;
    return found[0];
}
