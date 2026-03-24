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
        id: string;
        clientTempId: string | null;
        type: import(".prisma/client").$Enums.MessageType;
        textContent: string | null;
        replyToMessageId: string | null;
        status: import(".prisma/client").$Enums.MessageStatus;
        isDeleted: boolean;
        createdAt: Date;
        editedAt: Date | null;
        chatId: string;
        senderId: string;
        attachmentId: string | null;
    }>;
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
        id: string;
        clientTempId: string | null;
        type: import(".prisma/client").$Enums.MessageType;
        textContent: string | null;
        replyToMessageId: string | null;
        status: import(".prisma/client").$Enums.MessageStatus;
        isDeleted: boolean;
        createdAt: Date;
        editedAt: Date | null;
        chatId: string;
        senderId: string;
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
            id: string;
            clientTempId: string | null;
            type: import(".prisma/client").$Enums.MessageType;
            textContent: string | null;
            replyToMessageId: string | null;
            status: import(".prisma/client").$Enums.MessageStatus;
            isDeleted: boolean;
            createdAt: Date;
            editedAt: Date | null;
            chatId: string;
            senderId: string;
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
        id: string;
        clientTempId: string | null;
        type: import(".prisma/client").$Enums.MessageType;
        textContent: string | null;
        replyToMessageId: string | null;
        status: import(".prisma/client").$Enums.MessageStatus;
        isDeleted: boolean;
        createdAt: Date;
        editedAt: Date | null;
        chatId: string;
        senderId: string;
        attachmentId: string | null;
    })[]>;
    deleteMessage(chatId: string, messageId: string, userId: string, forEveryone: boolean): Promise<{
        success: boolean;
        type: string;
    }>;
    editMessage(chatId: string, messageId: string, userId: string, newTextContent: string): Promise<{
        id: string;
        clientTempId: string | null;
        type: import(".prisma/client").$Enums.MessageType;
        textContent: string | null;
        replyToMessageId: string | null;
        status: import(".prisma/client").$Enums.MessageStatus;
        isDeleted: boolean;
        createdAt: Date;
        editedAt: Date | null;
        chatId: string;
        senderId: string;
        attachmentId: string | null;
    }>;
}
