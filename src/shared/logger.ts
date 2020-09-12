export function log(str: string, name?: string) {
    console.log(`%c[${typeof name == "string" && name || "LibTD"}]`, "color: #3a71c1; font-weight: 700;", (typeof str == "string" && str || "").trim());
}

export function warn(str: string, name?: string) {
    console.warn(`%c[${typeof name == "string" && name || "LibTD"}]`, "color: #3a71c1; font-weight: 700;", (typeof str == "string" && str || "").trim());
}

export function error(str: string, name?: string) {
    console.error(`%c[${typeof name == "string" && name || "LibTD"}]`, "color: #3a71c1; font-weight: 700;", "Fatal Error: " + (typeof str == "string" && str || "").trim());
}
