import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DeviceType } from '@prisma/client';

@Injectable()
export class AuthRepository {
  constructor(private prisma: PrismaService) {}

  async findUserByPhoneNumber(phoneNumber: string) {
    return this.prisma.user.findUnique({
      where: { phoneNumber },
    });
  }

  async findUserByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findUserById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async createUser(data: {
    displayName: string;
    phoneNumber?: string;
    email?: string;
    passwordHash: string;
    deviceType: DeviceType;
    deviceName?: string;
    pushToken?: string;
  }) {
    return this.prisma.user.create({
      data: {
        displayName: data.displayName,
        phoneNumber: data.phoneNumber,
        email: data.email,
        passwordHash: data.passwordHash,
        isVerified: true,
        devices: {
          create: {
            deviceType: data.deviceType,
            deviceName: data.deviceName,
            pushToken: data.pushToken,
            lastActiveAt: new Date(),
          },
        },
      },
      include: {
        devices: true,
      },
    });
  }

  async createDevice(data: {
    userId: string;
    deviceType: DeviceType;
    deviceName?: string;
    pushToken?: string;
  }) {
    return this.prisma.device.create({
      data: {
        userId: data.userId,
        deviceType: data.deviceType,
        deviceName: data.deviceName,
        pushToken: data.pushToken,
        lastActiveAt: new Date(),
      },
    });
  }

  async updateDeviceRefreshToken(deviceId: string, refreshTokenHash: string) {
    return this.prisma.device.update({
      where: { id: deviceId },
      data: {
        refreshTokenHash,
        lastActiveAt: new Date(),
      },
    });
  }

  async findDevicesByUserId(userId: string) {
    return this.prisma.device.findMany({
      where: { userId },
    });
  }

  async findDeviceById(deviceId: string) {
    return this.prisma.device.findUnique({
      where: { id: deviceId },
    });
  }
}
