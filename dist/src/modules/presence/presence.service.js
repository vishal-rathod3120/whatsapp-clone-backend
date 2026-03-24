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
exports.PresenceService = void 0;
const common_1 = require("@nestjs/common");
const redis_service_1 = require("../../redis/redis.service");
let PresenceService = class PresenceService {
    constructor(redis) {
        this.redis = redis;
        this.PRESENCE_TTL = 300;
    }
    async setUserOnline(userId, socketId) {
        await this.redis.sadd(`user:${userId}:sockets`, socketId);
        await this.redis.setex(`socket:${socketId}:user`, this.PRESENCE_TTL, userId);
        await this.redis.setex(`user:${userId}:presence`, this.PRESENCE_TTL, 'online');
    }
    async setUserOffline(userId, socketId) {
        await this.redis.srem(`user:${userId}:sockets`, socketId);
        await this.redis.del(`socket:${socketId}:user`);
        const remainingSockets = await this.redis.scard(`user:${userId}:sockets`);
        if (remainingSockets === 0) {
            await this.redis.setex(`user:${userId}:presence`, this.PRESENCE_TTL, 'offline');
            await this.redis.set(`user:${userId}:lastSeen`, new Date().toISOString());
        }
    }
    async isUserOnline(userId) {
        const presence = await this.redis.get(`user:${userId}:presence`);
        return presence === 'online';
    }
    async getUserLastSeen(userId) {
        const lastSeen = await this.redis.get(`user:${userId}:lastSeen`);
        return lastSeen ? new Date(lastSeen) : null;
    }
    async setTyping(chatId, userId, isTyping) {
        if (isTyping) {
            await this.redis.setex(`chat:typing:${chatId}:${userId}`, 5, 'typing');
        }
        else {
            await this.redis.del(`chat:typing:${chatId}:${userId}`);
        }
    }
    async getTypingUsers(chatId) {
        const pattern = `chat:typing:${chatId}:*`;
        const keys = await this.redis.keys(pattern);
        return keys.map((key) => key.split(':').pop()).filter(Boolean);
    }
    async isUserTyping(chatId, userId) {
        const value = await this.redis.get(`chat:typing:${chatId}:${userId}`);
        return value === 'typing';
    }
    async getUserSockets(userId) {
        return await this.redis.smembers(`user:${userId}:sockets`);
    }
    async getSocketUser(socketId) {
        return await this.redis.get(`socket:${socketId}:user`);
    }
};
exports.PresenceService = PresenceService;
exports.PresenceService = PresenceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [redis_service_1.RedisService])
], PresenceService);
//# sourceMappingURL=presence.service.js.map