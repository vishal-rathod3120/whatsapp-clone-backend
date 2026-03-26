import { MessagesService } from './messages.service';
import { GetMessagesQueryDto, SendMessageDto, EditMessageDto } from './dto/message.dto';
import { JwtPayload } from '../auth/types/jwt-payload.type';
export declare class MessagesController {
    private messagesService;
    constructor(messagesService: MessagesService);
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
            replyToMessage: {
                id: string;
                senderId: string;
                type: import(".prisma/client").$Enums.MessageType;
                textContent: string | null;
                sender: {
                    displayName: string;
                };
            } | null;
            receipts: {
                userId: string;
                deliveredAt: Date | null;
                seenAt: Date | null;
            }[];
        } & {
            id: string;
            chatId: string;
            senderId: string;
            clientTempId: string | null;
            type: import(".prisma/client").$Enums.MessageType;
            textContent: string | null;
            replyToMessageId: string | null;
            attachmentId: string | null;
            status: import(".prisma/client").$Enums.MessageStatus;
            isDeleted: boolean;
            createdAt: Date;
            editedAt: Date | null;
            expiresAt: Date | null;
        })[];
        nextCursor: string | null;
    }>;
    sendMessage(chatId: string, dto: SendMessageDto, user: JwtPayload): Promise<{
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
        replyToMessage: {
            id: string;
            senderId: string;
            type: import(".prisma/client").$Enums.MessageType;
            textContent: string | null;
            sender: {
                displayName: string;
            };
        } | null;
        receipts: {
            userId: string;
            deliveredAt: Date | null;
            seenAt: Date | null;
        }[];
    } & {
        id: string;
        chatId: string;
        senderId: string;
        clientTempId: string | null;
        type: import(".prisma/client").$Enums.MessageType;
        textContent: string | null;
        replyToMessageId: string | null;
        attachmentId: string | null;
        status: import(".prisma/client").$Enums.MessageStatus;
        isDeleted: boolean;
        createdAt: Date;
        editedAt: Date | null;
        expiresAt: Date | null;
    }>;
    deleteMessage(chatId: string, messageId: string, forEveryone: string, user: JwtPayload): Promise<{
        success: boolean;
        type: string;
    }>;
    editMessage(chatId: string, messageId: string, dto: EditMessageDto, user: JwtPayload): Promise<{
        id: string;
        chatId: string;
        senderId: string;
        clientTempId: string | null;
        type: import(".prisma/client").$Enums.MessageType;
        textContent: string | null;
        replyToMessageId: string | null;
        attachmentId: string | null;
        status: import(".prisma/client").$Enums.MessageStatus;
        isDeleted: boolean;
        createdAt: Date;
        editedAt: Date | null;
        expiresAt: Date | null;
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
                chatId: string;
                userId: string;
                role: import(".prisma/client").$Enums.ChatMemberRole;
                joinedAt: Date;
                leftAt: Date | null;
                isMuted: boolean;
                mutedUntil: Date | null;
                isPinned: boolean;
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
        id: string;
        senderId: string;
        clientTempId: string | null;
        type: import(".prisma/client").$Enums.MessageType;
        textContent: string | null;
        replyToMessageId: string | null;
        attachmentId: string | null;
        status: import(".prisma/client").$Enums.MessageStatus;
        isDeleted: boolean;
        createdAt: Date;
        editedAt: Date | null;
        expiresAt: Date | null;
    }[]>;
}
