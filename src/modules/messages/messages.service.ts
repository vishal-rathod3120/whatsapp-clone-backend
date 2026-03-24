import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SendMessageDto } from './dto/message.dto';
import { MessageType, MessageStatus } from '../../common/enums';
import { MessageQueueService } from '../../common/queue/message-queue.service';

@Injectable()
export class MessagesService {
  constructor(
    private prisma: PrismaService,
    private messageQueue: MessageQueueService,
  ) {}

  async createMessage(chatId: string, senderId: string, dto: SendMessageDto) {
    // Get chat members to create receipts
    const members = await this.prisma.chatMember.findMany({
      where: {
        chatId,
        leftAt: null,
      },
    });

    // Create message and update chat in transaction (fast operations)
    const message = await this.prisma.$transaction(async (tx) => {
      // Create the message
      const msg = await tx.message.create({
        data: {
          chatId,
          senderId,
          clientTempId: dto.clientTempId,
          type: dto.type,
          textContent: dto.textContent,
          attachmentId: dto.attachmentId,
          replyToMessageId: dto.replyToMessageId,
          status: MessageStatus.SENT,
        },
      });

      // Update chat's last message
      await tx.chat.update({
        where: { id: chatId },
        data: {
          lastMessageId: msg.id,
          lastMessageAt: msg.createdAt,
        },
      });

      return msg;
    });

    // Offload receipt creation to background queue (prevents blocking for large groups)
    const recipientIds = members
      .filter((m) => m.userId !== senderId)
      .map((m) => m.userId);

    if (recipientIds.length > 0) {
      await this.messageQueue.enqueue({
        type: 'create_receipts',
        data: {
          messageId: message.id,
          recipientIds,
        },
        priority: 5,
        maxAttempts: 3,
      });
    }

    return this.getMessageById(message.id);
  }

  async getMessageById(messageId: string) {
    const message = await this.prisma.message.findUnique({
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

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    return message;
  }

  async getMessages(chatId: string, userId: string, limit: number = 30, cursor?: string) {
    // Verify user is a member of the chat
    const isMember = await this.prisma.chatMember.findFirst({
      where: {
        chatId,
        userId,
        leftAt: null,
      },
    });

    if (!isMember) {
      throw new NotFoundException('Chat not found or user is not a member');
    }

    const messages = await this.prisma.message.findMany({
      where: {
        chatId,
        isDeleted: false,
      },
      take: limit + 1,
      ...(cursor && {
        skip: 1,
        cursor: { id: cursor },
      }),
      orderBy: { createdAt: 'desc' },
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

    const hasMore = messages.length > limit;
    const items = hasMore ? messages.slice(0, limit) : messages;
    const nextCursor = hasMore ? items[items.length - 1]?.id : null;

    return {
      items: items.reverse(),
      nextCursor,
    };
  }

  async markAsDelivered(messageId: string, userId: string) {
    const receipt = await this.prisma.messageReceipt.updateMany({
      where: {
        messageId,
        userId,
        deliveredAt: null,
      },
      data: {
        deliveredAt: new Date(),
      },
    });

    return receipt.count > 0;
  }

  async markAsSeen(messageId: string, userId: string) {
    const receipt = await this.prisma.messageReceipt.updateMany({
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

    return receipt.count > 0;
  }

  async getUnreadCount(chatId: string, userId: string): Promise<number> {
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

  async getMissedMessages(userId: string, since: Date) {
    // Get all chats where user is a member
    const chatIds = await this.prisma.chatMember.findMany({
      where: {
        userId,
        leftAt: null,
      },
      select: {
        chatId: true,
      },
    });

    const chatIdList = chatIds.map((c) => c.chatId);

    if (chatIdList.length === 0) {
      return [];
    }

    // Get messages sent after user's last seen that haven't been seen yet
    const messages = await this.prisma.message.findMany({
      where: {
        chatId: { in: chatIdList },
        senderId: { not: userId },
        createdAt: { gte: since },
        receipts: {
          some: {
            userId,
            seenAt: null,
          },
        },
        isDeleted: false,
      },
      orderBy: { createdAt: 'asc' },
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

    return messages;
  }
}
