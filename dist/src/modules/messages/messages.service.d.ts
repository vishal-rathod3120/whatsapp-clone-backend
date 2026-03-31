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
    private detectEncryptionFlags;
    getMessageById(messageId: string): Promise<{
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
    }>;
    getMessages(chatId: string, userId: string, limit?: number, cursor?: string): Promise<{
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
    markAsDelivered(messageId: string, userId: string): Promise<boolean>;
    markAsSeen(messageId: string, userId: string): Promise<boolean>;
    getUnreadCount(chatId: string, userId: string): Promise<number>;
    getMissedMessages(userId: string, since: Date): Promise<({
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
    })[]>;
    deleteMessage(chatId: string, messageId: string, userId: string, forEveryone: boolean): Promise<{
        success: boolean;
        type: string;
    }>;
    editMessage(chatId: string, messageId: string, userId: string, newTextContent: string): Promise<{
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
    pinMessage(chatId: string, messageId: string, userId: string): Promise<{
        success: boolean;
    }>;
    unpinMessage(chatId: string, messageId: string, userId: string): Promise<{
        success: boolean;
    }>;
    getPinnedMessages(chatId: string, userId: string): Promise<({
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
    scheduleMessage(chatId: string, userId: string, dto: ScheduleMessageDto): Promise<{
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
    getScheduledMessages(userId: string): Promise<({
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
    cancelScheduledMessage(messageId: string, userId: string): Promise<{
        success: boolean;
    }>;
}
