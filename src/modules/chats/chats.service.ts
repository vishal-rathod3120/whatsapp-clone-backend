import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDirectChatDto } from './dto/chat.dto';
import { ChatType, ChatMemberRole } from '../../common/enums';

@Injectable()
export class ChatsService {
  constructor(private prisma: PrismaService) {}

  async createDirectChat(userId: string, dto: CreateDirectChatDto) {
    // Check if chat already exists between these users
    const existingChat = await this.prisma.chat.findFirst({
      where: {
        type: ChatType.DIRECT,
        AND: [
          { members: { some: { userId } } },
          { members: { some: { userId: dto.targetUserId } } },
        ],
      },
      include: { members: true },
    });

    if (existingChat) {
      return existingChat;
    }

    // Create new direct chat
    const chat = await this.prisma.chat.create({
      data: {
        type: ChatType.DIRECT,
        createdById: userId,
        members: {
          create: [
            { userId, role: ChatMemberRole.MEMBER },
            { userId: dto.targetUserId, role: ChatMemberRole.MEMBER },
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

    return chat;
  }

  async getChatList(userId: string, limit: number = 20, cursor?: string) {
    const chats = await this.prisma.chat.findMany({
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

    const hasMore = chats.length > limit;
    const items = hasMore ? chats.slice(0, limit) : chats;
    const nextCursor = hasMore ? items[items.length - 1]?.id : null;

    // Calculate unread count for each chat
    const chatListWithUnread = await Promise.all(
      items.map(async (chat) => {
        const unreadCount = await this.prisma.message.count({
          where: {
            chatId: chat.id,
            senderId: { not: userId },
            receipts: {
              none: {
                userId,
                seenAt: { not: null },
              },
            },
          },
        });

        // Get other member for direct chat
        const otherMember = chat.type === ChatType.DIRECT
          ? chat.members.find((m) => m.userId !== userId)?.user
          : null;

        return {
          id: chat.id,
          type: chat.type,
          title: chat.type === ChatType.DIRECT
            ? otherMember?.displayName
            : chat.title,
          avatarUrl: chat.type === ChatType.DIRECT
            ? otherMember?.avatarUrl
            : chat.avatarUrl,
          lastMessage: chat.messages[0] || null,
          unreadCount,
          lastMessageAt: chat.lastMessageAt,
          members: chat.members.map((m) => ({
            userId: m.userId,
            displayName: m.user.displayName,
            avatarUrl: m.user.avatarUrl,
          })),
        };
      }),
    );

    return {
      items: chatListWithUnread,
      nextCursor,
    };
  }

  async getChatById(chatId: string, userId: string) {
    const chat = await this.prisma.chat.findFirst({
      where: {
        id: chatId,
        members: {
          some: {
            userId,
            leftAt: null,
          },
        },
      },
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

    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    // Get other member for direct chat
    const otherMember = chat.type === ChatType.DIRECT
      ? chat.members.find((m) => m.userId !== userId)?.user
      : null;

    return {
      id: chat.id,
      type: chat.type,
      title: chat.type === ChatType.DIRECT
        ? otherMember?.displayName
        : chat.title,
      avatarUrl: chat.type === ChatType.DIRECT
        ? otherMember?.avatarUrl
        : chat.avatarUrl,
      members: chat.members.map((m) => ({
        userId: m.userId,
        displayName: m.user.displayName,
        avatarUrl: m.user.avatarUrl,
        role: m.role,
      })),
    };
  }

  async markChatAsRead(chatId: string, userId: string, lastReadMessageId?: string) {
    // Update all unread messages as seen
    await this.prisma.messageReceipt.updateMany({
      where: {
        message: {
          chatId,
        },
        userId,
        seenAt: null,
      },
      data: {
        seenAt: new Date(),
      },
    });

    // Update last read message in chat member
    if (lastReadMessageId) {
      await this.prisma.chatMember.update({
        where: {
          chatId_userId: {
            chatId,
            userId,
          },
        },
        data: {
          lastReadMessageId,
        },
      });
    }

    return { success: true };
  }

  async isChatMember(chatId: string, userId: string): Promise<boolean> {
    const member = await this.prisma.chatMember.findFirst({
      where: {
        chatId,
        userId,
        leftAt: null,
      },
    });

    return !!member;
  }

  async getOtherMemberId(chatId: string, userId: string): Promise<string | null> {
    const otherMember = await this.prisma.chatMember.findFirst({
      where: {
        chatId,
        userId: { not: userId },
        leftAt: null,
      },
    });

    return otherMember?.userId || null;
  }
}
