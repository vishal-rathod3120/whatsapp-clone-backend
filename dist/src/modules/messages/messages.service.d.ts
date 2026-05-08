import { PrismaService } from '../../prisma/prisma.service';
import { SendMessageDto, ScheduleMessageDto } from './dto/message.dto';
import { MessageQueueService } from '../../common/queue/message-queue.service';
import { ModuleRef } from '@nestjs/core';
import { MediaService } from '../media/media.service';
import { E2EECryptoService } from '../e2ee/e2ee-crypto.service';
import { SearchService } from '../search/search.service';
import { MetricsService } from '../monitoring/metrics.service';
export declare class MessagesService {
    private prisma;
    private messageQueue;
    private moduleRef;
    private mediaService;
    private e2eeCrypto;
    private searchService;
    private metricsService;
    constructor(prisma: PrismaService, messageQueue: MessageQueueService, moduleRef: ModuleRef, mediaService: MediaService, e2eeCrypto: E2EECryptoService, searchService: SearchService, metricsService: MetricsService);
    private get chatGateway();
    createMessage(chatId: string, senderId: string, dto: SendMessageDto): Promise<{
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
    private detectEncryptionFlags;
    getMessageById(messageId: string): Promise<{
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
    }>;
    getMessages(chatId: string, userId: string, limit?: number, cursor?: string): Promise<{
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
    markAsDelivered(messageId: string, userId: string): Promise<boolean>;
    markAsSeen(messageId: string, userId: string): Promise<boolean>;
    getUnreadCount(chatId: string, userId: string): Promise<number>;
    getMissedMessages(userId: string, since: Date): Promise<({
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
    })[]>;
    deleteMessage(chatId: string, messageId: string, userId: string, forEveryone: boolean): Promise<{
        success: boolean;
        type: string;
    }>;
    editMessage(chatId: string, messageId: string, userId: string, newTextContent: string): Promise<{
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
    starMessage(chatId: string, messageId: string, userId: string): Promise<{
        success: boolean;
    }>;
    unstarMessage(chatId: string, messageId: string, userId: string): Promise<{
        success: boolean;
    }>;
    getStarredMessages(userId: string): Promise<{
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
    pinMessage(chatId: string, messageId: string, userId: string): Promise<{
        success: boolean;
    }>;
    unpinMessage(chatId: string, messageId: string, userId: string): Promise<{
        success: boolean;
    }>;
    getPinnedMessages(chatId: string, userId: string): Promise<({
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
    scheduleMessage(chatId: string, userId: string, dto: ScheduleMessageDto): Promise<{
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
    getScheduledMessages(userId: string): Promise<({
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
    cancelScheduledMessage(messageId: string, userId: string): Promise<{
        success: boolean;
    }>;
}
