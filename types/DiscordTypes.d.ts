export namespace Discord {
    export interface Message {
        id: string;
        type: number;
        channel_id: string;
        author: Author;
        colorString: string;
        nick?: null;
        content: string;
        attachments?: (null)[] | null;
        embeds?: (null)[] | null;
        mentions?: (null)[] | null;
        mentionRoles?: (null)[] | null;
        mentionChannels?: (null)[] | null;
        mentioned: boolean;
        pinned: boolean;
        mentionEveryone: boolean;
        tts: boolean;
        codedLinks?: (null)[] | null;
        giftCodes?: (null)[] | null;
        timestamp: string;
        editedTimestamp?: null;
        state: string;
        nonce: string;
        blocked: boolean;
        call?: null;
        bot: boolean;
        webhookId?: null;
        reactions?: (null)[] | null;
        application?: null;
        activity?: null;
        messageReference?: null;
        flags: number;
        isSearchHit: boolean;
    }

    export interface Author {
        id: string;
        username: string;
        usernameNormalized: string;
        discriminator: string;
        avatar: string;
        email?: null;
        verified: boolean;
        bot: boolean;
        system: boolean;
        mfaEnabled: boolean;
        mobile: boolean;
        desktop: boolean;
        flags: number;
        publicFlags: number;
        phone?: null;
    }

    export interface Guild {
        afkChannelId: string | null
        afkTimeout: number
        description: string | null
        id: string
        joinedAt: Date
        maxMembers: number
        maxVideoChannelUsers: number
        mfaLevel: number
        name: string
        ownerId: string
        roles: unknown
        systemChannelId: string
    }

    export interface Channel {
        id: string;
        type: number;
        name: string;
        topic: string;
        position: number;
        guild_id: string;
        guild: Guild;
        recipients?: (null)[] | null;
        rawRecipients?: (null)[] | null;
        permissionOverwrites: PermissionOverwrites;
        bitrate: number;
        userLimit: number;
        ownerId?: null;
        icon?: null;
        application_id?: null;
        nicks: Nicks;
        nsfw: boolean;
        parent_id: string;
        memberListId?: null;
        rateLimitPerUser: number;
        originChannelId?: null;
        lastMessageId?: null;
        lastPinTimestamp?: null;
    }

      export type PermissionOverwrites =
        {[p: string]: {id: string, type: number, allow: number, deny: number}};


      export type Nicks = unknown;
}
