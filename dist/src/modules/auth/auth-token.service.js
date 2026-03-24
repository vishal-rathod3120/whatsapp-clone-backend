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
exports.AuthTokenService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = require("bcrypt");
let AuthTokenService = class AuthTokenService {
    constructor(jwtService, configService) {
        this.jwtService = jwtService;
        this.configService = configService;
    }
    async generateTokens(userId, phoneNumber) {
        const payload = { sub: userId, phoneNumber };
        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(payload, {
                secret: this.configService.get('jwt.secret'),
                expiresIn: this.configService.get('jwt.expiration'),
            }),
            this.jwtService.signAsync(payload, {
                secret: this.configService.get('jwt.refreshSecret'),
                expiresIn: this.configService.get('jwt.refreshExpiration'),
            }),
        ]);
        return {
            accessToken,
            refreshToken,
        };
    }
    async verifyAccessToken(token) {
        try {
            return await this.jwtService.verifyAsync(token, {
                secret: this.configService.get('jwt.secret'),
            });
        }
        catch {
            throw new common_1.UnauthorizedException('Invalid access token');
        }
    }
    async verifyRefreshToken(token) {
        try {
            return await this.jwtService.verifyAsync(token, {
                secret: this.configService.get('jwt.refreshSecret'),
            });
        }
        catch {
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
    }
    async hashRefreshToken(token) {
        return bcrypt.hash(token, 10);
    }
    async compareRefreshToken(token, hash) {
        return bcrypt.compare(token, hash);
    }
};
exports.AuthTokenService = AuthTokenService;
exports.AuthTokenService = AuthTokenService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        config_1.ConfigService])
], AuthTokenService);
//# sourceMappingURL=auth-token.service.js.map