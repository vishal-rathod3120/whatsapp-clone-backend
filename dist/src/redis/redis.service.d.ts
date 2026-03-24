import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
export declare class RedisService {
    private configService;
    private client;
    constructor(configService: ConfigService);
    getClient(): Redis;
    set(key: string, value: string, ttl?: number): Promise<void>;
    get(key: string): Promise<string | null>;
    del(key: string): Promise<void>;
    sadd(key: string, ...members: string[]): Promise<void>;
    srem(key: string, ...members: string[]): Promise<void>;
    smembers(key: string): Promise<string[]>;
    expire(key: string, seconds: number): Promise<void>;
    setex(key: string, seconds: number, value: string): Promise<void>;
    lpush(key: string, value: string): Promise<void>;
    brpoplpush(source: string, destination: string, timeout: number): Promise<string | null>;
    lrem(key: string, count: number, value: string): Promise<void>;
    lrange(key: string, start: number, stop: number): Promise<string[]>;
    llen(key: string): Promise<number>;
    scard(key: string): Promise<number>;
    keys(pattern: string): Promise<string[]>;
    ttl(key: string): Promise<number>;
    ping(): Promise<string>;
}
