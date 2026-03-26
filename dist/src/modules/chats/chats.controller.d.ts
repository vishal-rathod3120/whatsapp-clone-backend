import { ChatsService } from './chats.service';
import { CreateDirectChatDto, MarkChatReadDto, GetChatsQueryDto, CreateGroupChatDto, AddMembersDto, UpdateMemberRoleDto, UpdateGroupDto } from './dto/chat.dto';
import { JwtPayload } from '../auth/types/jwt-payload.type';
export declare class ChatsController {
    private chatsService;
    constructor(chatsService: ChatsService);
    createDirectChat(dto: CreateDirectChatDto, user: JwtPayload): Promise<{
        members: {
            id: string;
            userId: string;
            role: import(".prisma/client").$Enums.ChatMemberRole;
            joinedAt: Date;
            leftAt: Date | null;
            isMuted: boolean;
            mutedUntil: Date | null;
            isPinned: boolean;
            wallpaperUrl: string | null;
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
    }>;
    getChats(query: GetChatsQueryDto, user: JwtPayload): Promise<{
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
    getChatById(chatId: string, user: JwtPayload): Promise<{
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
    markChatAsRead(chatId: string, dto: MarkChatReadDto, user: JwtPayload): Promise<{
        success: boolean;
    }>;
    createGroupChat(dto: CreateGroupChatDto, user: JwtPayload): Promise<{
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
            mutedUntil: Date | null;
            isPinned: boolean;
            wallpaperUrl: string | null;
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
    addGroupMembers(chatId: string, dto: AddMembersDto, user: JwtPayload): Promise<{
        success: boolean;
        added: number;
    }>;
    removeGroupMember(chatId: string, targetUserId: string, user: JwtPayload): Promise<{
        success: boolean;
    }>;
    updateMemberRole(chatId: string, targetUserId: string, dto: UpdateMemberRoleDto, user: JwtPayload): Promise<{
        success: boolean;
    }>;
    updateGroupInfo(chatId: string, dto: UpdateGroupDto, user: JwtPayload): Promise<{
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
    deleteGroup(chatId: string, user: JwtPayload): Promise<{
        success: boolean;
    }>;
    updateDisappearingTimer(chatId: string, body: {
        timer: number | null;
    }, user: JwtPayload): Promise<{
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
    togglePin(chatId: string, body: {
        isPinned: boolean;
    }, user: JwtPayload): Promise<{
        success: boolean;
        isPinned: boolean;
    }>;
    updateMute(chatId: string, body: {
        isMuted: boolean;
        mutedUntil?: string;
    }, user: JwtPayload): Promise<{
        success: boolean;
        isMuted: boolean;
        mutedUntil: Date | null | undefined;
    }>;
    updateWallpaper(chatId: string, body: {
        wallpaperUrl: string | null;
    }, user: JwtPayload): Promise<{
        success: boolean;
        wallpaperUrl: string | null;
    }>;
}
