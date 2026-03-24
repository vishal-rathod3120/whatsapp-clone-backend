import { Injectable } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';

@Injectable()
export class PresenceService {
  private readonly PRESENCE_TTL = 300; // 5 minutes

  constructor(private readonly redis: RedisService) {}

  async setUserOnline(userId: string, socketId: string): Promise<void> {
    // Add socket to user's socket set
    await this.redis.sadd(`user:${userId}:sockets`, socketId);
    // Map socket to user
    await this.redis.setex(`socket:${socketId}:user`, this.PRESENCE_TTL, userId);
    // Set presence status
    await this.redis.setex(`user:${userId}:presence`, this.PRESENCE_TTL, 'online');
  }

  async setUserOffline(userId: string, socketId: string): Promise<void> {
    // Remove socket from user's set
    await this.redis.srem(`user:${userId}:sockets`, socketId);
    // Delete socket mapping
    await this.redis.del(`socket:${socketId}:user`);
    
    // Check if user has any remaining sockets
    const remainingSockets = await this.redis.scard(`user:${userId}:sockets`);
    if (remainingSockets === 0) {
      // Set offline with last seen
      await this.redis.setex(`user:${userId}:presence`, this.PRESENCE_TTL, 'offline');
      await this.redis.set(`user:${userId}:lastSeen`, new Date().toISOString());
    }
  }

  async isUserOnline(userId: string): Promise<boolean> {
    const presence = await this.redis.get(`user:${userId}:presence`);
    return presence === 'online';
  }

  async getUserLastSeen(userId: string): Promise<Date | null> {
    const lastSeen = await this.redis.get(`user:${userId}:lastSeen`);
    return lastSeen ? new Date(lastSeen) : null;
  }

  async setTyping(chatId: string, userId: string, isTyping: boolean): Promise<void> {
    if (isTyping) {
      // Set typing with 5-second TTL - client must ping every 3 seconds
      await this.redis.setex(`chat:typing:${chatId}:${userId}`, 5, 'typing');
    } else {
      await this.redis.del(`chat:typing:${chatId}:${userId}`);
    }
  }

  async getTypingUsers(chatId: string): Promise<string[]> {
    // Scan for all typing keys in this chat
    const pattern = `chat:typing:${chatId}:*`;
    const keys = await this.redis.keys(pattern);
    return keys.map((key) => key.split(':').pop()!).filter(Boolean);
  }

  async isUserTyping(chatId: string, userId: string): Promise<boolean> {
    const value = await this.redis.get(`chat:typing:${chatId}:${userId}`);
    return value === 'typing';
  }

  async getUserSockets(userId: string): Promise<string[]> {
    return await this.redis.smembers(`user:${userId}:sockets`);
  }

  async getSocketUser(socketId: string): Promise<string | null> {
    return await this.redis.get(`socket:${socketId}:user`);
  }
}
