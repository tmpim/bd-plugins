export function clazz(...classNames: (string | null | undefined | false)[]) {
    return classNames.filter(x => x).join(" ");
}
