import { PrismaService } from '../../prisma/prisma.service';
export declare class UsersRepository {
    private prisma;
    constructor(prisma: PrismaService);
    findById(userId: string): Promise<{
        id: string;
        createdAt: Date;
        phoneNumber: string | null;
        email: string | null;
        displayName: string;
        avatarUrl: string | null;
        aboutText: string | null;
        isVerified: boolean;
    } | null>;
    updateProfile(userId: string, data: {
        displayName?: string;
        aboutText?: string;
        avatarUrl?: string;
    }): Promise<{
        id: string;
        phoneNumber: string | null;
        email: string | null;
        displayName: string;
        avatarUrl: string | null;
        aboutText: string | null;
        isVerified: boolean;
        updatedAt: Date;
    }>;
    findBlockedUsers(blockerId: string): Promise<({
        blocked: {
            id: string;
            phoneNumber: string | null;
            displayName: string;
            avatarUrl: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        blockerId: string;
        blockedId: string;
    })[]>;
    createBlock(blockerId: string, blockedId: string): Promise<{
        id: string;
        createdAt: Date;
        blockerId: string;
        blockedId: string;
    }>;
    deleteBlock(blockerId: string, blockedId: string): Promise<{
        id: string;
        createdAt: Date;
        blockerId: string;
        blockedId: string;
    }>;
    checkBlockExists(blockerId: string, blockedId: string): Promise<{
        id: string;
        createdAt: Date;
        blockerId: string;
        blockedId: string;
    } | null>;
}
