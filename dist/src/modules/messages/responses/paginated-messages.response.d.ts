import { MessageResponse } from './message.response';
export declare class PaginatedMessagesResponse {
    items: MessageResponse[];
    nextCursor: string | null;
    constructor(messages: any[], nextCursor?: string | null);
}
