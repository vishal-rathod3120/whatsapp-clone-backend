import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class StatusService {
  constructor(private prisma: PrismaService) {}

  async createTextStatus(userId: string, textContent: string, bgColor: string) {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
    return this.prisma.status.create({
      data: { userId, type: 'TEXT', textContent, bgColor, expiresAt },
      include: { user: { select: { id: true, displayName: true, avatarUrl: true } } },
    });
  }

  async createImageStatus(userId: string, imageUrl: string, caption?: string) {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    return this.prisma.status.create({
      data: { userId, type: 'IMAGE', imageUrl, caption, expiresAt },
      include: { user: { select: { id: true, displayName: true, avatarUrl: true } } },
    });
  }

  async getMyStatuses(userId: string) {
    return this.prisma.status.findMany({
      where: { userId, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
      include: {
        views: {
          include: { status: false },
        },
        user: { select: { id: true, displayName: true, avatarUrl: true } },
      },
    });
  }

  async getContactStatuses(userId: string) {
    // Get all users this user has chats with
    const userChats = await this.prisma.chatMember.findMany({
      where: { userId, leftAt: null },
      select: { chatId: true },
    });
    const chatIds = userChats.map(c => c.chatId);

    const contactMembers = await this.prisma.chatMember.findMany({
      where: { chatId: { in: chatIds }, userId: { not: userId }, leftAt: null },
      select: { userId: true },
      distinct: ['userId'],
    });
    const contactUserIds = contactMembers.map(m => m.userId);

    // Get statuses from contacts that haven't expired
    const statuses = await this.prisma.status.findMany({
      where: {
        userId: { in: contactUserIds },
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'asc' },
      include: {
        user: { select: { id: true, displayName: true, avatarUrl: true } },
        views: { where: { viewerId: userId }, select: { id: true } },
      },
    });

    // Group by user
    const grouped: Record<string, { user: any; statuses: any[]; hasUnviewed: boolean }> = {};
    for (const s of statuses) {
      if (!grouped[s.userId]) {
        grouped[s.userId] = { user: s.user, statuses: [], hasUnviewed: false };
      }
      const viewed = s.views.length > 0;
      grouped[s.userId].statuses.push({ ...s, viewed });
      if (!viewed) grouped[s.userId].hasUnviewed = true;
    }

    return Object.values(grouped);
  }

  async markViewed(statusId: string, viewerId: string) {
    return this.prisma.statusView.upsert({
      where: { statusId_viewerId: { statusId, viewerId } },
      create: { statusId, viewerId },
      update: {},
    });
  }

  async deleteStatus(statusId: string, userId: string) {
    return this.prisma.status.deleteMany({
      where: { id: statusId, userId },
    });
  }

  async cleanupExpired() {
    return this.prisma.status.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
  }
}
