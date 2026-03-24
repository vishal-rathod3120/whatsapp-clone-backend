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
exports.UsersRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let UsersRepository = class UsersRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findById(userId) {
        return this.prisma.user.findUnique({
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
    }
    async updateProfile(userId, data) {
        return this.prisma.user.update({
            where: { id: userId },
            data,
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
    }
    async findBlockedUsers(blockerId) {
        return this.prisma.userBlock.findMany({
            where: { blockerId },
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
    }
    async createBlock(blockerId, blockedId) {
        return this.prisma.userBlock.create({
            data: {
                blockerId,
                blockedId,
            },
        });
    }
    async deleteBlock(blockerId, blockedId) {
        return this.prisma.userBlock.delete({
            where: {
                blockerId_blockedId: {
                    blockerId,
                    blockedId,
                },
            },
        });
    }
    async checkBlockExists(blockerId, blockedId) {
        return this.prisma.userBlock.findUnique({
            where: {
                blockerId_blockedId: {
                    blockerId,
                    blockedId,
                },
            },
        });
    }
};
exports.UsersRepository = UsersRepository;
exports.UsersRepository = UsersRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersRepository);
//# sourceMappingURL=users.repository.js.map