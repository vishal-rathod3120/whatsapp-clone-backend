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
exports.MessagesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const enums_1 = require("../../common/enums");
const message_queue_service_1 = require("../../common/queue/message-queue.service");
const uuidv7_1 = require("uuidv7");
const core_1 = require("@nestjs/core");
const media_service_1 = require("../media/media.service");
let MessagesService = class MessagesService {
    constructor(prisma, messageQueue, moduleRef, mediaService) {
        this.prisma = prisma;
        this.messageQueue = messageQueue;
        this.moduleRef = moduleRef;
        this.mediaService = mediaService;
    }
    get chatGateway() {
        try {
            return this.moduleRef.get('ChatGateway', { strict: false });
        }
        catch (e) {
            console.warn('ChatGateway not found in moduleRef');
            return null;
        }
    }
    async createMessage(chatId, senderId, dto) {
        const chat = await this.prisma.chat.findUnique({
            where: { id: chatId },
            include: { members: { where: { leftAt: null } } }
        });
        if (!chat) {
            throw new common_1.NotFoundException('Chat not found');
        }
        if (chat.type === enums_1.ChatType.DIRECT) {
            const recipient = chat.members.find(m => m.userId !== senderId);
            if (recipient) {
                const block = await this.prisma.userBlock.findFirst({
                    where: {
                        OR: [
                            { blockerId: recipient.userId, blockedId: senderId },
                            { blockerId: senderId, blockedId: recipient.userId }
                        ]
                    }
                });
                if (block) {
                    throw new common_1.ForbiddenException('Cannot send messages to this contact');
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
                throw new common_1.NotFoundException('Reply message not found in this chat');
            }
        }
        let expiresAt;
        if (chat.disappearingTimer) {
            expiresAt = new Date();
            expiresAt.setSeconds(expiresAt.getSeconds() + chat.disappearingTimer);
        }
        const message = await this.prisma.$transaction(async (tx) => {
            const msg = await tx.message.create({
                data: {
                    id: (0, uuidv7_1.uuidv7)(),
                    chatId,
                    senderId,
                    clientTempId: dto.clientTempId,
                    type: dto.type,
                    textContent: dto.textContent,
                    attachmentId: dto.attachmentId,
                    replyToMessageId: dto.replyToMessageId,
                    status: enums_1.MessageStatus.SENT,
                    expiresAt,
                },
            });
            await tx.chat.update({
                where: { id: chatId },
                data: {
                    lastMessageId: msg.id,
                    lastMessageAt: msg.createdAt,
                },
            });
            return msg;
        });
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
    async getMessageById(messageId) {
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
            throw new common_1.NotFoundException('Message not found');
        }
        return message;
    }
    async getMessages(chatId, userId, limit = 30, cursor) {
        const isMember = await this.prisma.chatMember.findFirst({
            where: {
                chatId,
                userId,
                leftAt: null,
            },
        });
        if (!isMember) {
            throw new common_1.NotFoundException('Chat not found or user is not a member');
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
    async markAsDelivered(messageId, userId) {
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
    async markAsSeen(messageId, userId) {
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
    async getMissedMessages(userId, since) {
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
    async deleteMessage(chatId, messageId, userId, forEveryone) {
        const message = await this.prisma.message.findUnique({
            where: { id: messageId },
        });
        if (!message || message.chatId !== chatId) {
            throw new common_1.NotFoundException('Message not found');
        }
        if (forEveryone) {
            if (message.senderId !== userId) {
                throw new common_1.ForbiddenException('You can only delete your own messages for everyone');
            }
            const fifteenMinutesMs = 15 * 60 * 1000;
            if (Date.now() - message.createdAt.getTime() > fifteenMinutesMs) {
                throw new common_1.ForbiddenException('You can only delete messages within 15 minutes of sending');
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
            if (attachmentId) {
                const usageCount = await this.prisma.message.count({
                    where: { attachmentId }
                });
                if (usageCount === 0) {
                    await this.mediaService.deleteAttachment(attachmentId);
                }
            }
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
        }
        else {
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
    async editMessage(chatId, messageId, userId, newTextContent) {
        const message = await this.prisma.message.findUnique({
            where: { id: messageId },
        });
        if (!message || message.chatId !== chatId) {
            throw new common_1.NotFoundException('Message not found');
        }
        if (message.senderId !== userId) {
            throw new common_1.ForbiddenException('You can only edit your own messages');
        }
        if (message.type !== enums_1.MessageType.TEXT) {
            throw new common_1.ForbiddenException('Only text messages can be edited');
        }
        const fifteenMinutesMs = 15 * 60 * 1000;
        if (Date.now() - message.createdAt.getTime() > fifteenMinutesMs) {
            throw new common_1.ForbiddenException('You can only edit messages within 15 minutes of sending');
        }
        const updated = await this.prisma.message.update({
            where: { id: messageId },
            data: {
                textContent: newTextContent,
                editedAt: new Date(),
            },
        });
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
};
exports.MessagesService = MessagesService;
exports.MessagesService = MessagesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        message_queue_service_1.MessageQueueService,
        core_1.ModuleRef,
        media_service_1.MediaService])
], MessagesService);
//# sourceMappingURL=messages.service.js.map