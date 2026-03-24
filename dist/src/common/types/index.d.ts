export interface JwtPayload {
    userId: string;
    deviceId?: string;
    iat?: number;
    exp?: number;
}
export interface SocketUser {
    userId: string;
    deviceId?: string;
}
export interface PaginatedResponse<T> {
    items: T[];
    nextCursor?: string;
    total?: number;
}
export interface ChatMemberInfo {
    userId: string;
    displayName: string;
    avatarUrl?: string;
    role: string;
}
export interface MessageReceiptInfo {
    userId: string;
    deliveredAt?: Date;
    seenAt?: Date;
}
export interface TypingEvent {
    chatId: string;
    userId: string;
    isTyping: boolean;
}
export interface PresenceEvent {
    userId: string;
    status: 'online' | 'offline';
    lastSeen?: Date;
}
export interface CallSignalEvent {
    callId: string;
    sdp?: string;
    candidate?: string;
    fromUserId: string;
    toUserId: string;
}
