"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const enums_1 = require("../../common/enums");
const media_service_1 = require("../media/media.service");
let ChatsService = class ChatsService {
    constructor(prisma, mediaService) {
        this.prisma = prisma;
        this.mediaService = mediaService;
    }
    async createDirectChat(userId, dto) {
        const existingChat = await this.prisma.chat.findFirst({
            where: {
                type: enums_1.ChatType.DIRECT,
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
        const chat = await this.prisma.chat.create({
            data: {
                type: enums_1.ChatType.DIRECT,
                createdById: userId,
                members: {
                    create: [
                        { userId, role: enums_1.ChatMemberRole.MEMBER },
                        { userId: dto.targetUserId, role: enums_1.ChatMemberRole.MEMBER },
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
    async createGroupChat(userId, dto) {
        const uniqueMembers = Array.from(new Set(dto.memberUserIds.filter(id => id !== userId)));
        const membersData = [
            { userId, role: enums_1.ChatMemberRole.OWNER },
            ...uniqueMembers.map(id => ({ userId: id, role: enums_1.ChatMemberRole.MEMBER }))
        ];
        const chat = await this.prisma.chat.create({
            data: {
                type: enums_1.ChatType.GROUP,
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
    async addGroupMembers(chatId, requesterId, userIds) {
        const chat = await this.prisma.chat.findUnique({
            where: { id: chatId },
            include: { members: { where: { leftAt: null } } }
        });
        if (!chat || chat.type !== enums_1.ChatType.GROUP) {
            throw new common_1.NotFoundException('Group chat not found');
        }
        const requester = chat.members.find(m => m.userId === requesterId);
        if (!requester || (requester.role !== enums_1.ChatMemberRole.ADMIN && requester.role !== enums_1.ChatMemberRole.OWNER)) {
            throw new common_1.ForbiddenException('Only admins can add members');
        }
        const currentMemberIds = new Set(chat.members.map(m => m.userId));
        const newMembers = userIds.filter(id => !currentMemberIds.has(id));
        if (newMembers.length > 0) {
            await this.prisma.chatMember.createMany({
                data: newMembers.map(id => ({
                    chatId,
                    userId: id,
                    role: enums_1.ChatMemberRole.MEMBER
                }))
            });
        }
        return { success: true, added: newMembers.length };
    }
    async removeGroupMember(chatId, requesterId, targetUserId) {
        const chat = await this.prisma.chat.findUnique({
            where: { id: chatId },
            include: { members: { where: { leftAt: null } } }
        });
        if (!chat || chat.type !== enums_1.ChatType.GROUP)
            throw new common_1.NotFoundException('Group chat not found');
        const requester = chat.members.find(m => m.userId === requesterId);
        if (!requester)
            throw new common_1.ForbiddenException('Not a member');
        const targetMember = chat.members.find(m => m.userId === targetUserId);
        if (!targetMember)
            throw new common_1.NotFoundException('User is not a member');
        if (requesterId !== targetUserId) {
            if (requester.role === enums_1.ChatMemberRole.MEMBER)
                throw new common_1.ForbiddenException('Only admins can remove members');
            if (requester.role === enums_1.ChatMemberRole.ADMIN && targetMember.role === enums_1.ChatMemberRole.OWNER) {
                throw new common_1.ForbiddenException('Admins cannot remove the owner');
            }
        }
        await this.prisma.chatMember.update({
            where: { chatId_userId: { chatId, userId: targetUserId } },
            data: { leftAt: new Date() }
        });
        return { success: true };
    }
    async updateMemberRole(chatId, requesterId, targetUserId, newRole) {
        const chat = await this.prisma.chat.findUnique({
            where: { id: chatId },
            include: { members: { where: { leftAt: null } } }
        });
        if (!chat || chat.type !== enums_1.ChatType.GROUP)
            throw new common_1.NotFoundException('Group chat not found');
        const requester = chat.members.find(m => m.userId === requesterId);
        if (!requester || requester.role !== enums_1.ChatMemberRole.OWNER) {
            throw new common_1.ForbiddenException('Only the owner can manage roles');
        }
        const targetMember = chat.members.find(m => m.userId === targetUserId);
        if (!targetMember)
            throw new common_1.NotFoundException('User not found in group');
        await this.prisma.chatMember.update({
            where: { chatId_userId: { chatId, userId: targetUserId } },
            data: { role: newRole }
        });
        return { success: true };
    }
    async updateGroupInfo(chatId, requesterId, title, avatarUrl) {
        const chat = await this.prisma.chat.findUnique({
            where: { id: chatId },
            include: { members: { where: { leftAt: null } } }
        });
        if (!chat || chat.type !== enums_1.ChatType.GROUP)
            throw new common_1.NotFoundException('Group chat not found');
        const requester = chat.members.find(m => m.userId === requesterId);
        if (!requester || (requester.role !== enums_1.ChatMemberRole.ADMIN && requester.role !== enums_1.ChatMemberRole.OWNER)) {
            throw new common_1.ForbiddenException('Only admins can update group info');
        }
        const updated = await this.prisma.chat.update({
            where: { id: chatId },
            data: { title, avatarUrl }
        });
        return updated;
    }
    async getChatList(userId, limit = 20, cursor) {
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
                { members: { _count: 'desc' } },
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
        const chatListWithUnread = await Promise.all(items.map(async (chat) => {
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
            const otherMember = chat.type === enums_1.ChatType.DIRECT
                ? chat.members.find((m) => m.userId !== userId)?.user
                : null;
            const userMember = chat.members.find(m => m.userId === userId);
            return {
                id: chat.id,
                type: chat.type,
                title: chat.type === enums_1.ChatType.DIRECT
                    ? otherMember?.displayName
                    : chat.title,
                avatarUrl: chat.type === enums_1.ChatType.DIRECT
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
        }));
        const sortedItems = chatListWithUnread.sort((a, b) => {
            if (a.isPinned && !b.isPinned)
                return -1;
            if (!a.isPinned && b.isPinned)
                return 1;
            const timeA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
            const timeB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
            return timeB - timeA;
        });
        return {
            items: sortedItems,
            nextCursor,
        };
    }
    async getChatById(chatId, userId) {
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
            throw new common_1.NotFoundException('Chat not found');
        }
        const otherMember = chat.type === enums_1.ChatType.DIRECT
            ? chat.members.find((m) => m.userId !== userId)?.user
            : null;
        return {
            id: chat.id,
            type: chat.type,
            title: chat.type === enums_1.ChatType.DIRECT
                ? otherMember?.displayName
                : chat.title,
            avatarUrl: chat.type === enums_1.ChatType.DIRECT
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
    async markChatAsRead(chatId, userId, lastReadMessageId) {
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
    async isChatMember(chatId, userId) {
        const member = await this.prisma.chatMember.findFirst({
            where: {
                chatId,
                userId,
                leftAt: null,
            },
        });
        return !!member;
    }
    async getChatAndMember(chatId, userId) {
        const chat = await this.prisma.chat.findUnique({
            where: { id: chatId },
            include: {
                members: {
                    where: { userId, leftAt: null }
                }
            }
        });
        return { chat, member: chat?.members[0] };
    }
    async getOtherMemberId(chatId, userId) {
        const otherMember = await this.prisma.chatMember.findFirst({
            where: {
                chatId,
                userId: { not: userId },
                leftAt: null,
            },
        });
        return otherMember?.userId || null;
    }
    async isChatMuted(chatId, userId) {
        const member = await this.prisma.chatMember.findUnique({
            where: {
                chatId_userId: { chatId, userId }
            },
            select: { isMuted: true }
        });
        return member?.isMuted || false;
    }
    async getMutualContactIds(userId) {
        const chats = await this.prisma.chatMember.findMany({
            where: { userId, leftAt: null },
            select: { chatId: true }
        });
        if (chats.length === 0)
            return [];
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
    async deleteGroup(chatId, userId) {
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
        if (!chat || chat.type !== enums_1.ChatType.GROUP) {
            throw new common_1.NotFoundException('Group chat not found');
        }
        const owner = chat.members.find(m => m.userId === userId && m.role === enums_1.ChatMemberRole.OWNER);
        if (!owner) {
            throw new common_1.ForbiddenException('Only the owner can delete the group');
        }
        const attachmentIds = Array.from(new Set(chat.messages.map(m => m.attachmentId).filter(Boolean)));
        await this.prisma.chat.delete({
            where: { id: chatId }
        });
        for (const attachmentId of attachmentIds) {
            const otherUsage = await this.prisma.message.count({
                where: { attachmentId }
            });
            if (otherUsage === 0) {
                await this.mediaService.deleteAttachment(attachmentId);
            }
        }
        try {
            const gateway = this.moduleRef.get('ChatGateway', { strict: false });
            if (gateway?.server) {
                chat.members.forEach((m) => {
                    gateway.server.to(`user:${m.userId}`).emit('chat:deleted', { chatId });
                });
            }
        }
        catch (e) {
        }
        return { success: true };
    }
    async updateDisappearingTimer(chatId, requesterId, timer) {
        const chat = await this.prisma.chat.findUnique({
            where: { id: chatId },
            include: { members: { where: { leftAt: null } } }
        });
        if (!chat) {
            throw new common_1.NotFoundException('Chat not found');
        }
        const requester = chat.members.find(m => m.userId === requesterId);
        if (!requester) {
            throw new common_1.ForbiddenException('Only members can update the disappearing timer');
        }
        const updated = await this.prisma.chat.update({
            where: { id: chatId },
            data: { disappearingTimer: timer }
        });
        try {
            const gateway = this.moduleRef?.get('ChatGateway', { strict: false });
            if (gateway?.server) {
                chat.members.forEach((m) => {
                    gateway.server.to(`user:${m.userId}`).emit('chat:updated', {
                        chatId,
                        disappearingTimer: timer
                    });
                });
            }
        }
        catch (e) {
        }
        return updated;
    }
    async togglePin(chatId, userId, isPinned) {
        await this.prisma.chatMember.update({
            where: { chatId_userId: { chatId, userId } },
            data: { isPinned }
        });
        return { success: true, isPinned };
    }
    async updateMute(chatId, userId, isMuted, mutedUntil) {
        await this.prisma.chatMember.update({
            where: { chatId_userId: { chatId, userId } },
            data: { isMuted, mutedUntil }
        });
        return { success: true, isMuted, mutedUntil };
    }
    async updateWallpaper(chatId, userId, wallpaperUrl) {
        await this.prisma.chatMember.update({
            where: { chatId_userId: { chatId, userId } },
            data: { wallpaperUrl }
        });
        return { success: true, wallpaperUrl };
    }
    async archiveChat(chatId, userId) {
        await this.prisma.chatMember.update({
            where: { chatId_userId: { chatId, userId } },
            data: { isArchived: true },
        });
        return { success: true };
    }
    async unarchiveChat(chatId, userId) {
        await this.prisma.chatMember.update({
            where: { chatId_userId: { chatId, userId } },
            data: { isArchived: false },
        });
        return { success: true };
    }
    async exportChat(chatId, userId, format = 'json') {
        const isMember = await this.isChatMember(chatId, userId);
        if (!isMember) {
            throw new common_1.ForbiddenException('Not a member of this chat');
        }
        const chat = await this.prisma.chat.findUnique({
            where: { id: chatId },
            select: { title: true, type: true },
        });
        const messages = await this.prisma.message.findMany({
            where: { chatId, isDeleted: false },
            orderBy: { createdAt: 'asc' },
            include: {
                sender: { select: { displayName: true } },
                attachment: { select: { originalName: true, mimeType: true } },
            },
        });
        if (format === 'txt') {
            const lines = messages.map((m) => {
                const time = m.createdAt.toISOString();
                const sender = m.sender.displayName;
                const content = m.textContent || (m.attachment ? `[${m.attachment.mimeType}: ${m.attachment.originalName}]` : '[media]');
                return `[${time}] ${sender}: ${content}`;
            });
            return {
                filename: `chat_export_${chatId}.txt`,
                content: lines.join('\n'),
                mimeType: 'text/plain',
            };
        }
        return {
            filename: `chat_export_${chatId}.json`,
            content: JSON.stringify({
                chatId,
                title: chat?.title,
                type: chat?.type,
                exportedAt: new Date().toISOString(),
                messageCount: messages.length,
                messages: messages.map((m) => ({
                    id: m.id,
                    sender: m.sender.displayName,
                    type: m.type,
                    content: m.textContent,
                    attachment: m.attachment ? { name: m.attachment.originalName, type: m.attachment.mimeType } : null,
                    createdAt: m.createdAt,
                    editedAt: m.editedAt,
                })),
            }, null, 2),
            mimeType: 'application/json',
        };
    }
};
exports.ChatsService = ChatsService;
exports.ChatsService = ChatsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        media_service_1.MediaService])
], ChatsService);
//# sourceMappingURL=chats.service.js.map