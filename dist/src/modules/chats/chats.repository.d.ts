import { PrismaService } from '../../prisma/prisma.service';
export declare class ChatsRepository {
    private prisma;
    constructor(prisma: PrismaService);
    findDirectChatBetweenUsers(userId1: string, userId2: string): Promise<({
        members: {
            id: string;
            userId: string;
            role: import(".prisma/client").$Enums.ChatMemberRole;
            joinedAt: Date;
            leftAt: Date | null;
            isMuted: boolean;
            lastReadMessageId: string | null;
            chatId: string;
        }[];
    } & {
        id: string;
        type: import(".prisma/client").$Enums.ChatType;
        title: string | null;
        avatarUrl: string | null;
        createdById: string;
        lastMessageId: string | null;
        lastMessageAt: Date | null;
        disappearingTimer: number | null;
        createdAt: Date;
        updatedAt: Date;
    }) | null>;
    createDirectChat(userId: string, targetUserId: string): Promise<{
        members: ({
            user: {
                id: string;
                avatarUrl: string | null;
                displayName: string;
            };
        } & {
            id: string;
            userId: string;
            role: import(".prisma/client").$Enums.ChatMemberRole;
            joinedAt: Date;
            leftAt: Date | null;
            isMuted: boolean;
            lastReadMessageId: string | null;
            chatId: string;
        })[];
    } & {
        id: string;
        type: import(".prisma/client").$Enums.ChatType;
        title: string | null;
        avatarUrl: string | null;
        createdById: string;
        lastMessageId: string | null;
        lastMessageAt: Date | null;
        disappearingTimer: number | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findChatsByUserId(userId: string, limit: number, cursor?: string): Promise<({
        members: ({
            user: {
                id: string;
                avatarUrl: string | null;
                phoneNumber: string | null;
                displayName: string;
            };
        } & {
            id: string;
            userId: string;
            role: import(".prisma/client").$Enums.ChatMemberRole;
            joinedAt: Date;
            leftAt: Date | null;
            isMuted: boolean;
            lastReadMessageId: string | null;
            chatId: string;
        })[];
        messages: {
            id: string;
            type: import(".prisma/client").$Enums.MessageType;
            createdAt: Date;
            senderId: string;
            textContent: string | null;
            status: import(".prisma/client").$Enums.MessageStatus;
        }[];
    } & {
        id: string;
        type: import(".prisma/client").$Enums.ChatType;
        title: string | null;
        avatarUrl: string | null;
        createdById: string;
        lastMessageId: string | null;
        lastMessageAt: Date | null;
        disappearingTimer: number | null;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    findChatById(chatId: string): Promise<({
        members: ({
            user: {
                id: string;
                avatarUrl: string | null;
                phoneNumber: string | null;
                displayName: string;
                aboutText: string | null;
            };
        } & {
            id: string;
            userId: string;
            role: import(".prisma/client").$Enums.ChatMemberRole;
            joinedAt: Date;
            leftAt: Date | null;
            isMuted: boolean;
            lastReadMessageId: string | null;
            chatId: string;
        })[];
    } & {
        id: string;
        type: import(".prisma/client").$Enums.ChatType;
        title: string | null;
        avatarUrl: string | null;
        createdById: string;
        lastMessageId: string | null;
        lastMessageAt: Date | null;
        disappearingTimer: number | null;
        createdAt: Date;
        updatedAt: Date;
    }) | null>;
    findChatMember(chatId: string, userId: string): Promise<{
        id: string;
        userId: string;
        role: import(".prisma/client").$Enums.ChatMemberRole;
        joinedAt: Date;
        leftAt: Date | null;
        isMuted: boolean;
        lastReadMessageId: string | null;
        chatId: string;
    } | null>;
    updateLastMessage(chatId: string, messageId: string, lastMessageAt: Date): Promise<{
        id: string;
        type: import(".prisma/client").$Enums.ChatType;
        title: string | null;
        avatarUrl: string | null;
        createdById: string;
        lastMessageId: string | null;
        lastMessageAt: Date | null;
        disappearingTimer: number | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateLastReadMessage(chatId: string, userId: string, messageId: string): Promise<{
        id: string;
        userId: string;
        role: import(".prisma/client").$Enums.ChatMemberRole;
        joinedAt: Date;
        leftAt: Date | null;
        isMuted: boolean;
        lastReadMessageId: string | null;
        chatId: string;
    }>;
}
