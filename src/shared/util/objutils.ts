export function objectWithoutProperties<T>(obj: T, keys: string[]) {
    const target: Partial<T> = {};
    for (var i in obj) {
        if (keys.indexOf(i) >= 0) continue;
        if (!Object.prototype.hasOwnProperty.call(obj, i)) continue;
        target[i] = obj[i];
    }

    return target;
}

export function extractProperties<T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
    return keys.reduce((acc, k) => (acc[k] = obj[k], acc), {} as any);
}
