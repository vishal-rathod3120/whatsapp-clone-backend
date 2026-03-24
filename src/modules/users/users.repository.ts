import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UsersRepository {
  constructor(private prisma: PrismaService) {}

  async findById(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        displayName: true,
        phoneNumber: true,
        email: true,
        avatarUrl: true,
        aboutText: true,
        isVerified: true,
        createdAt: true,
      },
    });
  }

  async updateProfile(userId: string, data: {
    displayName?: string;
    aboutText?: string;
    avatarUrl?: string;
  }) {
    return this.prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        displayName: true,
        phoneNumber: true,
        email: true,
        avatarUrl: true,
        aboutText: true,
        isVerified: true,
        updatedAt: true,
      },
    });
  }

  async findBlockedUsers(blockerId: string) {
    return this.prisma.userBlock.findMany({
      where: { blockerId },
      include: {
        blocked: {
          select: {
            id: true,
            displayName: true,
            phoneNumber: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  async createBlock(blockerId: string, blockedId: string) {
    return this.prisma.userBlock.create({
      data: {
        blockerId,
        blockedId,
      },
    });
  }

  async deleteBlock(blockerId: string, blockedId: string) {
    return this.prisma.userBlock.delete({
      where: {
        blockerId_blockedId: {
          blockerId,
          blockedId,
        },
      },
    });
  }

  async checkBlockExists(blockerId: string, blockedId: string) {
    return this.prisma.userBlock.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId,
          blockedId,
        },
      },
    });
  }
}
