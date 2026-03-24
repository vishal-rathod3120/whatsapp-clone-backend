import { PrismaService } from '../../prisma/prisma.service';
import { CreateDirectChatDto } from './dto/chat.dto';
export declare class ChatsService {
    private prisma;
    constructor(prisma: PrismaService);
    createDirectChat(userId: string, dto: CreateDirectChatDto): Promise<{
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
        createdAt: Date;
        updatedAt: Date;
    }>;
    getChatList(userId: string, limit?: number, cursor?: string): Promise<{
        items: {
            id: string;
            type: import(".prisma/client").$Enums.ChatType;
            title: string | null | undefined;
            avatarUrl: string | null | undefined;
            lastMessage: {
                id: string;
                type: import(".prisma/client").$Enums.MessageType;
                createdAt: Date;
                senderId: string;
                textContent: string | null;
                status: import(".prisma/client").$Enums.MessageStatus;
            };
            unreadCount: number;
            lastMessageAt: Date | null;
            members: {
                userId: string;
                displayName: string;
                avatarUrl: string | null;
            }[];
        }[];
        nextCursor: string | null;
    }>;
    getChatById(chatId: string, userId: string): Promise<{
        id: string;
        type: import(".prisma/client").$Enums.ChatType;
        title: string | null | undefined;
        avatarUrl: string | null | undefined;
        members: {
            userId: string;
            displayName: string;
            avatarUrl: string | null;
            role: import(".prisma/client").$Enums.ChatMemberRole;
        }[];
    }>;
    markChatAsRead(chatId: string, userId: string, lastReadMessageId?: string): Promise<{
        success: boolean;
    }>;
    isChatMember(chatId: string, userId: string): Promise<boolean>;
    getOtherMemberId(chatId: string, userId: string): Promise<string | null>;
    isChatMuted(chatId: string, userId: string): Promise<boolean>;
    getMutualContactIds(userId: string): Promise<string[]>;
}
