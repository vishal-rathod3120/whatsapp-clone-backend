import { Injectable } from '@nestjs/common';
import { RedisService } from './redis.service';

@Injectable()
export class PresenceRepository {
  private readonly USER_SOCKETS_PREFIX = 'user:sockets';
  private readonly SOCKET_USER_PREFIX = 'socket:user';
  private readonly USER_PRESENCE_PREFIX = 'user:presence';
  private readonly USER_LAST_SEEN_PREFIX = 'user:lastSeen';
  private readonly CHAT_TYPING_PREFIX = 'chat:typing';

  constructor(private redisService: RedisService) {}

  // Socket management
  async addUserSocket(userId: string, socketId: string): Promise<void> {
    await this.redisService.sadd(`${this.USER_SOCKETS_PREFIX}:${userId}`, socketId);
    await this.redisService.set(`${this.SOCKET_USER_PREFIX}:${socketId}`, userId);
  }

  async removeUserSocket(userId: string, socketId: string): Promise<void> {
    await this.redisService.srem(`${this.USER_SOCKETS_PREFIX}:${userId}`, socketId);
    await this.redisService.del(`${this.SOCKET_USER_PREFIX}:${socketId}`);
  }

  async getUserSockets(userId: string): Promise<string[]> {
    return this.redisService.smembers(`${this.USER_SOCKETS_PREFIX}:${userId}`);
  }

  async getSocketUser(socketId: string): Promise<string | null> {
    return this.redisService.get(`${this.SOCKET_USER_PREFIX}:${socketId}`);
  }

  // Presence management
  async setUserOnline(userId: string): Promise<void> {
    await this.redisService.set(`${this.USER_PRESENCE_PREFIX}:${userId}`, 'online');
  }

  async setUserOffline(userId: string): Promise<void> {
    await this.redisService.set(`${this.USER_PRESENCE_PREFIX}:${userId}`, 'offline');
    await this.redisService.set(`${this.USER_LAST_SEEN_PREFIX}:${userId}`, Date.now().toString());
  }

  async getUserPresence(userId: string): Promise<{ status: string; lastSeen?: Date }> {
    const status = await this.redisService.get(`${this.USER_PRESENCE_PREFIX}:${userId}`);
    const lastSeenStr = await this.redisService.get(`${this.USER_LAST_SEEN_PREFIX}:${userId}`);
    
    return {
      status: status || 'offline',
      lastSeen: lastSeenStr ? new Date(parseInt(lastSeenStr, 10)) : undefined,
    };
  }

  // Typing indicators with individual TTL per user per chat
  async setUserTyping(chatId: string, userId: string, ttl: number = 5): Promise<void> {
    const key = `${this.CHAT_TYPING_PREFIX}:${chatId}:${userId}`;
    await this.redisService.setex(key, ttl, 'typing');
  }

  async removeUserTyping(chatId: string, userId: string): Promise<void> {
    const key = `${this.CHAT_TYPING_PREFIX}:${chatId}:${userId}`;
    await this.redisService.del(key);
  }

  async isUserTyping(chatId: string, userId: string): Promise<boolean> {
    const key = `${this.CHAT_TYPING_PREFIX}:${chatId}:${userId}`;
    const value = await this.redisService.get(key);
    return value === 'typing';
  }

  async getTypingUsers(chatId: string): Promise<string[]> {
    // Scan for all typing keys in this chat
    const pattern = `${this.CHAT_TYPING_PREFIX}:${chatId}:*`;
    const keys = await this.redisService.keys(pattern);
    // Extract userIds from keys
    return keys.map((key) => key.split(':').pop()!).filter(Boolean);
  }

  async getTypingUsersWithExpiry(chatId: string): Promise<{ userId: string; ttl: number }[]> {
    const users = await this.getTypingUsers(chatId);
    const result: { userId: string; ttl: number }[] = [];
    
    for (const userId of users) {
      const key = `${this.CHAT_TYPING_PREFIX}:${chatId}:${userId}`;
      const ttl = await this.redisService.ttl(key);
      result.push({ userId, ttl });
    }
    
    return result;
  }
}
