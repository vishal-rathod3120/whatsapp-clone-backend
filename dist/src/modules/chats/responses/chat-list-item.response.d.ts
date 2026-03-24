export declare class ChatListItemResponse {
    id: string;
    type: string;
    title: string;
    avatarUrl?: string;
    lastMessage?: {
        id: string;
        type: string;
        textContent?: string;
        senderId: string;
        createdAt: Date;
    };
    unreadCount: number;
    lastMessageAt?: Date;
    constructor(chat: any, unreadCount?: number);
}
