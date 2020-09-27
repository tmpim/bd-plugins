export function clazz(...classNames: (string | null | undefined | false)[]): string {
    return classNames.filter(x => x).join(" ");
}
