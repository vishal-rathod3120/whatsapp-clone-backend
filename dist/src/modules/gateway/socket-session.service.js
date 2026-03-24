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
exports.SocketSessionService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const presence_repository_1 = require("../../redis/presence.repository");
const chats_service_1 = require("../chats/chats.service");
const notifications_service_1 = require("../notifications/notifications.service");
let SocketSessionService = class SocketSessionService {
    constructor(prisma, presenceRepository, chatsService, notificationsService) {
        this.prisma = prisma;
        this.presenceRepository = presenceRepository;
        this.chatsService = chatsService;
        this.notificationsService = notificationsService;
        this.sessions = new Map();
        this.userSockets = new Map();
    }
    async registerSocket(userId, socketId) {
        this.userSockets.set(socketId, { userId, socketId });
        await this.presenceRepository.addUserSocket(userId, socketId);
        await this.presenceRepository.setUserOnline(userId);
    }
    async removeSocket(socketId) {
        const userInfo = this.userSockets.get(socketId);
        if (userInfo) {
            this.userSockets.delete(socketId);
            await this.presenceRepository.removeUserSocket(userInfo.userId, socketId);
            const remainingSockets = await this.presenceRepository.getUserSockets(userInfo.userId);
            if (remainingSockets.length === 0) {
                await this.presenceRepository.setUserOffline(userInfo.userId);
            }
        }
    }
    getUserIdBySocket(socketId) {
        return this.userSockets.get(socketId)?.userId || null;
    }
    async getUserSockets(userId) {
        return this.presenceRepository.getUserSockets(userId);
    }
    addSession(socketId, session) {
        this.sessions.set(socketId, session);
    }
    getSession(socketId) {
        return this.sessions.get(socketId);
    }
    removeSession(socketId) {
        this.sessions.delete(socketId);
    }
};
exports.SocketSessionService = SocketSessionService;
exports.SocketSessionService = SocketSessionService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        presence_repository_1.PresenceRepository,
        chats_service_1.ChatsService,
        notifications_service_1.NotificationsService])
], SocketSessionService);
//# sourceMappingURL=socket-session.service.js.map