"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var ApnsProvider_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApnsProvider = void 0;
const common_1 = require("@nestjs/common");
const admin = require("firebase-admin");
let ApnsProvider = ApnsProvider_1 = class ApnsProvider {
    constructor() {
        this.logger = new common_1.Logger(ApnsProvider_1.name);
    }
    async sendPushNotification(deviceToken, title, body, data) {
        if (!admin.apps.length)
            return;
        try {
            const payload = {
                token: deviceToken,
                data,
                apns: {
                    payload: { aps: { 'content-available': 1 } }
                }
            };
            if (title && body) {
                payload.notification = { title, body };
            }
            await admin.messaging().send(payload);
        }
        catch (e) {
            this.logger.error(`APNS failed: ${e.message}`);
        }
    }
    async sendMulticast(deviceTokens, title, body, data) {
        if (!admin.apps.length || !deviceTokens.length)
            return;
        try {
            const payload = {
                tokens: deviceTokens,
                data,
                apns: {
                    payload: { aps: { 'content-available': 1 } }
                }
            };
            if (title && body) {
                payload.notification = { title, body };
            }
            await admin.messaging().sendEachForMulticast(payload);
        }
        catch (e) {
            this.logger.error(`APNS Multicast failed: ${e.message}`);
        }
    }
};
exports.ApnsProvider = ApnsProvider;
exports.ApnsProvider = ApnsProvider = ApnsProvider_1 = __decorate([
    (0, common_1.Injectable)()
], ApnsProvider);
//# sourceMappingURL=apns.provider.js.map