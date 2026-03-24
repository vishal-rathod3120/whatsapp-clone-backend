import { PrismaService } from '../../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    findById(userId: string): Promise<{
        id: string;
        phoneNumber: string | null;
        email: string | null;
        displayName: string;
        avatarUrl: string | null;
        aboutText: string | null;
        isVerified: boolean;
        createdAt: Date;
    }>;
    updateProfile(userId: string, dto: UpdateProfileDto): Promise<{
        id: string;
        phoneNumber: string | null;
        email: string | null;
        displayName: string;
        avatarUrl: string | null;
        aboutText: string | null;
        isVerified: boolean;
        updatedAt: Date;
    }>;
    blockUser(blockerId: string, blockedId: string): Promise<{
        success: boolean;
    }>;
    unblockUser(blockerId: string, blockedId: string): Promise<{
        success: boolean;
    }>;
    getBlockedUsers(userId: string): Promise<{
        id: string;
        phoneNumber: string | null;
        displayName: string;
        avatarUrl: string | null;
    }[]>;
    isBlocked(blockerId: string, blockedId: string): Promise<boolean>;
}
