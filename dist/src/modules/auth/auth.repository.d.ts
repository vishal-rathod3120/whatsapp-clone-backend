import { PrismaService } from '../../prisma/prisma.service';
import { DeviceType } from '@prisma/client';
export declare class AuthRepository {
    private prisma;
    constructor(prisma: PrismaService);
    findUserByPhoneNumber(phoneNumber: string): Promise<{
        id: string;
        createdAt: Date;
        phoneNumber: string | null;
        email: string | null;
        username: string | null;
        displayName: string;
        avatarUrl: string | null;
        aboutText: string | null;
        passwordHash: string | null;
        isVerified: boolean;
        updatedAt: Date;
    } | null>;
    findUserByEmail(email: string): Promise<{
        id: string;
        createdAt: Date;
        phoneNumber: string | null;
        email: string | null;
        username: string | null;
        displayName: string;
        avatarUrl: string | null;
        aboutText: string | null;
        passwordHash: string | null;
        isVerified: boolean;
        updatedAt: Date;
    } | null>;
    findUserById(id: string): Promise<{
        id: string;
        createdAt: Date;
        phoneNumber: string | null;
        email: string | null;
        username: string | null;
        displayName: string;
        avatarUrl: string | null;
        aboutText: string | null;
        passwordHash: string | null;
        isVerified: boolean;
        updatedAt: Date;
    } | null>;
    createUser(data: {
        displayName: string;
        phoneNumber?: string;
        email?: string;
        passwordHash: string;
        deviceType: DeviceType;
        deviceName?: string;
        pushToken?: string;
    }): Promise<{
        devices: {
            id: string;
            userId: string;
            deviceType: import(".prisma/client").$Enums.DeviceType;
            deviceName: string | null;
            pushToken: string | null;
            refreshTokenHash: string | null;
            publicKey: string | null;
            isRevoked: boolean;
            lastActiveAt: Date | null;
            createdAt: Date;
        }[];
    } & {
        id: string;
        createdAt: Date;
        phoneNumber: string | null;
        email: string | null;
        username: string | null;
        displayName: string;
        avatarUrl: string | null;
        aboutText: string | null;
        passwordHash: string | null;
        isVerified: boolean;
        updatedAt: Date;
    }>;
    createDevice(data: {
        userId: string;
        deviceType: DeviceType;
        deviceName?: string;
        pushToken?: string;
    }): Promise<{
        id: string;
        userId: string;
        deviceType: import(".prisma/client").$Enums.DeviceType;
        deviceName: string | null;
        pushToken: string | null;
        refreshTokenHash: string | null;
        publicKey: string | null;
        isRevoked: boolean;
        lastActiveAt: Date | null;
        createdAt: Date;
    }>;
    updateDeviceRefreshToken(deviceId: string, refreshTokenHash: string): Promise<{
        id: string;
        userId: string;
        deviceType: import(".prisma/client").$Enums.DeviceType;
        deviceName: string | null;
        pushToken: string | null;
        refreshTokenHash: string | null;
        publicKey: string | null;
        isRevoked: boolean;
        lastActiveAt: Date | null;
        createdAt: Date;
    }>;
    findDevicesByUserId(userId: string): Promise<{
        id: string;
        userId: string;
        deviceType: import(".prisma/client").$Enums.DeviceType;
        deviceName: string | null;
        pushToken: string | null;
        refreshTokenHash: string | null;
        publicKey: string | null;
        isRevoked: boolean;
        lastActiveAt: Date | null;
        createdAt: Date;
    }[]>;
    findDeviceById(deviceId: string): Promise<{
        id: string;
        userId: string;
        deviceType: import(".prisma/client").$Enums.DeviceType;
        deviceName: string | null;
        pushToken: string | null;
        refreshTokenHash: string | null;
        publicKey: string | null;
        isRevoked: boolean;
        lastActiveAt: Date | null;
        createdAt: Date;
    } | null>;
}
