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
            chatId: string;
            joinedAt: Date;
            leftAt: Date | null;
            role: import(".prisma/client").$Enums.ChatMemberRole;
            isMuted: boolean;
            lastReadMessageId: string | null;
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
    getChats(query: GetChatsQueryDto, user: JwtPayload): Promise<{
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
            lastReadMessageId: string | null;
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
        avatarUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.ChatType;
        title: string | null;
        createdById: string;
        lastMessageId: string | null;
        lastMessageAt: Date | null;
    }>;
    deleteGroup(chatId: string, user: JwtPayload): Promise<{
        success: boolean;
    }>;
}
