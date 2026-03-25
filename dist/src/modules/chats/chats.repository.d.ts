import { PrismaService } from '../../prisma/prisma.service';
export declare class ChatsRepository {
    private prisma;
    constructor(prisma: PrismaService);
    findDirectChatBetweenUsers(userId1: string, userId2: string): Promise<({
        members: {
            id: string;
            role: import(".prisma/client").$Enums.ChatMemberRole;
            joinedAt: Date;
            leftAt: Date | null;
            isMuted: boolean;
            lastReadMessageId: string | null;
            userId: string;
            chatId: string;
        }[];
    } & {
        id: string;
        avatarUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.ChatType;
        title: string | null;
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
            role: import(".prisma/client").$Enums.ChatMemberRole;
            joinedAt: Date;
            leftAt: Date | null;
            isMuted: boolean;
            lastReadMessageId: string | null;
            userId: string;
            chatId: string;
        })[];
    } & {
        id: string;
        avatarUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.ChatType;
        title: string | null;
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
            role: import(".prisma/client").$Enums.ChatMemberRole;
            joinedAt: Date;
            leftAt: Date | null;
            isMuted: boolean;
            lastReadMessageId: string | null;
            userId: string;
            chatId: string;
        })[];
        messages: {
            id: string;
            createdAt: Date;
            type: import(".prisma/client").$Enums.MessageType;
            textContent: string | null;
            status: import(".prisma/client").$Enums.MessageStatus;
            senderId: string;
        }[];
    } & {
        id: string;
        avatarUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.ChatType;
        title: string | null;
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
            role: import(".prisma/client").$Enums.ChatMemberRole;
            joinedAt: Date;
            leftAt: Date | null;
            isMuted: boolean;
            lastReadMessageId: string | null;
            userId: string;
            chatId: string;
        })[];
    } & {
        id: string;
        avatarUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.ChatType;
        title: string | null;
        createdById: string;
        lastMessageId: string | null;
        lastMessageAt: Date | null;
    }) | null>;
    findChatMember(chatId: string, userId: string): Promise<{
        id: string;
        role: import(".prisma/client").$Enums.ChatMemberRole;
        joinedAt: Date;
        leftAt: Date | null;
        isMuted: boolean;
        lastReadMessageId: string | null;
        userId: string;
        chatId: string;
    } | null>;
    updateLastMessage(chatId: string, messageId: string, lastMessageAt: Date): Promise<{
        id: string;
        avatarUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.ChatType;
        title: string | null;
        createdById: string;
        lastMessageId: string | null;
        lastMessageAt: Date | null;
    }>;
    updateLastReadMessage(chatId: string, userId: string, messageId: string): Promise<{
        id: string;
        role: import(".prisma/client").$Enums.ChatMemberRole;
        joinedAt: Date;
        leftAt: Date | null;
        isMuted: boolean;
        lastReadMessageId: string | null;
        userId: string;
        chatId: string;
    }>;
}
