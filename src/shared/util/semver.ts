// I could use the semver package, but I really don't need all the functionality it provides
// So to keep things short I reimplement what i need here

export class SemVer {
    public major: number;
    public minor: number;
    public revision: number;

    constructor(public str: string) {
        const parts = str.match(/(\d+).(\d+).(\d+)/);
        if (!parts) throw Error("Unable to parse SemVer of `" + str + "`");
        [this.major, this.minor, this.revision] = parts.slice(1).map(n => +n);
    }

    eq(other: SemVer): boolean {
        return (
            this.major    == other.major &&
            this.minor    == other.minor &&
            this.revision == other.revision
        );
    }

    gt(other: SemVer): boolean {
        return (
            this.major    > other.major ||
            this.minor    > other.minor ||
            this.revision > other.revision
        );
    }
}
