import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SendMessageDto, ScheduleMessageDto } from './dto/message.dto';
import { MessageType, MessageStatus, ChatType } from '../../common/enums';
import { MessageQueueService } from '../../common/queue/message-queue.service';
import { uuidv7 } from 'uuidv7';
import { ModuleRef } from '@nestjs/core';
import { MediaService } from '../media/media.service';
import { E2EECryptoService } from '../e2ee/e2ee-crypto.service';
import { SearchService } from '../search/search.service';
import { MetricsService } from '../monitoring/metrics.service';

@Injectable()
export class MessagesService {
  constructor(
    private prisma: PrismaService,
    private messageQueue: MessageQueueService,
    private moduleRef: ModuleRef,
    private mediaService: MediaService,
    private e2eeCrypto: E2EECryptoService,
    private searchService: SearchService,
    private metricsService: MetricsService,
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

    // Calculate expiresAt if chat has a disappearingTimer
    let expiresAt: Date | undefined;
    if (chat.disappearingTimer) {
      expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + chat.disappearingTimer);
    }

    const { isEncrypted, encryptionType } = this.detectEncryptionFlags(dto);

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
          isEncrypted,
          encryptionType,
          expiresAt, // Add expiresAt timestamp
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

    // Fan-out receipts and real-time delivery
    const recipientIds = members
      .filter((m) => m.userId !== senderId)
      .map((m) => m.userId);

    if (recipientIds.length > 0) {
      const BATCH_SIZE = 100;
      const receiptJobs: any[] = [];
      const fanoutJobs: any[] = [];

      // Chunk for receipts
      for (let i = 0; i < recipientIds.length; i += BATCH_SIZE) {
        const chunk = recipientIds.slice(i, i + BATCH_SIZE);
        receiptJobs.push({
          type: 'create_receipts',
          data: {
            messageId: message.id,
            recipientIds: chunk,
          },
          priority: 7, // Lower priority for database syncing
        });
      }

      // Fan-out socket emission in background for large groups (> 50)
      if (recipientIds.length > 50) {
        for (let i = 0; i < recipientIds.length; i += BATCH_SIZE) {
          const chunk = recipientIds.slice(i, i + BATCH_SIZE);
          fanoutJobs.push({
            type: 'fanout_delivery',
            data: {
              messageId: message.id,
              chatId,
              recipientIds: chunk,
              message,
            },
            priority: 3, // High priority for real-time delivery
          });
        }
      } else {
        // Direct delivery for smaller groups
        if (this.chatGateway?.server) {
          recipientIds.forEach((userId) => {
            this.chatGateway.server.to(`user:${userId}`).emit('message:receive', {
              chatId,
              message,
            });
          });
        }
      }

      // Bulk enqueue all background tasks
      await this.messageQueue.bulkEnqueue([...receiptJobs, ...fanoutJobs]);
    }

    // Index message for search
    this.searchService.indexMessage(message);

    // Record metrics
    this.metricsService.incrementMessagesSent();

    return message;
  }

  private detectEncryptionFlags(dto: SendMessageDto): { isEncrypted: boolean; encryptionType: string | null } {
    // If client explicitly sets flags, keep them (but normalize encryptionType).
    if (dto.isEncrypted) {
      return {
        isEncrypted: true,
        encryptionType: dto.encryptionType ?? 'signal',
      };
    }

    if (!dto.textContent || typeof dto.textContent !== 'string') {
      return { isEncrypted: false, encryptionType: null };
    }

    // Try to detect JSON-wrapped Signal payloads.
    // Shapes supported:
    // - Direct (legacy single-device): { header: {...}, ciphertext: '...' }
    // - Direct (multi-device): { [deviceId]: { header, ciphertext, ... } }
    // - Group wrapper: { ciphertext: { header: { groupId, ... }, ciphertext: '...' }, distributionRecords: {...} }
    try {
      const parsed = JSON.parse(dto.textContent);

      // Direct single-device
      if (parsed?.header && parsed?.ciphertext) {
        return { isEncrypted: true, encryptionType: 'signal' };
      }

      // Group wrapper
      if (parsed?.ciphertext?.header?.groupId && parsed?.ciphertext?.ciphertext) {
        return { isEncrypted: true, encryptionType: 'signal' };
      }

      // Multi-device map
      if (parsed && typeof parsed === 'object') {
        for (const value of Object.values(parsed as Record<string, any>)) {
          if (value?.header && value?.ciphertext) {
            return { isEncrypted: true, encryptionType: 'signal' };
          }
        }
      }
    } catch {
      // Not JSON => plaintext
    }

    return { isEncrypted: false, encryptionType: null };
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
        replyToMessage: {
          select: {
            id: true,
            textContent: true,
            type: true,
            senderId: true,
            sender: { select: { displayName: true } },
          },
        },
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
        replyToMessage: {
          select: {
            id: true,
            textContent: true,
            type: true,
            senderId: true,
            sender: { select: { displayName: true } },
          },
        },
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

      const attachmentId = message.attachmentId;

      await this.prisma.message.update({
        where: { id: messageId },
        data: {
          isDeleted: true,
          textContent: null,
          attachmentId: null,
        },
      });

      // Cleanup attachment if it's an orphan
      if (attachmentId) {
        const usageCount = await this.prisma.message.count({
          where: { attachmentId }
        });
        if (usageCount === 0) {
          await this.mediaService.deleteAttachment(attachmentId);
        }
      }

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

      // Remove from search index
      await this.searchService.removeMessage(messageId);

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

    // Update search index
    this.searchService.indexMessage(updated);

    return updated;
  }

  async starMessage(chatId: string, messageId: string, userId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message || message.chatId !== chatId) {
      throw new NotFoundException('Message not found');
    }

    try {
      await this.prisma.starredMessage.create({
        data: {
          userId,
          messageId,
        },
      });
    } catch (err) {
      // Ignore unique constraint violation if already starred
    }

    return { success: true };
  }

  async unstarMessage(chatId: string, messageId: string, userId: string) {
    try {
      await this.prisma.starredMessage.delete({
        where: {
          userId_messageId: {
            userId,
            messageId,
          },
        },
      });
    } catch (err) {
      // Ignore if not found
    }

    return { success: true };
  }

  async getStarredMessages(userId: string) {
    const starred = await this.prisma.starredMessage.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        message: {
          include: {
            chat: {
              select: {
                id: true,
                type: true,
                title: true,
                avatarUrl: true,
                members: {
                  include: {
                    user: { select: { displayName: true, avatarUrl: true }}
                  }
                }
              }
            },
            sender: {
              select: {
                id: true,
                displayName: true,
                avatarUrl: true,
              },
            },
            attachment: true,
          },
        },
      },
    });

    // Format chat titles for direct chats
    return starred.map(s => {
      let chat = s.message.chat;
      if (chat.type === 'DIRECT') {
        const otherMember = chat.members.find(m => m.userId !== userId)?.user;
        chat = {
          ...chat,
          title: otherMember?.displayName || 'Unknown',
          avatarUrl: otherMember?.avatarUrl || null
        };
      }
      return {
        ...s.message,
        chatId: chat.id,
        chatType: chat.type,
        chatTitle: chat.title,
        chatAvatar: chat.avatarUrl,
        starredAt: s.createdAt
      };
    });
  }

  async pinMessage(chatId: string, messageId: string, userId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message || message.chatId !== chatId) {
      throw new NotFoundException('Message not found');
    }

    const updated = await this.prisma.message.update({
      where: { id: messageId },
      data: {
        isPinned: true,
        pinnedAt: new Date(),
        pinnedBy: userId,
      },
    });

    // Broadcast pin to chat members
    const members = await this.prisma.chatMember.findMany({
      where: { chatId, leftAt: null },
      select: { userId: true },
    });
    if (this.chatGateway?.server) {
      members.forEach((m) => {
        this.chatGateway.server.to(`user:${m.userId}`).emit('message:pinned', {
          chatId,
          messageId,
          pinnedBy: userId,
          pinnedAt: updated.pinnedAt,
        });
      });
    }

    return { success: true };
  }

  async unpinMessage(chatId: string, messageId: string, userId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message || message.chatId !== chatId) {
      throw new NotFoundException('Message not found');
    }

    await this.prisma.message.update({
      where: { id: messageId },
      data: {
        isPinned: false,
        pinnedAt: null,
        pinnedBy: null,
      },
    });

    // Broadcast unpin
    const members = await this.prisma.chatMember.findMany({
      where: { chatId, leftAt: null },
      select: { userId: true },
    });
    if (this.chatGateway?.server) {
      members.forEach((m) => {
        this.chatGateway.server.to(`user:${m.userId}`).emit('message:unpinned', {
          chatId,
          messageId,
          unpinnedBy: userId,
        });
      });
    }

    return { success: true };
  }

  async getPinnedMessages(chatId: string, userId: string) {
    // Verify membership
    const isMember = await this.prisma.chatMember.findFirst({
      where: { chatId, userId, leftAt: null },
    });

    if (!isMember) {
      throw new NotFoundException('Chat not found or user is not a member');
    }

    return this.prisma.message.findMany({
      where: {
        chatId,
        isPinned: true,
        isDeleted: false,
      },
      orderBy: { pinnedAt: 'desc' },
      include: {
        sender: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        attachment: true,
      },
    });
  }

  async scheduleMessage(chatId: string, userId: string, dto: ScheduleMessageDto) {
    // Verify membership
    const isMember = await this.prisma.chatMember.findFirst({
      where: { chatId, userId, leftAt: null },
    });

    if (!isMember) {
      throw new ForbiddenException('You must be a member of the chat to schedule messages');
    }

    if (dto.scheduledAt.getTime() <= Date.now()) {
      throw new ForbiddenException('Scheduled time must be in the future');
    }

    const scheduled = await this.prisma.scheduledMessage.create({
      data: {
        chatId,
        userId,
        type: dto.type,
        textContent: dto.textContent,
        attachmentId: dto.attachmentId,
        scheduledAt: dto.scheduledAt,
        status: 'PENDING',
      },
    });

    return scheduled;
  }

  async getScheduledMessages(userId: string) {
    return this.prisma.scheduledMessage.findMany({
      where: { userId },
      orderBy: { scheduledAt: 'asc' },
      include: { attachment: true },
    });
  }

  async cancelScheduledMessage(messageId: string, userId: string) {
    const scheduled = await this.prisma.scheduledMessage.findUnique({
      where: { id: messageId },
    });

    if (!scheduled || scheduled.userId !== userId) {
      throw new NotFoundException('Scheduled message not found');
    }

    if (scheduled.status !== 'PENDING') {
      throw new ForbiddenException(`Cannot cancel message that is already ${scheduled.status}`);
    }

    await this.prisma.scheduledMessage.update({
      where: { id: messageId },
      data: { status: 'CANCELLED' },
    });

    return { success: true };
  }
}
