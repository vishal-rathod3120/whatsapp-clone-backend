import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDirectChatDto } from './dto/chat.dto';
import { ChatType, ChatMemberRole } from '../../common/enums';
import { MediaService } from '../media/media.service';

@Injectable()
export class ChatsService {
  constructor(
    private prisma: PrismaService,
    private mediaService: MediaService,
  ) {}

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

  async createGroupChat(userId: string, dto: { title: string; memberUserIds: string[]; avatarUrl?: string }) {
    const uniqueMembers = Array.from(new Set(dto.memberUserIds.filter(id => id !== userId)));

    const membersData = [
      { userId, role: ChatMemberRole.OWNER },
      ...uniqueMembers.map(id => ({ userId: id, role: ChatMemberRole.MEMBER }))
    ];

    const chat = await this.prisma.chat.create({
      data: {
        type: ChatType.GROUP,
        title: dto.title,
        avatarUrl: dto.avatarUrl,
        createdById: userId,
        members: {
          create: membersData,
        },
      },
      include: {
        members: {
          include: {
            user: { select: { id: true, displayName: true, avatarUrl: true } }
          }
        }
      }
    });

    return chat;
  }

  async addGroupMembers(chatId: string, requesterId: string, userIds: string[]) {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      include: { members: { where: { leftAt: null } } }
    });

    if (!chat || chat.type !== ChatType.GROUP) {
      throw new NotFoundException('Group chat not found');
    }

    const requester = chat.members.find(m => m.userId === requesterId);
    if (!requester || (requester.role !== ChatMemberRole.ADMIN && requester.role !== ChatMemberRole.OWNER)) {
      throw new ForbiddenException('Only admins can add members');
    }

    const currentMemberIds = new Set(chat.members.map(m => m.userId));
    const newMembers = userIds.filter(id => !currentMemberIds.has(id));

    if (newMembers.length > 0) {
      await this.prisma.chatMember.createMany({
        data: newMembers.map(id => ({
          chatId,
          userId: id,
          role: ChatMemberRole.MEMBER
        }))
      });
    }

    return { success: true, added: newMembers.length };
  }

  async removeGroupMember(chatId: string, requesterId: string, targetUserId: string) {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      include: { members: { where: { leftAt: null } } }
    });

    if (!chat || chat.type !== ChatType.GROUP) throw new NotFoundException('Group chat not found');

    const requester = chat.members.find(m => m.userId === requesterId);
    if (!requester) throw new ForbiddenException('Not a member');

    const targetMember = chat.members.find(m => m.userId === targetUserId);
    if (!targetMember) throw new NotFoundException('User is not a member');

    if (requesterId !== targetUserId) {
      if (requester.role === ChatMemberRole.MEMBER) throw new ForbiddenException('Only admins can remove members');
      if (requester.role === ChatMemberRole.ADMIN && targetMember.role === ChatMemberRole.OWNER) {
        throw new ForbiddenException('Admins cannot remove the owner');
      }
    }

    await this.prisma.chatMember.update({
      where: { chatId_userId: { chatId, userId: targetUserId } },
      data: { leftAt: new Date() }
    });

    return { success: true };
  }

  async updateMemberRole(chatId: string, requesterId: string, targetUserId: string, newRole: ChatMemberRole) {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      include: { members: { where: { leftAt: null } } }
    });

    if (!chat || chat.type !== ChatType.GROUP) throw new NotFoundException('Group chat not found');

    const requester = chat.members.find(m => m.userId === requesterId);
    if (!requester || requester.role !== ChatMemberRole.OWNER) {
      throw new ForbiddenException('Only the owner can manage roles');
    }

    const targetMember = chat.members.find(m => m.userId === targetUserId);
    if (!targetMember) throw new NotFoundException('User not found in group');

    await this.prisma.chatMember.update({
      where: { chatId_userId: { chatId, userId: targetUserId } },
      data: { role: newRole }
    });

    return { success: true };
  }

  async updateGroupInfo(chatId: string, requesterId: string, title?: string, avatarUrl?: string) {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      include: { members: { where: { leftAt: null } } }
    });

    if (!chat || chat.type !== ChatType.GROUP) throw new NotFoundException('Group chat not found');

    const requester = chat.members.find(m => m.userId === requesterId);
    if (!requester || (requester.role !== ChatMemberRole.ADMIN && requester.role !== ChatMemberRole.OWNER)) {
      throw new ForbiddenException('Only admins can update group info');
    }

    const updated = await this.prisma.chat.update({
      where: { id: chatId },
      data: { title, avatarUrl }
    });

    return updated;
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
      orderBy: [
        { members: { _count: 'desc' } }, // This isn't quite right for per-user pinning in a global findMany
        { lastMessageAt: 'desc' }
      ],
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

        const userMember = chat.members.find(m => m.userId === userId);
        
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
          isPinned: userMember?.isPinned || false,
          isMuted: userMember?.isMuted || false,
          mutedUntil: userMember?.mutedUntil || null,
          wallpaperUrl: userMember?.wallpaperUrl || null,
          members: chat.members.map((m) => ({
            userId: m.userId,
            displayName: m.user.displayName,
            avatarUrl: m.user.avatarUrl,
            role: m.role,
            phoneNumber: m.user.phoneNumber,
            aboutText: m.user.aboutText,
          })),
        };
      }),
    );

    // Sort by pinned first, then by last message time
    const sortedItems = chatListWithUnread.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      const timeA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const timeB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return timeB - timeA;
    });

    return {
      items: sortedItems,
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
        phoneNumber: m.user.phoneNumber,
        aboutText: m.user.aboutText,
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

  async isChatMuted(chatId: string, userId: string): Promise<boolean> {
    const member = await this.prisma.chatMember.findUnique({
      where: {
        chatId_userId: { chatId, userId }
      },
      select: { isMuted: true }
    });
    return member?.isMuted || false;
  }

  async getMutualContactIds(userId: string): Promise<string[]> {
    const chats = await this.prisma.chatMember.findMany({
      where: { userId, leftAt: null },
      select: { chatId: true }
    });
    
    if (chats.length === 0) return [];

    const chatIds = chats.map(c => c.chatId);
    
    const mutuals = await this.prisma.chatMember.findMany({
      where: { 
        chatId: { in: chatIds }, 
        userId: { not: userId }, 
        leftAt: null 
      },
      select: { userId: true },
      distinct: ['userId']
    });

    return mutuals.map(m => m.userId);
  }

  async deleteGroup(chatId: string, userId: string) {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      include: { 
        members: true,
        messages: {
          where: { attachmentId: { not: null } },
          select: { attachmentId: true }
        }
      }
    });

    if (!chat || chat.type !== ChatType.GROUP) {
      throw new NotFoundException('Group chat not found');
    }

    const owner = chat.members.find(m => m.userId === userId && m.role === ChatMemberRole.OWNER);
    if (!owner) {
      throw new ForbiddenException('Only the owner can delete the group');
    }

    // Get all unique attachments to delete
    const attachmentIds = Array.from(new Set(chat.messages.map(m => m.attachmentId).filter(Boolean) as string[]));

    // Delete chat (Prisma Cascade should handle members/messages/receipts if set up)
    await this.prisma.chat.delete({
      where: { id: chatId }
    });

    // Cleanup files in background
    for (const attachmentId of attachmentIds) {
      // Check if attachment is used elsewhere (e.g. forward)
      const otherUsage = await this.prisma.message.count({
        where: { attachmentId }
      });
      if (otherUsage === 0) {
        await this.mediaService.deleteAttachment(attachmentId);
      }
    }

    // Broadcast deletion
    try {
      const gateway = (this as any).moduleRef.get('ChatGateway', { strict: false });
      if (gateway?.server) {
        chat.members.forEach((m) => {
          gateway.server.to(`user:${m.userId}`).emit('chat:deleted', { chatId });
        });
      }
    } catch (e) {
      // Gateway might not be available
    }

    return { success: true };
  }

  async updateDisappearingTimer(chatId: string, requesterId: string, timer: number | null) {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      include: { members: { where: { leftAt: null } } }
    });

    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    const requester = chat.members.find(m => m.userId === requesterId);
    if (!requester) {
      throw new ForbiddenException('Only members can update the disappearing timer');
    }

    const updated = await this.prisma.chat.update({
      where: { id: chatId },
      data: { disappearingTimer: timer }
    });

    // We can emit a socket event if gateway is accessible
    try {
      const gateway = (this as any).moduleRef?.get('ChatGateway', { strict: false });
      if (gateway?.server) {
        chat.members.forEach((m) => {
          gateway.server.to(`user:${m.userId}`).emit('chat:updated', { 
            chatId, 
            disappearingTimer: timer 
          });
        });
      }
    } catch (e) {
      // Gateway access failed
    }

    return updated;
  }

  async togglePin(chatId: string, userId: string, isPinned: boolean) {
    await this.prisma.chatMember.update({
      where: { chatId_userId: { chatId, userId } },
      data: { isPinned }
    });
    return { success: true, isPinned };
  }

  async updateMute(chatId: string, userId: string, isMuted: boolean, mutedUntil?: Date | null) {
    await this.prisma.chatMember.update({
      where: { chatId_userId: { chatId, userId } },
      data: { isMuted, mutedUntil }
    });
    return { success: true, isMuted, mutedUntil };
  }

  async updateWallpaper(chatId: string, userId: string, wallpaperUrl: string | null) {
    await this.prisma.chatMember.update({
      where: { chatId_userId: { chatId, userId } },
      data: { wallpaperUrl }
    });
    return { success: true, wallpaperUrl };
  }
}
