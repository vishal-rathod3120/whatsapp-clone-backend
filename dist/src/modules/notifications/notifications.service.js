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
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../../prisma/prisma.service");
let NotificationsService = class NotificationsService {
    constructor(prisma, configService) {
        this.prisma = prisma;
        this.configService = configService;
    }
    async sendPushNotification(userId, payload) {
        const devices = await this.prisma.device.findMany({
            where: {
                userId,
                pushToken: { not: null },
            },
        });
        for (const device of devices) {
            if (device.pushToken) {
                await this.sendToDevice(device.pushToken, payload, device.deviceType);
            }
        }
    }
    async sendSilentPushNotification(userId, data) {
        const devices = await this.prisma.device.findMany({
            where: {
                userId,
                pushToken: { not: null },
                deviceType: { in: ['ANDROID', 'IOS'] },
            },
        });
        for (const device of devices) {
            if (device.pushToken) {
                await this.sendSilentToDevice(device.pushToken, data, device.deviceType);
            }
        }
    }
    async sendSilentToDevice(token, data, deviceType) {
        try {
            if (deviceType === 'ANDROID') {
                console.log(`Sending silent FCM notification to ${token}:`, data);
            }
            else if (deviceType === 'IOS') {
                console.log(`Sending silent APNs notification to ${token}:`, data);
            }
        }
        catch (error) {
            console.error('Failed to send silent push notification:', error);
        }
    }
    async sendToDevice(token, payload, deviceType) {
        try {
            if (deviceType === 'ANDROID' || deviceType === 'IOS') {
                console.log(`Sending FCM notification to ${token}:`, payload);
            }
            else if (deviceType === 'WEB') {
                console.log(`Sending Web Push notification to ${token}:`, payload);
            }
        }
        catch (error) {
            console.error('Failed to send push notification:', error);
        }
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map