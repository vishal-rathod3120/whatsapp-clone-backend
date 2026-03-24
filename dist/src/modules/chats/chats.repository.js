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
exports.ChatsRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const client_1 = require("@prisma/client");
let ChatsRepository = class ChatsRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findDirectChatBetweenUsers(userId1, userId2) {
        return this.prisma.chat.findFirst({
            where: {
                type: client_1.ChatType.DIRECT,
                AND: [
                    { members: { some: { userId: userId1 } } },
                    { members: { some: { userId: userId2 } } },
                ],
            },
            include: { members: true },
        });
    }
    async createDirectChat(userId, targetUserId) {
        return this.prisma.chat.create({
            data: {
                type: client_1.ChatType.DIRECT,
                createdById: userId,
                members: {
                    create: [
                        { userId, role: client_1.ChatMemberRole.MEMBER },
                        { userId: targetUserId, role: client_1.ChatMemberRole.MEMBER },
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
    async findChatsByUserId(userId, limit, cursor) {
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
    async findChatById(chatId) {
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
    async findChatMember(chatId, userId) {
        return this.prisma.chatMember.findFirst({
            where: {
                chatId,
                userId,
                leftAt: null,
            },
        });
    }
    async updateLastMessage(chatId, messageId, lastMessageAt) {
        return this.prisma.chat.update({
            where: { id: chatId },
            data: {
                lastMessageId: messageId,
                lastMessageAt,
            },
        });
    }
    async updateLastReadMessage(chatId, userId, messageId) {
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
};
exports.ChatsRepository = ChatsRepository;
exports.ChatsRepository = ChatsRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ChatsRepository);
//# sourceMappingURL=chats.repository.js.map