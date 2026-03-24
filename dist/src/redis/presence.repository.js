"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PresenceRepository = void 0;
const common_1 = require("@nestjs/common");
const redis_service_1 = require("./redis.service");
let PresenceRepository = class PresenceRepository {
    constructor(redisService) {
        this.redisService = redisService;
        this.USER_SOCKETS_PREFIX = 'user:sockets';
        this.SOCKET_USER_PREFIX = 'socket:user';
        this.USER_PRESENCE_PREFIX = 'user:presence';
        this.USER_LAST_SEEN_PREFIX = 'user:lastSeen';
        this.CHAT_TYPING_PREFIX = 'chat:typing';
    }
    async addUserSocket(userId, socketId) {
        await this.redisService.sadd(`${this.USER_SOCKETS_PREFIX}:${userId}`, socketId);
        await this.redisService.set(`${this.SOCKET_USER_PREFIX}:${socketId}`, userId);
    }
    async removeUserSocket(userId, socketId) {
        await this.redisService.srem(`${this.USER_SOCKETS_PREFIX}:${userId}`, socketId);
        await this.redisService.del(`${this.SOCKET_USER_PREFIX}:${socketId}`);
    }
    async getUserSockets(userId) {
        return this.redisService.smembers(`${this.USER_SOCKETS_PREFIX}:${userId}`);
    }
    async getSocketUser(socketId) {
        return this.redisService.get(`${this.SOCKET_USER_PREFIX}:${socketId}`);
    }
    async setUserOnline(userId) {
        await this.redisService.set(`${this.USER_PRESENCE_PREFIX}:${userId}`, 'online');
    }
    async setUserOffline(userId) {
        await this.redisService.set(`${this.USER_PRESENCE_PREFIX}:${userId}`, 'offline');
        await this.redisService.set(`${this.USER_LAST_SEEN_PREFIX}:${userId}`, Date.now().toString());
    }
    async getUserPresence(userId) {
        const status = await this.redisService.get(`${this.USER_PRESENCE_PREFIX}:${userId}`);
        const lastSeenStr = await this.redisService.get(`${this.USER_LAST_SEEN_PREFIX}:${userId}`);
        return {
            status: status || 'offline',
            lastSeen: lastSeenStr ? new Date(parseInt(lastSeenStr, 10)) : undefined,
        };
    }
    async setUserTyping(chatId, userId, ttl = 5) {
        const key = `${this.CHAT_TYPING_PREFIX}:${chatId}:${userId}`;
        await this.redisService.setex(key, ttl, 'typing');
    }
    async removeUserTyping(chatId, userId) {
        const key = `${this.CHAT_TYPING_PREFIX}:${chatId}:${userId}`;
        await this.redisService.del(key);
    }
    async isUserTyping(chatId, userId) {
        const key = `${this.CHAT_TYPING_PREFIX}:${chatId}:${userId}`;
        const value = await this.redisService.get(key);
        return value === 'typing';
    }
    async getTypingUsers(chatId) {
        const pattern = `${this.CHAT_TYPING_PREFIX}:${chatId}:*`;
        const keys = await this.redisService.keys(pattern);
        return keys.map((key) => key.split(':').pop()).filter(Boolean);
    }
    async getTypingUsersWithExpiry(chatId) {
        const users = await this.getTypingUsers(chatId);
        const result = [];
        for (const userId of users) {
            const key = `${this.CHAT_TYPING_PREFIX}:${chatId}:${userId}`;
            const ttl = await this.redisService.ttl(key);
            result.push({ userId, ttl });
        }
        return result;
    }
};
exports.PresenceRepository = PresenceRepository;
exports.PresenceRepository = PresenceRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [redis_service_1.RedisService])
], PresenceRepository);
//# sourceMappingURL=presence.repository.js.map