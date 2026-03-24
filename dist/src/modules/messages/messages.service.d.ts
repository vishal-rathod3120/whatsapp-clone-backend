import { PrismaService } from '../../prisma/prisma.service';
import { SendMessageDto } from './dto/message.dto';
import { MessageQueueService } from '../../common/queue/message-queue.service';
import { ChatGateway } from '../gateway/chat.gateway';
export declare class MessagesService {
    private prisma;
    private messageQueue;
    private chatGateway;
    constructor(prisma: PrismaService, messageQueue: MessageQueueService, chatGateway: ChatGateway);
    createMessage(chatId: string, senderId: string, dto: SendMessageDto): Promise<{
        sender: {
            id: string;
            displayName: string;
            avatarUrl: string | null;
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
        } | null;
        receipts: {
            userId: string;
            seenAt: Date | null;
            deliveredAt: Date | null;
        }[];
    } & {
        id: string;
        createdAt: Date;
        chatId: string;
        senderId: string;
        clientTempId: string | null;
        type: import(".prisma/client").$Enums.MessageType;
        textContent: string | null;
        replyToMessageId: string | null;
        attachmentId: string | null;
        status: import(".prisma/client").$Enums.MessageStatus;
        isDeleted: boolean;
        editedAt: Date | null;
    }>;
    getMessageById(messageId: string): Promise<{
        sender: {
            id: string;
            displayName: string;
            avatarUrl: string | null;
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
        } | null;
        receipts: {
            userId: string;
            seenAt: Date | null;
            deliveredAt: Date | null;
        }[];
    } & {
        id: string;
        createdAt: Date;
        chatId: string;
        senderId: string;
        clientTempId: string | null;
        type: import(".prisma/client").$Enums.MessageType;
        textContent: string | null;
        replyToMessageId: string | null;
        attachmentId: string | null;
        status: import(".prisma/client").$Enums.MessageStatus;
        isDeleted: boolean;
        editedAt: Date | null;
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
                uploaderId: string;
                storageKey: string;
                originalName: string | null;
                mimeType: string;
                sizeBytes: bigint;
                width: number | null;
                height: number | null;
                durationSeconds: number | null;
                thumbnailKey: string | null;
            } | null;
            receipts: {
                userId: string;
                seenAt: Date | null;
                deliveredAt: Date | null;
            }[];
        } & {
            id: string;
            createdAt: Date;
            chatId: string;
            senderId: string;
            clientTempId: string | null;
            type: import(".prisma/client").$Enums.MessageType;
            textContent: string | null;
            replyToMessageId: string | null;
            attachmentId: string | null;
            status: import(".prisma/client").$Enums.MessageStatus;
            isDeleted: boolean;
            editedAt: Date | null;
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
            uploaderId: string;
            storageKey: string;
            originalName: string | null;
            mimeType: string;
            sizeBytes: bigint;
            width: number | null;
            height: number | null;
            durationSeconds: number | null;
            thumbnailKey: string | null;
        } | null;
        receipts: {
            userId: string;
            seenAt: Date | null;
            deliveredAt: Date | null;
        }[];
    } & {
        id: string;
        createdAt: Date;
        chatId: string;
        senderId: string;
        clientTempId: string | null;
        type: import(".prisma/client").$Enums.MessageType;
        textContent: string | null;
        replyToMessageId: string | null;
        attachmentId: string | null;
        status: import(".prisma/client").$Enums.MessageStatus;
        isDeleted: boolean;
        editedAt: Date | null;
    })[]>;
    deleteMessage(chatId: string, messageId: string, userId: string, forEveryone: boolean): Promise<{
        success: boolean;
        type: string;
    }>;
    editMessage(chatId: string, messageId: string, userId: string, newTextContent: string): Promise<{
        id: string;
        createdAt: Date;
        chatId: string;
        senderId: string;
        clientTempId: string | null;
        type: import(".prisma/client").$Enums.MessageType;
        textContent: string | null;
        replyToMessageId: string | null;
        attachmentId: string | null;
        status: import(".prisma/client").$Enums.MessageStatus;
        isDeleted: boolean;
        editedAt: Date | null;
    }>;
}
