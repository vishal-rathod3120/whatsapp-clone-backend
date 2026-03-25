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
var NotificationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../../prisma/prisma.service");
const fcm_provider_1 = require("./providers/fcm.provider");
const apns_provider_1 = require("./providers/apns.provider");
const admin = require("firebase-admin");
const webPush = require("web-push");
let NotificationsService = NotificationsService_1 = class NotificationsService {
    constructor(prisma, configService, fcmProvider, apnsProvider) {
        this.prisma = prisma;
        this.configService = configService;
        this.fcmProvider = fcmProvider;
        this.apnsProvider = apnsProvider;
        this.logger = new common_1.Logger(NotificationsService_1.name);
        if (!admin.apps.length) {
            try {
                admin.initializeApp({
                    credential: admin.credential.applicationDefault(),
                });
                this.logger.log('Firebase Admin SDK initialized');
            }
            catch (error) {
                this.logger.warn(`Failed to initialize Firebase Admin: ${error.message}. Push notifications will be mocked.`);
            }
        }
        const vapidPublic = this.configService.get('VAPID_PUBLIC_KEY');
        const vapidPrivate = this.configService.get('VAPID_PRIVATE_KEY');
        const vapidEmail = this.configService.get('VAPID_EMAIL', 'mailto:example@yourdomain.com');
        if (vapidPublic && vapidPrivate) {
            webPush.setVapidDetails(vapidEmail, vapidPublic, vapidPrivate);
            this.logger.log('Web Push (VAPID) initialized');
        }
        else {
            this.logger.warn('VAPID keys missing. Web Push will be mocked.');
        }
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
                deviceType: { in: ['ANDROID', 'IOS', 'WEB'] },
            },
        });
        for (const device of devices) {
            if (device.pushToken) {
                await this.sendSilentToDevice(device.pushToken, data, device.deviceType);
            }
        }
    }
    async sendSilentToDevice(token, data, deviceType) {
        if (deviceType === 'WEB') {
            try {
                const sub = JSON.parse(token);
                await webPush.sendNotification(sub, JSON.stringify({
                    title: 'New Message',
                    body: 'You have a new message',
                    data,
                    silent: true
                }));
            }
            catch (err) {
                this.logger.error(`Failed to send Web Push silent: ${err.message}`);
            }
            return;
        }
        if (!admin.apps.length) {
            this.logger.debug(`[Mock SILENT Push] to ${token}`);
            return;
        }
        if (deviceType === 'ANDROID') {
            await this.fcmProvider.sendPushNotification(token, '', '', data);
        }
        else if (deviceType === 'IOS') {
            await this.apnsProvider.sendPushNotification(token, '', '', data);
        }
    }
    async sendToDevice(token, payload, deviceType) {
        if (deviceType === 'WEB') {
            try {
                const sub = JSON.parse(token);
                await webPush.sendNotification(sub, JSON.stringify(payload));
                this.logger.log(`Web Push sent successfully`);
            }
            catch (err) {
                this.logger.error(`Web Push failed: ${err.message}`);
            }
            return;
        }
        if (!admin.apps.length) {
            this.logger.debug(`[Mock Push] to ${token}: ${payload.title}`);
            return;
        }
        if (deviceType === 'ANDROID') {
            await this.fcmProvider.sendPushNotification(token, payload.title, payload.body, payload.data);
        }
        else if (deviceType === 'IOS') {
            await this.apnsProvider.sendPushNotification(token, payload.title, payload.body, payload.data);
        }
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = NotificationsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService,
        fcm_provider_1.FcmProvider,
        apns_provider_1.ApnsProvider])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map