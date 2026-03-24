"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var FcmProvider_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FcmProvider = void 0;
const common_1 = require("@nestjs/common");
let FcmProvider = FcmProvider_1 = class FcmProvider {
    constructor() {
        this.logger = new common_1.Logger(FcmProvider_1.name);
    }
    async sendPushNotification(deviceToken, title, body, data) {
        this.logger.log(`Sending FCM notification to ${deviceToken}`);
    }
    async sendMulticast(deviceTokens, title, body, data) {
        this.logger.log(`Sending FCM multicast to ${deviceTokens.length} devices`);
    }
};
exports.FcmProvider = FcmProvider;
exports.FcmProvider = FcmProvider = FcmProvider_1 = __decorate([
    (0, common_1.Injectable)()
], FcmProvider);
//# sourceMappingURL=fcm.provider.js.map