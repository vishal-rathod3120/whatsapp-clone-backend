import { PrismaService } from '../../prisma/prisma.service';
import { DeviceType } from '@prisma/client';
export declare class AuthRepository {
    private prisma;
    constructor(prisma: PrismaService);
    findUserByPhoneNumber(phoneNumber: string): Promise<{
        id: string;
        phoneNumber: string | null;
        email: string | null;
        username: string | null;
        displayName: string;
        avatarUrl: string | null;
        aboutText: string | null;
        passwordHash: string | null;
        isVerified: boolean;
        createdAt: Date;
        updatedAt: Date;
    } | null>;
    findUserByEmail(email: string): Promise<{
        id: string;
        phoneNumber: string | null;
        email: string | null;
        username: string | null;
        displayName: string;
        avatarUrl: string | null;
        aboutText: string | null;
        passwordHash: string | null;
        isVerified: boolean;
        createdAt: Date;
        updatedAt: Date;
    } | null>;
    findUserById(id: string): Promise<{
        id: string;
        phoneNumber: string | null;
        email: string | null;
        username: string | null;
        displayName: string;
        avatarUrl: string | null;
        aboutText: string | null;
        passwordHash: string | null;
        isVerified: boolean;
        createdAt: Date;
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
            createdAt: Date;
            userId: string;
            deviceType: import(".prisma/client").$Enums.DeviceType;
            deviceName: string | null;
            pushToken: string | null;
            refreshTokenHash: string | null;
            publicKey: string | null;
            isRevoked: boolean;
            lastActiveAt: Date | null;
        }[];
    } & {
        id: string;
        phoneNumber: string | null;
        email: string | null;
        username: string | null;
        displayName: string;
        avatarUrl: string | null;
        aboutText: string | null;
        passwordHash: string | null;
        isVerified: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    createDevice(data: {
        userId: string;
        deviceType: DeviceType;
        deviceName?: string;
        pushToken?: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        deviceType: import(".prisma/client").$Enums.DeviceType;
        deviceName: string | null;
        pushToken: string | null;
        refreshTokenHash: string | null;
        publicKey: string | null;
        isRevoked: boolean;
        lastActiveAt: Date | null;
    }>;
    updateDeviceRefreshToken(deviceId: string, refreshTokenHash: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        deviceType: import(".prisma/client").$Enums.DeviceType;
        deviceName: string | null;
        pushToken: string | null;
        refreshTokenHash: string | null;
        publicKey: string | null;
        isRevoked: boolean;
        lastActiveAt: Date | null;
    }>;
    findDevicesByUserId(userId: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        deviceType: import(".prisma/client").$Enums.DeviceType;
        deviceName: string | null;
        pushToken: string | null;
        refreshTokenHash: string | null;
        publicKey: string | null;
        isRevoked: boolean;
        lastActiveAt: Date | null;
    }[]>;
    findDeviceById(deviceId: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        deviceType: import(".prisma/client").$Enums.DeviceType;
        deviceName: string | null;
        pushToken: string | null;
        refreshTokenHash: string | null;
        publicKey: string | null;
        isRevoked: boolean;
        lastActiveAt: Date | null;
    } | null>;
}
