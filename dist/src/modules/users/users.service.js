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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let UsersService = class UsersService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findById(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                displayName: true,
                phoneNumber: true,
                email: true,
                avatarUrl: true,
                aboutText: true,
                isVerified: true,
                createdAt: true,
            },
        });
        if (!user) {
            throw new Error('User not found');
        }
        return user;
    }
    async updateProfile(userId, dto) {
        const user = await this.prisma.user.update({
            where: { id: userId },
            data: {
                displayName: dto.displayName,
                aboutText: dto.aboutText,
                avatarUrl: dto.avatarUrl,
            },
            select: {
                id: true,
                displayName: true,
                phoneNumber: true,
                email: true,
                avatarUrl: true,
                aboutText: true,
                isVerified: true,
                updatedAt: true,
            },
        });
        return user;
    }
    async blockUser(blockerId, blockedId) {
        const existingBlock = await this.prisma.userBlock.findUnique({
            where: {
                blockerId_blockedId: {
                    blockerId,
                    blockedId,
                },
            },
        });
        if (existingBlock) {
            throw new Error('User is already blocked');
        }
        await this.prisma.userBlock.create({
            data: {
                blockerId,
                blockedId,
            },
        });
        return { success: true };
    }
    async unblockUser(blockerId, blockedId) {
        await this.prisma.userBlock.delete({
            where: {
                blockerId_blockedId: {
                    blockerId,
                    blockedId,
                },
            },
        });
        return { success: true };
    }
    async getBlockedUsers(userId) {
        const blocks = await this.prisma.userBlock.findMany({
            where: { blockerId: userId },
            include: {
                blocked: {
                    select: {
                        id: true,
                        displayName: true,
                        phoneNumber: true,
                        avatarUrl: true,
                    },
                },
            },
        });
        return blocks.map((block) => block.blocked);
    }
    async isBlocked(blockerId, blockedId) {
        const block = await this.prisma.userBlock.findUnique({
            where: {
                blockerId_blockedId: {
                    blockerId,
                    blockedId,
                },
            },
        });
        return !!block;
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map