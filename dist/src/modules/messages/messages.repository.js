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
exports.MessagesRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const client_1 = require("@prisma/client");
const uuidv7_1 = require("uuidv7");
let MessagesRepository = class MessagesRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(data) {
        return this.prisma.message.create({
            data: {
                id: (0, uuidv7_1.uuidv7)(),
                chatId: data.chatId,
                senderId: data.senderId,
                clientTempId: data.clientTempId,
                type: data.type,
                textContent: data.textContent,
                attachmentId: data.attachmentId,
                replyToMessageId: data.replyToMessageId,
                status: client_1.MessageStatus.SENT,
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
    async findById(messageId) {
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
    async findByChatId(chatId, userId, limit, cursor) {
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
    async createReceipts(messageId, userIds) {
        const data = userIds.map((userId) => ({
            messageId,
            userId,
        }));
        return this.prisma.messageReceipt.createMany({
            data,
        });
    }
    async markAsDelivered(messageId, userId) {
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
    async markAsSeen(messageId, userId) {
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
    async getUnreadCount(chatId, userId) {
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
};
exports.MessagesRepository = MessagesRepository;
exports.MessagesRepository = MessagesRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MessagesRepository);
//# sourceMappingURL=messages.repository.js.map