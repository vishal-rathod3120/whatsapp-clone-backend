import { PrismaService } from '../../prisma/prisma.service';
export declare class ChatsRepository {
    private prisma;
    constructor(prisma: PrismaService);
    findDirectChatBetweenUsers(userId1: string, userId2: string): Promise<({
        members: {
            id: string;
            userId: string;
            chatId: string;
            role: import(".prisma/client").$Enums.ChatMemberRole;
            joinedAt: Date;
            leftAt: Date | null;
            isMuted: boolean;
            lastReadMessageId: string | null;
        }[];
    } & {
        id: string;
        createdAt: Date;
        title: string | null;
        type: import(".prisma/client").$Enums.ChatType;
        avatarUrl: string | null;
        updatedAt: Date;
        createdById: string;
        lastMessageId: string | null;
        lastMessageAt: Date | null;
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
            role: import(".prisma/client").$Enums.ChatMemberRole;
            joinedAt: Date;
            leftAt: Date | null;
            isMuted: boolean;
            lastReadMessageId: string | null;
        })[];
    } & {
        id: string;
        createdAt: Date;
        title: string | null;
        type: import(".prisma/client").$Enums.ChatType;
        avatarUrl: string | null;
        updatedAt: Date;
        createdById: string;
        lastMessageId: string | null;
        lastMessageAt: Date | null;
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
            role: import(".prisma/client").$Enums.ChatMemberRole;
            joinedAt: Date;
            leftAt: Date | null;
            isMuted: boolean;
            lastReadMessageId: string | null;
        })[];
        messages: {
            id: string;
            createdAt: Date;
            type: import(".prisma/client").$Enums.MessageType;
            senderId: string;
            textContent: string | null;
            status: import(".prisma/client").$Enums.MessageStatus;
        }[];
    } & {
        id: string;
        createdAt: Date;
        title: string | null;
        type: import(".prisma/client").$Enums.ChatType;
        avatarUrl: string | null;
        updatedAt: Date;
        createdById: string;
        lastMessageId: string | null;
        lastMessageAt: Date | null;
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
            role: import(".prisma/client").$Enums.ChatMemberRole;
            joinedAt: Date;
            leftAt: Date | null;
            isMuted: boolean;
            lastReadMessageId: string | null;
        })[];
    } & {
        id: string;
        createdAt: Date;
        title: string | null;
        type: import(".prisma/client").$Enums.ChatType;
        avatarUrl: string | null;
        updatedAt: Date;
        createdById: string;
        lastMessageId: string | null;
        lastMessageAt: Date | null;
    }) | null>;
    findChatMember(chatId: string, userId: string): Promise<{
        id: string;
        userId: string;
        chatId: string;
        role: import(".prisma/client").$Enums.ChatMemberRole;
        joinedAt: Date;
        leftAt: Date | null;
        isMuted: boolean;
        lastReadMessageId: string | null;
    } | null>;
    updateLastMessage(chatId: string, messageId: string, lastMessageAt: Date): Promise<{
        id: string;
        createdAt: Date;
        title: string | null;
        type: import(".prisma/client").$Enums.ChatType;
        avatarUrl: string | null;
        updatedAt: Date;
        createdById: string;
        lastMessageId: string | null;
        lastMessageAt: Date | null;
    }>;
    updateLastReadMessage(chatId: string, userId: string, messageId: string): Promise<{
        id: string;
        userId: string;
        chatId: string;
        role: import(".prisma/client").$Enums.ChatMemberRole;
        joinedAt: Date;
        leftAt: Date | null;
        isMuted: boolean;
        lastReadMessageId: string | null;
    }>;
}
