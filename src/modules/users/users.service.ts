import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findById(userId: string) {
    const user = await this.prisma.user.findUnique({
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

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async searchUsers(query: string, currentUserId: string) {
    const users = await this.prisma.user.findMany({
      where: {
        AND: [
          { id: { not: currentUserId } },
          {
            OR: [
              { phoneNumber: { contains: query, mode: 'insensitive' } },
              { displayName: { contains: query, mode: 'insensitive' } },
            ],
          },
        ],
      },
      select: {
        id: true,
        displayName: true,
        phoneNumber: true,
        avatarUrl: true,
        aboutText: true,
      },
      take: 20,
    });
    return users;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        displayName: dto.displayName,
        aboutText: dto.aboutText,
        avatarUrl: dto.avatarUrl,
      },
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

    return user;
  }

  async blockUser(blockerId: string, blockedId: string) {
    // Check if already blocked
    const existingBlock = await this.prisma.userBlock.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId,
          blockedId,
        },
      },
    });

    if (existingBlock) {
      throw new ConflictException('User is already blocked');
    }

    await this.prisma.userBlock.create({
      data: {
        blockerId,
        blockedId,
      },
    });

    return { success: true };
  }

  async unblockUser(blockerId: string, blockedId: string) {
    await this.prisma.userBlock.delete({
      where: {
        blockerId_blockedId: {
          blockerId,
          blockedId,
        },
      },
    });

    return { success: true };
  }

  async getBlockedUsers(userId: string) {
    const blocks = await this.prisma.userBlock.findMany({
      where: { blockerId: userId },
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

    return blocks.map((block) => block.blocked);
  }

  async isBlocked(blockerId: string, blockedId: string): Promise<boolean> {
    const block = await this.prisma.userBlock.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId,
          blockedId,
        },
      },
    });

    return !!block;
  }
}
