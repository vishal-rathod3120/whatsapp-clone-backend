import { PrismaService } from '../../prisma/prisma.service';
import { CreateDirectChatDto } from './dto/chat.dto';
export declare class ChatsService {
    private prisma;
    constructor(prisma: PrismaService);
    createDirectChat(userId: string, dto: CreateDirectChatDto): Promise<{
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
    }>;
    getChatList(userId: string, limit?: number, cursor?: string): Promise<{
        items: {
            id: string;
            type: import(".prisma/client").$Enums.ChatType;
            title: string | null | undefined;
            avatarUrl: string | null | undefined;
            lastMessage: {
                id: string;
                createdAt: Date;
                type: import(".prisma/client").$Enums.MessageType;
                textContent: string | null;
                status: import(".prisma/client").$Enums.MessageStatus;
                senderId: string;
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
}
