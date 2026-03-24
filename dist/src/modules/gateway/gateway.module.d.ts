import { ServerOptions } from 'socket.io';
import { RedisService } from '../../redis/redis.service';
export declare class GatewayModule {
    private readonly redisService;
    private readonly redisIoAdapter;
    constructor(redisService: RedisService);
    createIOServer(port: number, options?: ServerOptions): any;
}
