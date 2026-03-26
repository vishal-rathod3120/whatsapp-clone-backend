import { PrismaService } from '../../prisma/prisma.service';
export declare class UsersRepository {
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
    } | null>;
    updateProfile(userId: string, data: {
        displayName?: string;
        aboutText?: string;
        avatarUrl?: string;
    }): Promise<{
        id: string;
        avatarUrl: string | null;
        updatedAt: Date;
        phoneNumber: string | null;
        email: string | null;
        displayName: string;
        aboutText: string | null;
        isVerified: boolean;
    }>;
    findBlockedUsers(blockerId: string): Promise<({
        blocked: {
            id: string;
            avatarUrl: string | null;
            phoneNumber: string | null;
            displayName: string;
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
