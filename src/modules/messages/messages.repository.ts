import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MessageType, MessageStatus } from '@prisma/client';
import { uuidv7 } from 'uuidv7';

@Injectable()
export class MessagesRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    chatId: string;
    senderId: string;
    clientTempId?: string;
    type: MessageType;
    textContent?: string;
    attachmentId?: string;
    replyToMessageId?: string;
  }) {
    return this.prisma.message.create({
      data: {
        id: uuidv7(),
        chatId: data.chatId,
        senderId: data.senderId,
        clientTempId: data.clientTempId,
        type: data.type,
        textContent: data.textContent,
        attachmentId: data.attachmentId,
        replyToMessageId: data.replyToMessageId,
        status: MessageStatus.SENT,
      },
      include: {
        sender: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        attachment: true,
        receipts: {
          select: {
            userId: true,
            deliveredAt: true,
            seenAt: true,
          },
        },
      },
    });
  }

  async findById(messageId: string) {
    return this.prisma.message.findUnique({
      where: { id: messageId },
      include: {
        sender: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        attachment: true,
        receipts: {
          select: {
            userId: true,
            deliveredAt: true,
            seenAt: true,
          },
        },
      },
    });
  }

  async findByChatId(chatId: string, userId: string, limit: number, cursor?: string) {
    return this.prisma.message.findMany({
      where: {
        chatId,
        isDeleted: false,
      },
      take: limit + 1,
      ...(cursor && {
        skip: 1,
        cursor: { id: cursor },
      }),
      orderBy: [
        { createdAt: 'desc' },
        { id: 'desc' },
      ],
      include: {
        sender: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        attachment: true,
        receipts: {
          where: {
            userId: { not: userId },
          },
          select: {
            userId: true,
            deliveredAt: true,
            seenAt: true,
          },
        },
      },
    });
  }

  async createReceipts(messageId: string, userIds: string[]) {
    const data = userIds.map((userId) => ({
      messageId,
      userId,
    }));
    return this.prisma.messageReceipt.createMany({
      data,
    });
  }

  async markAsDelivered(messageId: string, userId: string) {
    return this.prisma.messageReceipt.updateMany({
      where: {
        messageId,
        userId,
        deliveredAt: null,
      },
      data: {
        deliveredAt: new Date(),
      },
    });
  }

  async markAsSeen(messageId: string, userId: string) {
    return this.prisma.messageReceipt.updateMany({
      where: {
        messageId,
        userId,
        seenAt: null,
      },
      data: {
        seenAt: new Date(),
        deliveredAt: { set: new Date() },
      },
    });
  }

  async getUnreadCount(chatId: string, userId: string) {
    return this.prisma.message.count({
      where: {
        chatId,
        senderId: { not: userId },
        receipts: {
          some: {
            userId,
            seenAt: null,
          },
        },
      },
    });
  }
}
