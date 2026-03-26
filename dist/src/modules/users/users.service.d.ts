import { PrismaService } from '../../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    findById(userId: string): Promise<{
        id: string;
        avatarUrl: string | null;
        createdAt: Date;
        phoneNumber: string | null;
        email: string | null;
        displayName: string;
        aboutText: string | null;
        isVerified: boolean;
    }>;
    searchUsers(query: string, currentUserId: string): Promise<{
        id: string;
        avatarUrl: string | null;
        phoneNumber: string | null;
        displayName: string;
        aboutText: string | null;
    }[]>;
    updateProfile(userId: string, dto: UpdateProfileDto): Promise<{
        id: string;
        avatarUrl: string | null;
        updatedAt: Date;
        phoneNumber: string | null;
        email: string | null;
        displayName: string;
        aboutText: string | null;
        isVerified: boolean;
    }>;
    blockUser(blockerId: string, blockedId: string): Promise<{
        success: boolean;
    }>;
    unblockUser(blockerId: string, blockedId: string): Promise<{
        success: boolean;
    }>;
    getBlockedUsers(userId: string): Promise<{
        id: string;
        avatarUrl: string | null;
        phoneNumber: string | null;
        displayName: string;
    }[]>;
    isBlocked(blockerId: string, blockedId: string): Promise<boolean>;
}
