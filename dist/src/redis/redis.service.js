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
exports.RedisService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const ioredis_1 = require("ioredis");
let RedisService = class RedisService {
    constructor(configService) {
        this.configService = configService;
        this.client = new ioredis_1.default({
            host: this.configService.get('redis.host'),
            port: this.configService.get('redis.port'),
            password: this.configService.get('redis.password'),
            db: this.configService.get('redis.db'),
        });
    }
    getClient() {
        return this.client;
    }
    async set(key, value, ttl) {
        if (ttl) {
            await this.client.setex(key, ttl, value);
        }
        else {
            await this.client.set(key, value);
        }
    }
    async get(key) {
        return this.client.get(key);
    }
    async del(key) {
        await this.client.del(key);
    }
    async sadd(key, ...members) {
        await this.client.sadd(key, ...members);
    }
    async srem(key, ...members) {
        await this.client.srem(key, ...members);
    }
    async smembers(key) {
        return this.client.smembers(key);
    }
    async expire(key, seconds) {
        await this.client.expire(key, seconds);
    }
    async setex(key, seconds, value) {
        await this.client.setex(key, seconds, value);
    }
    async lpush(key, value) {
        await this.client.lpush(key, value);
    }
    async brpoplpush(source, destination, timeout) {
        return this.client.brpoplpush(source, destination, timeout);
    }
    async lrem(key, count, value) {
        await this.client.lrem(key, count, value);
    }
    async lrange(key, start, stop) {
        return this.client.lrange(key, start, stop);
    }
    async llen(key) {
        return this.client.llen(key);
    }
    async scard(key) {
        return this.client.scard(key);
    }
    async keys(pattern) {
        return this.client.keys(pattern);
    }
    async ttl(key) {
        return this.client.ttl(key);
    }
    async ping() {
        return this.client.ping();
    }
};
exports.RedisService = RedisService;
exports.RedisService = RedisService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], RedisService);
//# sourceMappingURL=redis.service.js.map