import { MessageType } from '../../../common/enums';
export declare class SendMessageDto {
    clientTempId: string;
    type: MessageType;
    textContent?: string;
    attachmentId?: string;
    replyToMessageId?: string;
    isEncrypted?: boolean;
    encryptionType?: string;
}
export declare class EditMessageDto {
    textContent: string;
}
export declare class GetMessagesQueryDto {
    limit?: number;
    cursor?: string;
}
export declare class DeliveredDto {
    messageId: string;
    chatId: string;
}
export declare class SeenDto {
    chatId: string;
    messageId: string;
}
export declare class ScheduleMessageDto {
    chatId: string;
    type: MessageType;
    scheduledAt: Date;
    textContent?: string;
    attachmentId?: string;
}
