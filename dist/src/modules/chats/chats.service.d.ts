import { PrismaService } from '../../prisma/prisma.service';
import { CreateDirectChatDto } from './dto/chat.dto';
import { ChatMemberRole } from '../../common/enums';
import { MediaService } from '../media/media.service';
export declare class ChatsService {
    private prisma;
    private mediaService;
    constructor(prisma: PrismaService, mediaService: MediaService);
    createDirectChat(userId: string, dto: CreateDirectChatDto): Promise<{
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
                status: import(".prisma/client").$Enums.MessageStatus;
                textContent: string | null;
                senderId: string;
            };
            unreadCount: number;
            lastMessageAt: Date | null;
            isPinned: boolean;
            isMuted: boolean;
            mutedUntil: Date | null;
            wallpaperUrl: string | null;
            members: {
                userId: string;
                displayName: string;
                avatarUrl: string | null;
                role: import(".prisma/client").$Enums.ChatMemberRole;
                phoneNumber: string | null;
                aboutText: string | null;
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
            phoneNumber: string | null;
            aboutText: string | null;
        }[];
    }>;
    markChatAsRead(chatId: string, userId: string, lastReadMessageId?: string): Promise<{
        success: boolean;
    }>;
    isChatMember(chatId: string, userId: string): Promise<boolean>;
    getChatAndMember(chatId: string, userId: string): Promise<{
        chat: ({
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
        }) | null;
        member: {
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
        } | undefined;
    }>;
    getOtherMemberId(chatId: string, userId: string): Promise<string | null>;
    isChatMuted(chatId: string, userId: string): Promise<boolean>;
    getMutualContactIds(userId: string): Promise<string[]>;
    deleteGroup(chatId: string, userId: string): Promise<{
        success: boolean;
    }>;
    updateDisappearingTimer(chatId: string, requesterId: string, timer: number | null): Promise<{
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
    togglePin(chatId: string, userId: string, isPinned: boolean): Promise<{
        success: boolean;
        isPinned: boolean;
    }>;
    updateMute(chatId: string, userId: string, isMuted: boolean, mutedUntil?: Date | null): Promise<{
        success: boolean;
        isMuted: boolean;
        mutedUntil: Date | null | undefined;
    }>;
    updateWallpaper(chatId: string, userId: string, wallpaperUrl: string | null): Promise<{
        success: boolean;
        wallpaperUrl: string | null;
    }>;
    archiveChat(chatId: string, userId: string): Promise<{
        success: boolean;
    }>;
    unarchiveChat(chatId: string, userId: string): Promise<{
        success: boolean;
    }>;
    exportChat(chatId: string, userId: string, format?: 'json' | 'txt'): Promise<{
        filename: string;
        content: string;
        mimeType: string;
    }>;
}
