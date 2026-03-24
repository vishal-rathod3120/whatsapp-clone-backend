import { MessageType } from '../../../common/enums';
export declare class SendMessageDto {
    clientTempId: string;
    type: MessageType;
    textContent?: string;
    attachmentId?: string;
    replyToMessageId?: string;
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
