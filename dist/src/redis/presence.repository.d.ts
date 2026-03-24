import { RedisService } from './redis.service';
export declare class PresenceRepository {
    private redisService;
    private readonly USER_SOCKETS_PREFIX;
    private readonly SOCKET_USER_PREFIX;
    private readonly USER_PRESENCE_PREFIX;
    private readonly USER_LAST_SEEN_PREFIX;
    private readonly CHAT_TYPING_PREFIX;
    constructor(redisService: RedisService);
    addUserSocket(userId: string, socketId: string): Promise<void>;
    removeUserSocket(userId: string, socketId: string): Promise<void>;
    getUserSockets(userId: string): Promise<string[]>;
    getSocketUser(socketId: string): Promise<string | null>;
    setUserOnline(userId: string): Promise<void>;
    setUserOffline(userId: string): Promise<void>;
    getUserPresence(userId: string): Promise<{
        status: string;
        lastSeen?: Date;
    }>;
    setUserTyping(chatId: string, userId: string, ttl?: number): Promise<void>;
    removeUserTyping(chatId: string, userId: string): Promise<void>;
    isUserTyping(chatId: string, userId: string): Promise<boolean>;
    getTypingUsers(chatId: string): Promise<string[]>;
    getTypingUsersWithExpiry(chatId: string): Promise<{
        userId: string;
        ttl: number;
    }[]>;
}
