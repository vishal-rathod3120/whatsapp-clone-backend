import { PrismaService } from '../../prisma/prisma.service';
import { AuthTokenService } from './auth-token.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
export declare class AuthService {
    private prisma;
    private authTokenService;
    constructor(prisma: PrismaService, authTokenService: AuthTokenService);
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
