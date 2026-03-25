import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SendMessageDto } from './dto/message.dto';
import { MessageType, MessageStatus, ChatType } from '../../common/enums';
import { MessageQueueService } from '../../common/queue/message-queue.service';
import { uuidv7 } from 'uuidv7';
import { ModuleRef } from '@nestjs/core';
// import { ChatGateway } from '../gateway/chat.gateway'; // Removed direct import to break potential cyclic dependency
// import { forwardRef, Inject } from '@nestjs/common'; // Not needed if not directly injecting

@Injectable()
export class MessagesService {
  constructor(
    private prisma: PrismaService,
    private messageQueue: MessageQueueService,
    private moduleRef: ModuleRef,
  ) {}

  private get chatGateway(): any {
    try {
      return this.moduleRef.get('ChatGateway', { strict: false });
    } catch (e) {
      console.warn('ChatGateway not found in moduleRef');
      return null;
    }
  }

  async createMessage(chatId: string, senderId: string, dto: SendMessageDto) {
    // Fetch chat to verify block status and get members
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      include: { members: { where: { leftAt: null } } }
    });

    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    if (chat.type === ChatType.DIRECT) {
      const recipient = chat.members.find(m => m.userId !== senderId);
      if (recipient) {
        // Enforce blocking logic
        const block = await this.prisma.userBlock.findFirst({
          where: {
            OR: [
              { blockerId: recipient.userId, blockedId: senderId },
              { blockerId: senderId, blockedId: recipient.userId }
            ]
          }
        });
        
        if (block) {
          throw new ForbiddenException('Cannot send messages to this contact');
        }
      }
    }

    const members = chat.members;

    if (dto.replyToMessageId) {
      const replyMsg = await this.prisma.message.findUnique({
        where: { id: dto.replyToMessageId },
        select: { chatId: true }
      });
      if (!replyMsg || replyMsg.chatId !== chatId) {
        throw new NotFoundException('Reply message not found in this chat');
      }
    }

    // Create message and update chat in transaction (fast operations)
    const message = await this.prisma.$transaction(async (tx) => {
      // Create the message
      const msg = await tx.message.create({
        data: {
          id: uuidv7(),
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
        deletedByUsers: { none: { userId } },
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
        deletedByUsers: { none: { userId } },
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

  async deleteMessage(chatId: string, messageId: string, userId: string, forEveryone: boolean) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message || message.chatId !== chatId) {
      throw new NotFoundException('Message not found');
    }

    if (forEveryone) {
      if (message.senderId !== userId) {
        throw new ForbiddenException('You can only delete your own messages for everyone');
      }

      const fifteenMinutesMs = 15 * 60 * 1000;
      if (Date.now() - message.createdAt.getTime() > fifteenMinutesMs) {
        throw new ForbiddenException('You can only delete messages within 15 minutes of sending');
      }

      await this.prisma.message.update({
        where: { id: messageId },
        data: {
          isDeleted: true,
          textContent: null,
          attachmentId: null,
        },
      });

      // Broadcast deletion
      const members = await this.prisma.chatMember.findMany({
        where: { chatId, leftAt: null },
        select: { userId: true },
      });
      if (this.chatGateway?.server) {
        members.forEach((m) => {
          this.chatGateway.server.to(`user:${m.userId}`).emit('message:deleted', {
            chatId,
            messageId,
            deletedForEveryone: true,
          });
        });
      }

      return { success: true, type: 'EVERYONE' };
    } else {
      await this.prisma.deletedMessage.upsert({
        where: {
          messageId_userId: { userId, messageId },
        },
        update: {},
        create: {
          userId,
          messageId,
        },
      });

      return { success: true, type: 'ME' };
    }
  }

  async editMessage(chatId: string, messageId: string, userId: string, newTextContent: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message || message.chatId !== chatId) {
      throw new NotFoundException('Message not found');
    }

    if (message.senderId !== userId) {
      throw new ForbiddenException('You can only edit your own messages');
    }

    if (message.type !== MessageType.TEXT) {
      throw new ForbiddenException('Only text messages can be edited');
    }

    const fifteenMinutesMs = 15 * 60 * 1000;
    if (Date.now() - message.createdAt.getTime() > fifteenMinutesMs) {
      throw new ForbiddenException('You can only edit messages within 15 minutes of sending');
    }

    const updated = await this.prisma.message.update({
      where: { id: messageId },
      data: {
        textContent: newTextContent,
        editedAt: new Date(),
      },
    });

    // Broadcast edit
    const members = await this.prisma.chatMember.findMany({
      where: { chatId, leftAt: null },
      select: { userId: true },
    });
    members.forEach((m) => {
      this.chatGateway.server.to(`user:${m.userId}`).emit('message:edited', {
        chatId,
        messageId,
        textContent: newTextContent,
        editedAt: updated.editedAt,
      });
    });

    return updated;
  }
}
