import { PrismaService } from '../../prisma/prisma.service';
import { AuthTokenService } from './auth-token.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { RedisService } from '../../redis/redis.service';
import { SecurityLogService } from './security-log.service';
export declare class AuthService {
    private prisma;
    private authTokenService;
    private redis;
    private securityLog;
    constructor(prisma: PrismaService, authTokenService: AuthTokenService, redis: RedisService, securityLog: SecurityLogService);
    register(dto: RegisterDto): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            id: string;
            displayName: string;
            phoneNumber: string | null;
            avatarUrl: string | null;
        };
        deviceId: string;
    }>;
    login(dto: LoginDto): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            id: string;
            displayName: string;
            phoneNumber: string | null;
            avatarUrl: string | null;
        };
        deviceId: string;
    }>;
    refreshTokens(refreshToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    logout(userId: string, deviceId?: string): Promise<{
        success: boolean;
    }>;
}
