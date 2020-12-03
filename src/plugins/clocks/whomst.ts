export interface Whomst {
    [k: string]: {
        name: string;
        joinedTmpim?: string;
        timezone?: string;
        discord?: string[];
        github?: number[];
        games?: {
            minecraft?: (
                | string
                | {
                    id: string;
                    username: string;
                    alt?: boolean;
                    [k: string]: unknown;
                }
            )[];
            steam?: string;
            osu?:
            | number
            | {
                id?: number;
                username?: string;
                [k: string]: unknown;
            };
            tetrio?: {
                id: string;
                username: string;
                alt?: boolean;
                [k: string]: unknown;
            }[];
            genshin?: number[];
            vrchat?: string[];
            [k: string]: unknown;
        };
        social?: {
            twitter?: (
                | string
                | {
                    id: string;
                    username: string;
                    [k: string]: unknown;
                }
            )[];
            reddit?: string[];
            keybase?: string[];
            anilist?: (
                | number
                | {
                    id: number;
                    username: string;
                    [k: string]: unknown;
                }
            )[];
            myanimelist?: string[];
            [k: string]: unknown;
        };
        [k: string]: unknown;
    };
}
