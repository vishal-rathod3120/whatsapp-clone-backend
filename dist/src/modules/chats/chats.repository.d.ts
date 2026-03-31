import { PrismaService } from '../../prisma/prisma.service';
export declare class ChatsRepository {
    private prisma;
    constructor(prisma: PrismaService);
    findDirectChatBetweenUsers(userId1: string, userId2: string): Promise<({
        members: {
            id: string;
            userId: string;
            chatId: string;
            joinedAt: Date;
            leftAt: Date | null;
            role: import(".prisma/client").$Enums.ChatMemberRole;
            isMuted: boolean;
            mutedUntil: Date | null;
            isPinned: boolean;
            isArchived: boolean;
            wallpaperUrl: string | null;
            lastReadMessageId: string | null;
        }[];
    } & {
        id: string;
        avatarUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.ChatType;
        title: string | null;
        description: string | null;
        createdById: string;
        communityId: string | null;
        isAnnouncement: boolean;
        lastMessageId: string | null;
        lastMessageAt: Date | null;
        disappearingTimer: number | null;
    }) | null>;
    createDirectChat(userId: string, targetUserId: string): Promise<{
        members: ({
            user: {
                id: string;
                displayName: string;
                avatarUrl: string | null;
            };
        } & {
            id: string;
            userId: string;
            chatId: string;
            joinedAt: Date;
            leftAt: Date | null;
            role: import(".prisma/client").$Enums.ChatMemberRole;
            isMuted: boolean;
            mutedUntil: Date | null;
            isPinned: boolean;
            isArchived: boolean;
            wallpaperUrl: string | null;
            lastReadMessageId: string | null;
        })[];
    } & {
        id: string;
        avatarUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.ChatType;
        title: string | null;
        description: string | null;
        createdById: string;
        communityId: string | null;
        isAnnouncement: boolean;
        lastMessageId: string | null;
        lastMessageAt: Date | null;
        disappearingTimer: number | null;
    }>;
    findChatsByUserId(userId: string, limit: number, cursor?: string): Promise<({
        members: ({
            user: {
                id: string;
                phoneNumber: string | null;
                displayName: string;
                avatarUrl: string | null;
            };
        } & {
            id: string;
            userId: string;
            chatId: string;
            joinedAt: Date;
            leftAt: Date | null;
            role: import(".prisma/client").$Enums.ChatMemberRole;
            isMuted: boolean;
            mutedUntil: Date | null;
            isPinned: boolean;
            isArchived: boolean;
            wallpaperUrl: string | null;
            lastReadMessageId: string | null;
        })[];
        messages: {
            id: string;
            createdAt: Date;
            type: import(".prisma/client").$Enums.MessageType;
            status: import(".prisma/client").$Enums.MessageStatus;
            textContent: string | null;
            senderId: string;
        }[];
    } & {
        id: string;
        avatarUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.ChatType;
        title: string | null;
        description: string | null;
        createdById: string;
        communityId: string | null;
        isAnnouncement: boolean;
        lastMessageId: string | null;
        lastMessageAt: Date | null;
        disappearingTimer: number | null;
    })[]>;
    findChatById(chatId: string): Promise<({
        members: ({
            user: {
                id: string;
                phoneNumber: string | null;
                displayName: string;
                avatarUrl: string | null;
                aboutText: string | null;
            };
        } & {
            id: string;
            userId: string;
            chatId: string;
            joinedAt: Date;
            leftAt: Date | null;
            role: import(".prisma/client").$Enums.ChatMemberRole;
            isMuted: boolean;
            mutedUntil: Date | null;
            isPinned: boolean;
            isArchived: boolean;
            wallpaperUrl: string | null;
            lastReadMessageId: string | null;
        })[];
    } & {
        id: string;
        avatarUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.ChatType;
        title: string | null;
        description: string | null;
        createdById: string;
        communityId: string | null;
        isAnnouncement: boolean;
        lastMessageId: string | null;
        lastMessageAt: Date | null;
        disappearingTimer: number | null;
    }) | null>;
    findChatMember(chatId: string, userId: string): Promise<{
        id: string;
        userId: string;
        chatId: string;
        joinedAt: Date;
        leftAt: Date | null;
        role: import(".prisma/client").$Enums.ChatMemberRole;
        isMuted: boolean;
        mutedUntil: Date | null;
        isPinned: boolean;
        isArchived: boolean;
        wallpaperUrl: string | null;
        lastReadMessageId: string | null;
    } | null>;
    updateLastMessage(chatId: string, messageId: string, lastMessageAt: Date): Promise<{
        id: string;
        avatarUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.ChatType;
        title: string | null;
        description: string | null;
        createdById: string;
        communityId: string | null;
        isAnnouncement: boolean;
        lastMessageId: string | null;
        lastMessageAt: Date | null;
        disappearingTimer: number | null;
    }>;
    updateLastReadMessage(chatId: string, userId: string, messageId: string): Promise<{
        id: string;
        userId: string;
        chatId: string;
        joinedAt: Date;
        leftAt: Date | null;
        role: import(".prisma/client").$Enums.ChatMemberRole;
        isMuted: boolean;
        mutedUntil: Date | null;
        isPinned: boolean;
        isArchived: boolean;
        wallpaperUrl: string | null;
        lastReadMessageId: string | null;
    }>;
}
