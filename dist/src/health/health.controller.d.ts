import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
export declare class HealthController {
    private prisma;
    private redis;
    constructor(prisma: PrismaService, redis: RedisService);
    check(): Promise<{
        status: string;
        timestamp: string;
        checks: {
            database: {
                status: string;
                message?: undefined;
            } | {
                status: string;
                message: string;
            };
            redis: {
                status: string;
                message?: undefined;
            } | {
                status: string;
                message: string;
            };
        };
    }>;
    private checkDatabase;
    private checkRedis;
}
