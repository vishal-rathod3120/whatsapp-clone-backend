export declare class MessageResponse {
    id: string;
    chatId: string;
    senderId: string;
    clientTempId?: string;
    type: string;
    textContent?: string;
    attachment?: {
        id: string;
        url: string;
        mimeType: string;
        sizeBytes: string;
        width?: number;
        height?: number;
        durationSeconds?: number;
        thumbnailUrl?: string;
    };
    status: string;
    createdAt: Date;
    editedAt?: Date;
    isDeleted: boolean;
    constructor(message: any);
}
