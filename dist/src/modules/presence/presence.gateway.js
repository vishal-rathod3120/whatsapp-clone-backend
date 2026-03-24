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
var PresenceGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PresenceGateway = void 0;
const common_1 = require("@nestjs/common");
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const presence_service_1 = require("./presence.service");
const socket_session_service_1 = require("../gateway/socket-session.service");
const jwt_1 = require("@nestjs/jwt");
let PresenceGateway = PresenceGateway_1 = class PresenceGateway {
    constructor(presenceService, socketSession, jwtService) {
        this.presenceService = presenceService;
        this.socketSession = socketSession;
        this.jwtService = jwtService;
        this.logger = new common_1.Logger(PresenceGateway_1.name);
    }
    async handleConnection(client) {
        try {
            const token = client.handshake.auth.token;
            if (!token) {
                client.disconnect();
                return;
            }
            const payload = this.jwtService.verify(token);
            const userId = payload.userId;
            const deviceId = payload.deviceId;
            this.socketSession.addSession(client.id, { userId, deviceId, socket: client });
            await this.presenceService.setUserOnline(userId, client.id);
            client.join(`user:${userId}`);
            this.broadcastPresenceUpdate(userId, 'online');
            this.logger.log(`User ${userId} connected with socket ${client.id}`);
        }
        catch (error) {
            this.logger.error(`Connection error: ${error.message}`);
            client.disconnect();
        }
    }
    async handleDisconnect(client) {
        const session = this.socketSession.getSession(client.id);
        if (session) {
            await this.presenceService.setUserOffline(session.userId, client.id);
            this.socketSession.removeSession(client.id);
            this.broadcastPresenceUpdate(session.userId, 'offline');
            this.logger.log(`User ${session.userId} disconnected`);
        }
    }
    async handleSubscribe(client, userIds) {
        for (const userId of userIds) {
            client.join(`presence:${userId}`);
        }
    }
    async handleUnsubscribe(client, userIds) {
        for (const userId of userIds) {
            client.leave(`presence:${userId}`);
        }
    }
    async handleTypingStart(client, data) {
        const session = this.socketSession.getSession(client.id);
        if (!session)
            return;
        await this.presenceService.setTyping(data.chatId, session.userId, true);
        client.to(`chat:${data.chatId}`).emit('chat:typing:update', {
            chatId: data.chatId,
            userId: session.userId,
            isTyping: true,
        });
    }
    async handleTypingStop(client, data) {
        const session = this.socketSession.getSession(client.id);
        if (!session)
            return;
        await this.presenceService.setTyping(data.chatId, session.userId, false);
        client.to(`chat:${data.chatId}`).emit('chat:typing:update', {
            chatId: data.chatId,
            userId: session.userId,
            isTyping: false,
        });
    }
    broadcastPresenceUpdate(userId, status) {
        this.server.to(`presence:${userId}`).emit('presence:update', {
            userId,
            status,
            lastSeen: status === 'offline' ? new Date().toISOString() : null,
        });
    }
};
exports.PresenceGateway = PresenceGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], PresenceGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('presence:subscribe'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Array]),
    __metadata("design:returntype", Promise)
], PresenceGateway.prototype, "handleSubscribe", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('presence:unsubscribe'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Array]),
    __metadata("design:returntype", Promise)
], PresenceGateway.prototype, "handleUnsubscribe", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('chat:typing:start'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], PresenceGateway.prototype, "handleTypingStart", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('chat:typing:stop'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], PresenceGateway.prototype, "handleTypingStop", null);
exports.PresenceGateway = PresenceGateway = PresenceGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        namespace: 'presence',
        cors: {
            origin: '*',
        },
    }),
    __metadata("design:paramtypes", [presence_service_1.PresenceService,
        socket_session_service_1.SocketSessionService,
        jwt_1.JwtService])
], PresenceGateway);
//# sourceMappingURL=presence.gateway.js.map