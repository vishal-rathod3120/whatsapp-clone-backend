export declare class ChatDetailResponse {
    id: string;
    type: string;
    title?: string;
    avatarUrl?: string;
    createdById: string;
    createdAt: Date;
    members: {
        userId: string;
        displayName: string;
        avatarUrl?: string;
        role: string;
    }[];
    constructor(chat: any);
}
