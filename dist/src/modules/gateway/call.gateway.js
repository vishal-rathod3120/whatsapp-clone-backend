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
exports.CallGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const socket_session_service_1 = require("./socket-session.service");
const presence_repository_1 = require("../../redis/presence.repository");
const prisma_service_1 = require("../../prisma/prisma.service");
const enums_1 = require("../../common/enums");
let CallGateway = class CallGateway {
    constructor(socketSessionService, presenceRepository, prisma) {
        this.socketSessionService = socketSessionService;
        this.presenceRepository = presenceRepository;
        this.prisma = prisma;
    }
    async handleCallInitiate(socket, payload) {
        try {
            const userId = this.socketSessionService.getUserIdBySocket(socket.id);
            if (!userId)
                return;
            const call = await this.prisma.call.create({
                data: {
                    chatId: payload.chatId,
                    callerId: userId,
                    type: payload.type,
                    status: enums_1.CallStatus.RINGING,
                    participants: {
                        create: {
                            userId: userId,
                            joinedAt: new Date(),
                        }
                    }
                },
                include: {
                    chat: {
                        include: {
                            members: {
                                where: { leftAt: null },
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
                    },
                },
            });
            const callee = call.chat.members.find((m) => m.userId !== userId);
            if (callee) {
                this.server.to(`user:${callee.userId}`).emit('call:incoming', {
                    callId: call.id,
                    chatId: payload.chatId,
                    caller: {
                        id: userId,
                        displayName: call.chat.members.find((m) => m.userId === userId)?.user.displayName,
                        avatarUrl: call.chat.members.find((m) => m.userId === userId)?.user.avatarUrl,
                    },
                    type: payload.type,
                });
                setTimeout(async () => {
                    const currentCall = await this.prisma.call.findUnique({
                        where: { id: call.id },
                    });
                    if (currentCall?.status === enums_1.CallStatus.RINGING) {
                        await this.prisma.call.update({
                            where: { id: call.id },
                            data: {
                                status: enums_1.CallStatus.MISSED,
                                endReason: 'timeout',
                            },
                        });
                        this.server.to(`user:${userId}`).emit('call:timeout', {
                            callId: call.id,
                        });
                    }
                }, 30000);
            }
            socket.emit('call:initiated', { callId: call.id });
        }
        catch (error) {
            console.error('Call initiate error:', error);
            socket.emit('call:error', { message: 'Failed to initiate call' });
        }
    }
    async handleCallAccept(socket, payload) {
        try {
            const userId = this.socketSessionService.getUserIdBySocket(socket.id);
            if (!userId)
                return;
            const call = await this.prisma.call.update({
                where: { id: payload.callId },
                data: {
                    status: enums_1.CallStatus.ACCEPTED,
                    answeredAt: new Date(),
                },
                include: {
                    caller: {
                        select: {
                            id: true,
                            displayName: true,
                        },
                    },
                },
            });
            await this.prisma.callParticipant.create({
                data: {
                    callId: payload.callId,
                    userId,
                    joinedAt: new Date(),
                },
            });
            this.server.to(`user:${call.callerId}`).emit('call:accepted', {
                callId: payload.callId,
                acceptedBy: userId,
            });
            socket.emit('call:connected', { callId: payload.callId });
        }
        catch (error) {
            console.error('Call accept error:', error);
            socket.emit('call:error', { message: 'Failed to accept call' });
        }
    }
    async handleCallReject(socket, payload) {
        try {
            const userId = this.socketSessionService.getUserIdBySocket(socket.id);
            if (!userId)
                return;
            const call = await this.prisma.call.update({
                where: { id: payload.callId },
                data: {
                    status: enums_1.CallStatus.REJECTED,
                    endReason: payload.reason || 'rejected',
                },
            });
            this.server.to(`user:${call.callerId}`).emit('call:rejected', {
                callId: payload.callId,
                rejectedBy: userId,
                reason: payload.reason,
            });
        }
        catch (error) {
            console.error('Call reject error:', error);
        }
    }
    async handleCallEnd(socket, payload) {
        try {
            const userId = this.socketSessionService.getUserIdBySocket(socket.id);
            if (!userId)
                return;
            const call = await this.prisma.call.findUnique({
                where: { id: payload.callId },
                include: {
                    participants: true,
                },
            });
            if (!call)
                return;
            await this.prisma.call.update({
                where: { id: payload.callId },
                data: {
                    status: enums_1.CallStatus.ENDED,
                    endReason: payload.reason || 'hangup',
                    endedAt: new Date(),
                },
            });
            await this.prisma.callParticipant.updateMany({
                where: {
                    callId: payload.callId,
                    userId,
                    leftAt: null,
                },
                data: {
                    leftAt: new Date(),
                },
            });
            call.participants.forEach((p) => {
                if (p.userId !== userId) {
                    this.server.to(`user:${p.userId}`).emit('call:ended', {
                        callId: payload.callId,
                        endedBy: userId,
                        reason: payload.reason,
                    });
                }
            });
        }
        catch (error) {
            console.error('Call end error:', error);
        }
    }
    handleOffer(socket, payload) {
        this.forwardSignaling('call:offer', socket, payload);
    }
    handleAnswer(socket, payload) {
        this.forwardSignaling('call:answer', socket, payload);
    }
    handleIceCandidate(socket, payload) {
        this.forwardSignaling('call:ice-candidate', socket, payload);
    }
    async forwardSignaling(event, socket, payload) {
        try {
            const userId = this.socketSessionService.getUserIdBySocket(socket.id);
            if (!userId)
                return;
            const call = await this.prisma.call.findUnique({
                where: { id: payload.callId },
                include: {
                    participants: true,
                },
            });
            if (!call)
                return;
            call.participants.forEach((p) => {
                if (p.userId !== userId) {
                    this.server.to(`user:${p.userId}`).emit(event, {
                        callId: payload.callId,
                        sdp: payload.sdp,
                        candidate: payload.candidate,
                        from: userId,
                    });
                }
            });
        }
        catch (error) {
            console.error(`Signaling error (${event}):`, error);
        }
    }
};
exports.CallGateway = CallGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], CallGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('call:initiate'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], CallGateway.prototype, "handleCallInitiate", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('call:accept'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], CallGateway.prototype, "handleCallAccept", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('call:reject'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], CallGateway.prototype, "handleCallReject", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('call:end'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], CallGateway.prototype, "handleCallEnd", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('call:offer'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], CallGateway.prototype, "handleOffer", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('call:answer'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], CallGateway.prototype, "handleAnswer", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('call:ice-candidate'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], CallGateway.prototype, "handleIceCandidate", null);
exports.CallGateway = CallGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: { origin: '*' },
        namespace: '/',
    }),
    __metadata("design:paramtypes", [socket_session_service_1.SocketSessionService,
        presence_repository_1.PresenceRepository,
        prisma_service_1.PrismaService])
], CallGateway);
//# sourceMappingURL=call.gateway.js.map