import { PrismaService } from '../../prisma/prisma.service';
import { MessageType } from '@prisma/client';
export declare class MessagesRepository {
    private prisma;
    constructor(prisma: PrismaService);
    create(data: {
        chatId: string;
        senderId: string;
        clientTempId?: string;
        type: MessageType;
        textContent?: string;
        attachmentId?: string;
        replyToMessageId?: string;
    }): Promise<{
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
    }>;
    findById(messageId: string): Promise<({
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
    }) | null>;
    findByChatId(chatId: string, userId: string, limit: number, cursor?: string): Promise<({
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
    createReceipts(messageId: string, userIds: string[]): Promise<import(".prisma/client").Prisma.BatchPayload>;
    markAsDelivered(messageId: string, userId: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
    markAsSeen(messageId: string, userId: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
    getUnreadCount(chatId: string, userId: string): Promise<number>;
}
