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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const auth_token_service_1 = require("./auth-token.service");
const bcrypt = require("bcrypt");
let AuthService = class AuthService {
    constructor(prisma, authTokenService) {
        this.prisma = prisma;
        this.authTokenService = authTokenService;
    }
    async register(dto) {
        const whereClause = {};
        if (dto.phoneNumber)
            whereClause.phoneNumber = dto.phoneNumber;
        if (dto.email)
            whereClause.email = dto.email;
        const existingUser = await this.prisma.user.findFirst({
            where: whereClause,
        });
        if (existingUser) {
            throw new common_1.ConflictException('User already exists with this phone number or email');
        }
        const passwordHash = await bcrypt.hash(dto.password, 10);
        const user = await this.prisma.user.create({
            data: {
                displayName: dto.displayName,
                phoneNumber: dto.phoneNumber,
                email: dto.email,
                passwordHash,
                isVerified: true,
                devices: {
                    create: {
                        deviceType: dto.device.deviceType,
                        deviceName: dto.device.deviceName,
                        pushToken: dto.device.pushToken,
                        lastActiveAt: new Date(),
                    },
                },
            },
            include: {
                devices: true,
            },
        });
        const tokens = await this.authTokenService.generateTokens(user.id, user.phoneNumber);
        const refreshTokenHash = await this.authTokenService.hashRefreshToken(tokens.refreshToken);
        await this.prisma.device.update({
            where: { id: user.devices[0].id },
            data: { refreshTokenHash },
        });
        return {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            user: {
                id: user.id,
                displayName: user.displayName,
                phoneNumber: user.phoneNumber,
                avatarUrl: user.avatarUrl,
            },
            deviceId: user.devices[0].id,
        };
    }
    async login(dto) {
        const user = await this.prisma.user.findUnique({
            where: { phoneNumber: dto.phoneNumber },
        });
        if (!user || !user.passwordHash) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const device = await this.prisma.device.create({
            data: {
                userId: user.id,
                deviceType: dto.device.deviceType,
                deviceName: dto.device.deviceName,
                pushToken: dto.device.pushToken,
                lastActiveAt: new Date(),
            },
        });
        const tokens = await this.authTokenService.generateTokens(user.id, user.phoneNumber);
        const refreshTokenHash = await this.authTokenService.hashRefreshToken(tokens.refreshToken);
        await this.prisma.device.update({
            where: { id: device.id },
            data: { refreshTokenHash },
        });
        return {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            user: {
                id: user.id,
                displayName: user.displayName,
                phoneNumber: user.phoneNumber,
                avatarUrl: user.avatarUrl,
            },
            deviceId: device.id,
        };
    }
    async refreshTokens(refreshToken) {
        const payload = await this.authTokenService.verifyRefreshToken(refreshToken);
        const devices = await this.prisma.device.findMany({
            where: { userId: payload.sub },
        });
        let matchingDevice = null;
        for (const device of devices) {
            if (device.refreshTokenHash) {
                const isMatch = await this.authTokenService.compareRefreshToken(refreshToken, device.refreshTokenHash);
                if (isMatch) {
                    matchingDevice = device;
                    break;
                }
            }
        }
        if (!matchingDevice) {
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
        const tokens = await this.authTokenService.generateTokens(payload.sub, payload.phoneNumber);
        const newRefreshTokenHash = await this.authTokenService.hashRefreshToken(tokens.refreshToken);
        await this.prisma.device.update({
            where: { id: matchingDevice.id },
            data: {
                refreshTokenHash: newRefreshTokenHash,
                lastActiveAt: new Date(),
            },
        });
        return {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
        };
    }
    async logout(userId, deviceId) {
        if (deviceId) {
            await this.prisma.device.update({
                where: {
                    id: deviceId,
                    userId,
                },
                data: {
                    refreshTokenHash: null,
                    lastActiveAt: null,
                },
            });
        }
        else {
            await this.prisma.device.updateMany({
                where: { userId },
                data: {
                    refreshTokenHash: null,
                    lastActiveAt: null,
                },
            });
        }
        return { success: true };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        auth_token_service_1.AuthTokenService])
], AuthService);
//# sourceMappingURL=auth.service.js.map