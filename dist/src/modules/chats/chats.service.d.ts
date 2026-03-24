import { PrismaService } from '../../prisma/prisma.service';
import { CreateDirectChatDto } from './dto/chat.dto';
import { ChatMemberRole } from '../../common/enums';
export declare class ChatsService {
    private prisma;
    constructor(prisma: PrismaService);
    createDirectChat(userId: string, dto: CreateDirectChatDto): Promise<{
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
    }>;
    createGroupChat(userId: string, dto: {
        title: string;
        memberUserIds: string[];
        avatarUrl?: string;
    }): Promise<{
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
    addGroupMembers(chatId: string, requesterId: string, userIds: string[]): Promise<{
        success: boolean;
        added: number;
    }>;
    removeGroupMember(chatId: string, requesterId: string, targetUserId: string): Promise<{
        success: boolean;
    }>;
    updateMemberRole(chatId: string, requesterId: string, targetUserId: string, newRole: ChatMemberRole): Promise<{
        success: boolean;
    }>;
    updateGroupInfo(chatId: string, requesterId: string, title?: string, avatarUrl?: string): Promise<{
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
