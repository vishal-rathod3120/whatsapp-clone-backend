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
exports.ChatGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const socket_session_service_1 = require("./socket-session.service");
const chats_service_1 = require("../chats/chats.service");
const messages_service_1 = require("../messages/messages.service");
const presence_repository_1 = require("../../redis/presence.repository");
const notifications_service_1 = require("../notifications/notifications.service");
const auth_token_service_1 = require("../auth/auth-token.service");
const message_dto_1 = require("../messages/dto/message.dto");
let ChatGateway = class ChatGateway {
    constructor(socketSessionService, chatsService, messagesService, presenceRepository, notificationsService, authTokenService) {
        this.socketSessionService = socketSessionService;
        this.chatsService = chatsService;
        this.messagesService = messagesService;
        this.presenceRepository = presenceRepository;
        this.notificationsService = notificationsService;
        this.authTokenService = authTokenService;
    }
    async handleConnection(socket) {
        try {
            const token = socket.handshake.auth.token || socket.handshake.query.token;
            if (!token) {
                socket.disconnect();
                return;
            }
            let payload;
            try {
                payload = await this.authTokenService.verifyAccessToken(token);
            }
            catch (err) {
                socket.disconnect();
                return;
            }
            const userId = payload.sub;
            if (!userId) {
                socket.disconnect();
                return;
            }
            await this.socketSessionService.registerSocket(userId, socket.id);
            socket.join(`user:${userId}`);
            await this.replayMissedMessages(userId, socket);
            const mutuals = await this.chatsService.getMutualContactIds(userId);
            mutuals.forEach(contactId => {
                this.server.to(`user:${contactId}`).emit('presence:update', {
                    userId,
                    status: 'online',
                    lastSeen: null,
                });
            });
        }
        catch (error) {
            console.error('Socket connection error:', error);
            socket.disconnect();
        }
    }
    async replayMissedMessages(userId, socket) {
        try {
            const presence = await this.presenceRepository.getUserPresence(userId);
            const lastSeen = presence.lastSeen || new Date(Date.now() - 24 * 60 * 60 * 1000);
            const missedMessages = await this.messagesService.getMissedMessages(userId, lastSeen);
            if (missedMessages.length > 0) {
                socket.emit('chat:missed-messages', {
                    messages: missedMessages,
                    count: missedMessages.length,
                });
            }
        }
        catch (error) {
            console.error('Replay missed messages error:', error);
        }
    }
    async handleDisconnect(socket) {
        const userId = this.socketSessionService.getUserIdBySocket(socket.id);
        await this.socketSessionService.removeSocket(socket.id);
        if (userId) {
            const sockets = await this.socketSessionService.getUserSockets(userId);
            if (sockets.length === 0) {
                const presence = await this.presenceRepository.getUserPresence(userId);
                const mutuals = await this.chatsService.getMutualContactIds(userId);
                mutuals.forEach(contactId => {
                    this.server.to(`user:${contactId}`).emit('presence:update', {
                        userId,
                        status: 'offline',
                        lastSeen: presence.lastSeen,
                    });
                });
            }
        }
        console.log(`Socket ${socket.id} disconnected`);
    }
    async handleSendMessage(socket, payload) {
        try {
            const userId = this.socketSessionService.getUserIdBySocket(socket.id);
            if (!userId)
                return;
            const isMember = await this.chatsService.isChatMember(payload.chatId, userId);
            if (!isMember) {
                socket.emit('chat:error', { message: 'Not a member of this chat' });
                return;
            }
            const message = await this.messagesService.createMessage(payload.chatId, userId, {
                clientTempId: payload.clientTempId,
                type: payload.type,
                textContent: payload.textContent,
                attachmentId: payload.attachmentId,
                replyToMessageId: payload.replyToMessageId,
            });
            socket.emit('chat:sent-ack', {
                clientTempId: payload.clientTempId,
                message,
            });
            const recipientId = await this.chatsService.getOtherMemberId(payload.chatId, userId);
            if (recipientId) {
                this.server.to(`user:${recipientId}`).emit('chat:new', { message });
                await this.notificationsService.sendSilentPushNotification(recipientId, {
                    chatId: payload.chatId,
                    messageId: message.id,
                    type: 'message',
                    senderId: userId,
                    timestamp: new Date().toISOString(),
                });
                const recipientSockets = await this.socketSessionService.getUserSockets(recipientId);
                if (recipientSockets.length > 0) {
                    await this.messagesService.markAsDelivered(message.id, recipientId);
                    const senderSockets = await this.socketSessionService.getUserSockets(userId);
                    senderSockets.forEach((socketId) => {
                        this.server.to(socketId).emit('chat:delivered:update', {
                            messageId: message.id,
                            userId: recipientId,
                            deliveredAt: new Date(),
                        });
                    });
                    await this.notificationsService.sendSilentPushNotification(recipientId, {
                        chatId: payload.chatId,
                        messageId: message.id,
                        type: 'message',
                    });
                }
                else {
                    const isMuted = await this.chatsService.isChatMuted(payload.chatId, recipientId);
                    if (!isMuted) {
                        await this.notificationsService.sendPushNotification(recipientId, {
                            title: message.sender.displayName,
                            body: message.textContent || 'New message',
                            data: {
                                chatId: payload.chatId,
                                messageId: message.id,
                                type: 'message',
                            },
                        });
                    }
                }
            }
        }
        catch (error) {
            console.error('Send message error:', error);
            socket.emit('chat:error', { message: 'Failed to send message' });
        }
    }
    async handleDelivered(socket, payload) {
        try {
            const userId = this.socketSessionService.getUserIdBySocket(socket.id);
            if (!userId)
                return;
            const updated = await this.messagesService.markAsDelivered(payload.messageId, userId);
            if (updated) {
                const message = await this.messagesService.getMessageById(payload.messageId);
                this.server.to(`user:${message.senderId}`).emit('chat:delivered:update', {
                    messageId: payload.messageId,
                    userId,
                    deliveredAt: new Date(),
                });
            }
        }
        catch (error) {
            console.error('Delivered error:', error);
        }
    }
    async handleSeen(socket, payload) {
        try {
            const userId = this.socketSessionService.getUserIdBySocket(socket.id);
            if (!userId)
                return;
            const updated = await this.messagesService.markAsSeen(payload.messageId, userId);
            if (updated) {
                const message = await this.messagesService.getMessageById(payload.messageId);
                this.server.to(`user:${message.senderId}`).emit('chat:seen:update', {
                    chatId: payload.chatId,
                    messageId: payload.messageId,
                    seenBy: userId,
                    seenAt: new Date(),
                });
            }
        }
        catch (error) {
            console.error('Seen error:', error);
        }
    }
    async handleTypingStart(socket, payload) {
        const userId = this.socketSessionService.getUserIdBySocket(socket.id);
        if (!userId)
            return;
        await this.presenceRepository.setUserTyping(payload.chatId, userId);
        const recipientId = await this.chatsService.getOtherMemberId(payload.chatId, userId);
        if (recipientId) {
            this.server.to(`user:${recipientId}`).emit('chat:typing:update', {
                chatId: payload.chatId,
                userId,
                isTyping: true,
            });
        }
    }
    async handleTypingStop(socket, payload) {
        const userId = this.socketSessionService.getUserIdBySocket(socket.id);
        if (!userId)
            return;
        await this.presenceRepository.removeUserTyping(payload.chatId, userId);
        const recipientId = await this.chatsService.getOtherMemberId(payload.chatId, userId);
        if (recipientId) {
            this.server.to(`user:${recipientId}`).emit('chat:typing:update', {
                chatId: payload.chatId,
                userId,
                isTyping: false,
            });
        }
    }
};
exports.ChatGateway = ChatGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], ChatGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('chat:send'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleSendMessage", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('chat:delivered'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, message_dto_1.DeliveredDto]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleDelivered", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('chat:seen'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, message_dto_1.SeenDto]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleSeen", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('chat:typing:start'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleTypingStart", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('chat:typing:stop'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleTypingStop", null);
exports.ChatGateway = ChatGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: { origin: '*' },
        namespace: '/',
    }),
    __metadata("design:paramtypes", [socket_session_service_1.SocketSessionService,
        chats_service_1.ChatsService,
        messages_service_1.MessagesService,
        presence_repository_1.PresenceRepository,
        notifications_service_1.NotificationsService,
        auth_token_service_1.AuthTokenService])
], ChatGateway);
//# sourceMappingURL=chat.gateway.js.map