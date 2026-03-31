import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CommunitiesService {
  constructor(private prisma: PrismaService) {}

  async createCommunity(userId: string, data: { name: string; description?: string; avatarUrl?: string }) {
    return await this.prisma.$transaction(async (tx) => {
      // 1. Create the Community + Membership
      const community = await tx.community.create({
        data: {
          name: data.name,
          description: data.description,
          avatarUrl: data.avatarUrl,
          createdById: userId,
          members: {
            create: {
              userId,
              role: 'OWNER'
            }
          }
        }
      });
      
      // 2. Create the Announcements Channel
      const announcementChat = await tx.chat.create({
        data: {
          type: 'CHANNEL',
          title: `Announcements - ${data.name}`,
          description: 'Official announcements for this community',
          isAnnouncement: true,
          createdById: userId,
          communityId: community.id,
          avatarUrl: data.avatarUrl,
          members: {
            create: {
              userId,
              role: 'OWNER'
            }
          }
        }
      });
      
      return { community, announcementChat };
    });
  }

  async getUserCommunities(userId: string) {
    return this.prisma.community.findMany({
      where: {
        members: {
          some: { userId }
        }
      },
      include: {
        chats: {
          select: {
            id: true,
            title: true,
            type: true,
            isAnnouncement: true,
            avatarUrl: true
          }
        },
        _count: {
          select: { members: true }
        }
      }
    });
  }

  async addGroupToCommunity(userId: string, communityId: string, chatId: string) {
    const community = await this.prisma.community.findUnique({
      where: { id: communityId },
      include: { members: { where: { userId } } }
    });
    
    if (!community || community.members.length === 0 || (community.members[0].role !== 'OWNER' && community.members[0].role !== 'ADMIN')) {
      throw new ForbiddenException('Only community admins can add groups');
    }
    
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      include: { members: { where: { userId } } }
    });
    
    if (!chat || chat.type !== 'GROUP' || (chat.members[0]?.role !== 'OWNER' && chat.members[0]?.role !== 'ADMIN')) {
      throw new ForbiddenException('You must be a group admin to link it to a community');
    }
    
    return this.prisma.chat.update({
      where: { id: chatId },
      data: { communityId }
    });
  }

  async removeGroupFromCommunity(userId: string, communityId: string, chatId: string) {
    const community = await this.prisma.community.findUnique({
      where: { id: communityId },
      include: { members: { where: { userId } } }
    });
    
    if (!community || community.members.length === 0 || (community.members[0].role !== 'OWNER' && community.members[0].role !== 'ADMIN')) {
      throw new ForbiddenException('Only community admins can unmap groups');
    }
    
    return this.prisma.chat.update({
      where: { id: chatId },
      data: { communityId: null }
    });
  }
}
