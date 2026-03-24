import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ChatType, ChatMemberRole } from '@prisma/client';

@Injectable()
export class ChatsRepository {
  constructor(private prisma: PrismaService) {}

  async findDirectChatBetweenUsers(userId1: string, userId2: string) {
    return this.prisma.chat.findFirst({
      where: {
        type: ChatType.DIRECT,
        AND: [
          { members: { some: { userId: userId1 } } },
          { members: { some: { userId: userId2 } } },
        ],
      },
      include: { members: true },
    });
  }

  async createDirectChat(userId: string, targetUserId: string) {
    return this.prisma.chat.create({
      data: {
        type: ChatType.DIRECT,
        createdById: userId,
        members: {
          create: [
            { userId, role: ChatMemberRole.MEMBER },
            { userId: targetUserId, role: ChatMemberRole.MEMBER },
          ],
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });
  }

  async findChatsByUserId(userId: string, limit: number, cursor?: string) {
    return this.prisma.chat.findMany({
      where: {
        members: {
          some: {
            userId,
            leftAt: null,
          },
        },
      },
      take: limit + 1,
      ...(cursor && {
        skip: 1,
        cursor: { id: cursor },
      }),
      orderBy: { lastMessageAt: 'desc' },
      include: {
        members: {
          where: { leftAt: null },
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
                avatarUrl: true,
                phoneNumber: true,
              },
            },
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            type: true,
            textContent: true,
            senderId: true,
            createdAt: true,
            status: true,
          },
        },
      },
    });
  }

  async findChatById(chatId: string) {
    return this.prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        members: {
          where: { leftAt: null },
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
                avatarUrl: true,
                phoneNumber: true,
                aboutText: true,
              },
            },
          },
        },
      },
    });
  }

  async findChatMember(chatId: string, userId: string) {
    return this.prisma.chatMember.findFirst({
      where: {
        chatId,
        userId,
        leftAt: null,
      },
    });
  }

  async updateLastMessage(chatId: string, messageId: string, lastMessageAt: Date) {
    return this.prisma.chat.update({
      where: { id: chatId },
      data: {
        lastMessageId: messageId,
        lastMessageAt,
      },
    });
  }

  async updateLastReadMessage(chatId: string, userId: string, messageId: string) {
    return this.prisma.chatMember.update({
      where: {
        chatId_userId: {
          chatId,
          userId,
        },
      },
      data: {
        lastReadMessageId: messageId,
      },
    });
  }
}
