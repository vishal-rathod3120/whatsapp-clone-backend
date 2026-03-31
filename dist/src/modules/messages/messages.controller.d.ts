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
            sender: {
                id: string;
                displayName: string;
                avatarUrl: string | null;
            };
            attachment: {
                id: string;
                createdAt: Date;
                storageKey: string;
                originalName: string | null;
                mimeType: string;
                sizeBytes: bigint;
                width: number | null;
                height: number | null;
                durationSeconds: number | null;
                thumbnailKey: string | null;
                transcript: string | null;
                uploaderId: string;
            } | null;
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
                seenAt: Date | null;
                deliveredAt: Date | null;
            }[];
        } & {
            id: string;
            createdAt: Date;
            type: import(".prisma/client").$Enums.MessageType;
            status: import(".prisma/client").$Enums.MessageStatus;
            chatId: string;
            isPinned: boolean;
            clientTempId: string | null;
            textContent: string | null;
            isDeleted: boolean;
            pinnedAt: Date | null;
            pinnedBy: string | null;
            isEncrypted: boolean;
            encryptionType: string | null;
            editedAt: Date | null;
            expiresAt: Date | null;
            senderId: string;
            replyToMessageId: string | null;
            attachmentId: string | null;
        })[];
        nextCursor: string | null;
    }>;
    sendMessage(chatId: string, dto: SendMessageDto, user: JwtPayload): Promise<{
        id: string;
        createdAt: Date;
        type: import(".prisma/client").$Enums.MessageType;
        status: import(".prisma/client").$Enums.MessageStatus;
        chatId: string;
        isPinned: boolean;
        clientTempId: string | null;
        textContent: string | null;
        isDeleted: boolean;
        pinnedAt: Date | null;
        pinnedBy: string | null;
        isEncrypted: boolean;
        encryptionType: string | null;
        editedAt: Date | null;
        expiresAt: Date | null;
        senderId: string;
        replyToMessageId: string | null;
        attachmentId: string | null;
    }>;
    deleteMessage(chatId: string, messageId: string, forEveryone: string, user: JwtPayload): Promise<{
        success: boolean;
        type: string;
    }>;
    editMessage(chatId: string, messageId: string, dto: EditMessageDto, user: JwtPayload): Promise<{
        id: string;
        createdAt: Date;
        type: import(".prisma/client").$Enums.MessageType;
        status: import(".prisma/client").$Enums.MessageStatus;
        chatId: string;
        isPinned: boolean;
        clientTempId: string | null;
        textContent: string | null;
        isDeleted: boolean;
        pinnedAt: Date | null;
        pinnedBy: string | null;
        isEncrypted: boolean;
        encryptionType: string | null;
        editedAt: Date | null;
        expiresAt: Date | null;
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
            avatarUrl: string | null;
            type: import(".prisma/client").$Enums.ChatType;
            title: string | null;
            members: ({
                user: {
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
        };
        sender: {
            id: string;
            displayName: string;
            avatarUrl: string | null;
        };
        attachment: {
            id: string;
            createdAt: Date;
            storageKey: string;
            originalName: string | null;
            mimeType: string;
            sizeBytes: bigint;
            width: number | null;
            height: number | null;
            durationSeconds: number | null;
            thumbnailKey: string | null;
            transcript: string | null;
            uploaderId: string;
        } | null;
        id: string;
        createdAt: Date;
        type: import(".prisma/client").$Enums.MessageType;
        status: import(".prisma/client").$Enums.MessageStatus;
        isPinned: boolean;
        clientTempId: string | null;
        textContent: string | null;
        isDeleted: boolean;
        pinnedAt: Date | null;
        pinnedBy: string | null;
        isEncrypted: boolean;
        encryptionType: string | null;
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
        sender: {
            id: string;
            displayName: string;
            avatarUrl: string | null;
        };
        attachment: {
            id: string;
            createdAt: Date;
            storageKey: string;
            originalName: string | null;
            mimeType: string;
            sizeBytes: bigint;
            width: number | null;
            height: number | null;
            durationSeconds: number | null;
            thumbnailKey: string | null;
            transcript: string | null;
            uploaderId: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        type: import(".prisma/client").$Enums.MessageType;
        status: import(".prisma/client").$Enums.MessageStatus;
        chatId: string;
        isPinned: boolean;
        clientTempId: string | null;
        textContent: string | null;
        isDeleted: boolean;
        pinnedAt: Date | null;
        pinnedBy: string | null;
        isEncrypted: boolean;
        encryptionType: string | null;
        editedAt: Date | null;
        expiresAt: Date | null;
        senderId: string;
        replyToMessageId: string | null;
        attachmentId: string | null;
    })[]>;
    scheduleMessage(chatId: string, dto: ScheduleMessageDto, user: JwtPayload): Promise<{
        id: string;
        createdAt: Date;
        type: import(".prisma/client").$Enums.MessageType;
        userId: string;
        status: import(".prisma/client").$Enums.ScheduledMessageStatus;
        chatId: string;
        textContent: string | null;
        attachmentId: string | null;
        scheduledAt: Date;
    }>;
    getScheduledMessages(user: JwtPayload): Promise<({
        attachment: {
            id: string;
            createdAt: Date;
            storageKey: string;
            originalName: string | null;
            mimeType: string;
            sizeBytes: bigint;
            width: number | null;
            height: number | null;
            durationSeconds: number | null;
            thumbnailKey: string | null;
            transcript: string | null;
            uploaderId: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        type: import(".prisma/client").$Enums.MessageType;
        userId: string;
        status: import(".prisma/client").$Enums.ScheduledMessageStatus;
        chatId: string;
        textContent: string | null;
        attachmentId: string | null;
        scheduledAt: Date;
    })[]>;
    cancelScheduledMessage(messageId: string, user: JwtPayload): Promise<{
        success: boolean;
    }>;
}
