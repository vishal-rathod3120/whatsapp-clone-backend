export declare class CreateDirectChatDto {
    targetUserId: string;
}
export declare class MarkChatReadDto {
    lastReadMessageId?: string;
}
export declare class GetChatsQueryDto {
    limit?: number;
    cursor?: string;
}
