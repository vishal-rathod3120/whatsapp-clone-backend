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
exports.SocketAuthGuard = void 0;
const common_1 = require("@nestjs/common");
const auth_token_service_1 = require("../../modules/auth/auth-token.service");
let SocketAuthGuard = class SocketAuthGuard {
    constructor(authTokenService) {
        this.authTokenService = authTokenService;
    }
    async canActivate(context) {
        const client = context.switchToWs().getClient();
        const token = this.extractTokenFromSocket(client);
        if (!token) {
            client.disconnect();
            return false;
        }
        try {
            const payload = await this.authTokenService.verifyAccessToken(token);
            client.user = payload;
            return true;
        }
        catch {
            client.disconnect();
            return false;
        }
    }
    extractTokenFromSocket(client) {
        return (client.handshake.auth.token ||
            client.handshake.query.token ||
            client.handshake.headers.authorization?.replace('Bearer ', ''));
    }
};
exports.SocketAuthGuard = SocketAuthGuard;
exports.SocketAuthGuard = SocketAuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [auth_token_service_1.AuthTokenService])
], SocketAuthGuard);
//# sourceMappingURL=socket-auth.guard.js.map