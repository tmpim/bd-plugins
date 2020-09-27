type ExcludeProps<T, P> = { [K in Exclude<keyof T, P>]: T[K]};
export function objectWithoutProperties<T>(obj: T, keys: (keyof T)[]): ExcludeProps<T, keyof T> {
    const target: Partial<T> = {};
    for (const i in obj) {
        if (keys.indexOf(i as keyof T) >= 0) continue;
        if (!Object.prototype.hasOwnProperty.call(obj, i)) continue;
        target[i] = obj[i];
    }

    return target as ExcludeProps<T, keyof T>;
}

export function extractProperties<T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
    return keys.reduce((acc, k) => (acc[k] = obj[k], acc), {} as Partial<T>) as Pick<T, K>;
}
