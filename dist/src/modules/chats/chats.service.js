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
let ChatsService = class ChatsService {
    constructor(prisma) {
        this.prisma = prisma;
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
                members: chat.members.map((m) => ({
                    userId: m.userId,
                    displayName: m.user.displayName,
                    avatarUrl: m.user.avatarUrl,
                })),
            };
        }));
        return {
            items: chatListWithUnread,
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
};
exports.ChatsService = ChatsService;
exports.ChatsService = ChatsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ChatsService);
//# sourceMappingURL=chats.service.js.map