import { MessagesService } from './messages.service';
import { SearchService } from './search.service';
import { GetMessagesQueryDto, SendMessageDto, EditMessageDto, ScheduleMessageDto } from './dto/message.dto';
import { SearchMessagesDto } from './dto/search-messages.dto';
import { JwtPayload } from '../auth/types/jwt-payload.type';
export declare class MessagesController {
    private messagesService;
    private searchService;
    constructor(messagesService: MessagesService, searchService: SearchService);
    getLinkPreview(url: string): Promise<any>;
    getMessages(chatId: string, query: GetMessagesQueryDto, user: JwtPayload): Promise<{
        items: ({
            attachment: {
                id: string;
                createdAt: Date;
                uploaderId: string;
                storageKey: string;
                originalName: string | null;
                mimeType: string;
                sizeBytes: bigint;
                width: number | null;
                height: number | null;
                durationSeconds: number | null;
                thumbnailKey: string | null;
                transcript: string | null;
            } | null;
            sender: {
                id: string;
                displayName: string;
                avatarUrl: string | null;
            };
            replyToMessage: {
                id: string;
                type: import(".prisma/client").$Enums.MessageType;
                textContent: string | null;
                sender: {
                    displayName: string;
                };
                senderId: string;
            } | null;
            receipts: {
                userId: string;
                deliveredAt: Date | null;
                seenAt: Date | null;
            }[];
        } & {
            status: import(".prisma/client").$Enums.MessageStatus;
            id: string;
            clientTempId: string | null;
            type: import(".prisma/client").$Enums.MessageType;
            textContent: string | null;
            isDeleted: boolean;
            isPinned: boolean;
            pinnedAt: Date | null;
            pinnedBy: string | null;
            isEncrypted: boolean;
            encryptionType: string | null;
            createdAt: Date;
            editedAt: Date | null;
            expiresAt: Date | null;
            chatId: string;
            senderId: string;
            replyToMessageId: string | null;
            attachmentId: string | null;
        })[];
        nextCursor: string | null;
    }>;
    sendMessage(chatId: string, dto: SendMessageDto, user: JwtPayload): Promise<{
        status: import(".prisma/client").$Enums.MessageStatus;
        id: string;
        clientTempId: string | null;
        type: import(".prisma/client").$Enums.MessageType;
        textContent: string | null;
        isDeleted: boolean;
        isPinned: boolean;
        pinnedAt: Date | null;
        pinnedBy: string | null;
        isEncrypted: boolean;
        encryptionType: string | null;
        createdAt: Date;
        editedAt: Date | null;
        expiresAt: Date | null;
        chatId: string;
        senderId: string;
        replyToMessageId: string | null;
        attachmentId: string | null;
    }>;
    deleteMessage(chatId: string, messageId: string, forEveryone: string, user: JwtPayload): Promise<{
        success: boolean;
        type: string;
    }>;
    editMessage(chatId: string, messageId: string, dto: EditMessageDto, user: JwtPayload): Promise<{
        status: import(".prisma/client").$Enums.MessageStatus;
        id: string;
        clientTempId: string | null;
        type: import(".prisma/client").$Enums.MessageType;
        textContent: string | null;
        isDeleted: boolean;
        isPinned: boolean;
        pinnedAt: Date | null;
        pinnedBy: string | null;
        isEncrypted: boolean;
        encryptionType: string | null;
        createdAt: Date;
        editedAt: Date | null;
        expiresAt: Date | null;
        chatId: string;
        senderId: string;
        replyToMessageId: string | null;
        attachmentId: string | null;
    }>;
    starMessage(chatId: string, messageId: string, user: JwtPayload): Promise<{
        success: boolean;
    }>;
    unstarMessage(chatId: string, messageId: string, user: JwtPayload): Promise<{
        success: boolean;
    }>;
    getStarredMessages(user: JwtPayload): Promise<{
        chatId: string;
        chatType: import(".prisma/client").$Enums.ChatType;
        chatTitle: string | null;
        chatAvatar: string | null;
        starredAt: Date;
        chat: {
            id: string;
            type: import(".prisma/client").$Enums.ChatType;
            avatarUrl: string | null;
            title: string | null;
            members: ({
                user: {
                    displayName: string;
                    avatarUrl: string | null;
                };
            } & {
                id: string;
                isPinned: boolean;
                chatId: string;
                userId: string;
                role: import(".prisma/client").$Enums.ChatMemberRole;
                joinedAt: Date;
                leftAt: Date | null;
                isMuted: boolean;
                mutedUntil: Date | null;
                isArchived: boolean;
                wallpaperUrl: string | null;
                lastReadMessageId: string | null;
            })[];
        };
        attachment: {
            id: string;
            createdAt: Date;
            uploaderId: string;
            storageKey: string;
            originalName: string | null;
            mimeType: string;
            sizeBytes: bigint;
            width: number | null;
            height: number | null;
            durationSeconds: number | null;
            thumbnailKey: string | null;
            transcript: string | null;
        } | null;
        sender: {
            id: string;
            displayName: string;
            avatarUrl: string | null;
        };
        status: import(".prisma/client").$Enums.MessageStatus;
        id: string;
        clientTempId: string | null;
        type: import(".prisma/client").$Enums.MessageType;
        textContent: string | null;
        isDeleted: boolean;
        isPinned: boolean;
        pinnedAt: Date | null;
        pinnedBy: string | null;
        isEncrypted: boolean;
        encryptionType: string | null;
        createdAt: Date;
        editedAt: Date | null;
        expiresAt: Date | null;
        senderId: string;
        replyToMessageId: string | null;
        attachmentId: string | null;
    }[]>;
    searchMessages(chatId: string, query: SearchMessagesDto, user: JwtPayload): Promise<{
        results: import("./search.service").SearchResult[];
        total: number;
    }>;
    pinMessage(chatId: string, messageId: string, user: JwtPayload): Promise<{
        success: boolean;
    }>;
    unpinMessage(chatId: string, messageId: string, user: JwtPayload): Promise<{
        success: boolean;
    }>;
    getPinnedMessages(chatId: string, user: JwtPayload): Promise<({
        attachment: {
            id: string;
            createdAt: Date;
            uploaderId: string;
            storageKey: string;
            originalName: string | null;
            mimeType: string;
            sizeBytes: bigint;
            width: number | null;
            height: number | null;
            durationSeconds: number | null;
            thumbnailKey: string | null;
            transcript: string | null;
        } | null;
        sender: {
            id: string;
            displayName: string;
            avatarUrl: string | null;
        };
    } & {
        status: import(".prisma/client").$Enums.MessageStatus;
        id: string;
        clientTempId: string | null;
        type: import(".prisma/client").$Enums.MessageType;
        textContent: string | null;
        isDeleted: boolean;
        isPinned: boolean;
        pinnedAt: Date | null;
        pinnedBy: string | null;
        isEncrypted: boolean;
        encryptionType: string | null;
        createdAt: Date;
        editedAt: Date | null;
        expiresAt: Date | null;
        chatId: string;
        senderId: string;
        replyToMessageId: string | null;
        attachmentId: string | null;
    })[]>;
    scheduleMessage(chatId: string, dto: ScheduleMessageDto, user: JwtPayload): Promise<{
        status: import(".prisma/client").$Enums.ScheduledMessageStatus;
        id: string;
        type: import(".prisma/client").$Enums.MessageType;
        textContent: string | null;
        createdAt: Date;
        chatId: string;
        attachmentId: string | null;
        userId: string;
        scheduledAt: Date;
    }>;
    getScheduledMessages(user: JwtPayload): Promise<({
        attachment: {
            id: string;
            createdAt: Date;
            uploaderId: string;
            storageKey: string;
            originalName: string | null;
            mimeType: string;
            sizeBytes: bigint;
            width: number | null;
            height: number | null;
            durationSeconds: number | null;
            thumbnailKey: string | null;
            transcript: string | null;
        } | null;
    } & {
        status: import(".prisma/client").$Enums.ScheduledMessageStatus;
        id: string;
        type: import(".prisma/client").$Enums.MessageType;
        textContent: string | null;
        createdAt: Date;
        chatId: string;
        attachmentId: string | null;
        userId: string;
        scheduledAt: Date;
    })[]>;
    cancelScheduledMessage(messageId: string, user: JwtPayload): Promise<{
        success: boolean;
    }>;
}
