export function clazz(...classNames: string[]) {
    return classNames.filter(x => x).join(" ");
}
