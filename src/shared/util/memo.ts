export function memo<T>(fn: () => T): {get: () => T} {
    let executed = false;
    let value: T;
    return {
        get() {
            if (!executed) {
                value = fn();
                executed = true;
            }

            return value;
        }
    }
}
