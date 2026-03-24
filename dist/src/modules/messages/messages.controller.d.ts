import { MessagesService } from './messages.service';
import { GetMessagesQueryDto, SendMessageDto, EditMessageDto } from './dto/message.dto';
import { JwtPayload } from '../auth/types/jwt-payload.type';
export declare class MessagesController {
    private messagesService;
    constructor(messagesService: MessagesService);
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
    sendMessage(chatId: string, dto: SendMessageDto, user: JwtPayload): Promise<{
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
    deleteMessage(chatId: string, messageId: string, forEveryone: string, user: JwtPayload): Promise<{
        success: boolean;
        type: string;
    }>;
    editMessage(chatId: string, messageId: string, dto: EditMessageDto, user: JwtPayload): Promise<{
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
