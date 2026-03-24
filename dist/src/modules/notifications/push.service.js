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
var PushService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PushService = void 0;
const common_1 = require("@nestjs/common");
const fcm_provider_1 = require("./providers/fcm.provider");
const apns_provider_1 = require("./providers/apns.provider");
const client_1 = require("@prisma/client");
let PushService = PushService_1 = class PushService {
    constructor(fcmProvider, apnsProvider) {
        this.fcmProvider = fcmProvider;
        this.apnsProvider = apnsProvider;
        this.logger = new common_1.Logger(PushService_1.name);
    }
    async sendNotification(payload) {
        try {
            switch (payload.deviceType) {
                case client_1.DeviceType.ANDROID:
                    await this.fcmProvider.sendPushNotification(payload.deviceToken, payload.title, payload.body, payload.data);
                    break;
                case client_1.DeviceType.IOS:
                    await this.apnsProvider.sendPushNotification(payload.deviceToken, payload.title, payload.body, payload.data);
                    break;
                default:
                    this.logger.warn(`Push notifications not supported for ${payload.deviceType}`);
            }
        }
        catch (error) {
            this.logger.error(`Failed to send push notification: ${error.message}`);
        }
    }
    async sendMulticast(payloads, title, body, data) {
        const androidTokens = payloads
            .filter((p) => p.deviceType === client_1.DeviceType.ANDROID)
            .map((p) => p.deviceToken);
        const iosTokens = payloads
            .filter((p) => p.deviceType === client_1.DeviceType.IOS)
            .map((p) => p.deviceToken);
        if (androidTokens.length > 0) {
            await this.fcmProvider.sendMulticast(androidTokens, title, body, data);
        }
        if (iosTokens.length > 0) {
            await this.apnsProvider.sendMulticast(iosTokens, title, body, data);
        }
    }
    async notifyNewMessage(deviceToken, deviceType, senderName, messagePreview, chatId, messageId) {
        await this.sendNotification({
            deviceToken,
            deviceType,
            title: senderName,
            body: messagePreview || 'New message',
            data: {
                chatId,
                messageId,
                type: 'new_message',
            },
        });
    }
    async notifyMissedCall(deviceToken, deviceType, callerName, callId, chatId) {
        await this.sendNotification({
            deviceToken,
            deviceType,
            title: 'Missed call',
            body: `Call from ${callerName}`,
            data: {
                callId,
                chatId,
                type: 'missed_call',
            },
        });
    }
};
exports.PushService = PushService;
exports.PushService = PushService = PushService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [fcm_provider_1.FcmProvider,
        apns_provider_1.ApnsProvider])
], PushService);
//# sourceMappingURL=push.service.js.map