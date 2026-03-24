import { RedisService } from '../../redis/redis.service';
export declare class PresenceService {
    private readonly redis;
    private readonly PRESENCE_TTL;
    constructor(redis: RedisService);
    setUserOnline(userId: string, socketId: string): Promise<void>;
    setUserOffline(userId: string, socketId: string): Promise<void>;
    isUserOnline(userId: string): Promise<boolean>;
    getUserLastSeen(userId: string): Promise<Date | null>;
    setTyping(chatId: string, userId: string, isTyping: boolean): Promise<void>;
    getTypingUsers(chatId: string): Promise<string[]>;
    isUserTyping(chatId: string, userId: string): Promise<boolean>;
    getUserSockets(userId: string): Promise<string[]>;
    getSocketUser(socketId: string): Promise<string | null>;
}
