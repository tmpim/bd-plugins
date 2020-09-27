export const logger = {
    log(str: string, name?: string): void {
        console.log(`%c[${typeof name == "string" && name || "LibTD"}]`, "color: #3a71c1; font-weight: 700;", (typeof str == "string" && str || "").trim());
    },

    warn(str: string, name?: string): void {
        console.warn(`%c[${typeof name == "string" && name || "LibTD"}]`, "color: #3a71c1; font-weight: 700;", (typeof str == "string" && str || "").trim());
    },

    error(str: string, name?: string): void {
        console.error(`%c[${typeof name == "string" && name || "LibTD"}]`, "color: #3a71c1; font-weight: 700;", "Fatal Error: " + (typeof str == "string" && str || "").trim());
    }
};
