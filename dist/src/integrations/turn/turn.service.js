"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var TurnService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TurnService = void 0;
const common_1 = require("@nestjs/common");
const crypto = require("crypto");
let TurnService = TurnService_1 = class TurnService {
    constructor() {
        this.logger = new common_1.Logger(TurnService_1.name);
    }
    getTurnServers() {
        const turnServers = [];
        const turnUrl = process.env.TURN_SERVER_URL;
        if (turnUrl) {
            turnServers.push({
                urls: [turnUrl],
                username: process.env.TURN_USERNAME || '',
                credential: process.env.TURN_CREDENTIAL || '',
            });
        }
        turnServers.push({ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] });
        return turnServers;
    }
    generateTurnCredentials() {
        const secret = process.env.TURN_SECRET;
        if (!secret)
            return { username: 'mock', credential: 'mock' };
        const unixTimeStamp = Math.floor(Date.now() / 1000) + 24 * 3600;
        const username = `${unixTimeStamp}:app_user`;
        const hmac = crypto.createHmac('sha1', secret);
        hmac.update(username);
        const credential = hmac.digest('base64');
        return { username, credential };
    }
};
exports.TurnService = TurnService;
exports.TurnService = TurnService = TurnService_1 = __decorate([
    (0, common_1.Injectable)()
], TurnService);
//# sourceMappingURL=turn.service.js.map