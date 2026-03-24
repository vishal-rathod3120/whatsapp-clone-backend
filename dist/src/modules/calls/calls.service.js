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
exports.CallsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let CallsService = class CallsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getCallsByUser(userId, limit = 20, cursor) {
        const calls = await this.prisma.call.findMany({
            where: {
                OR: [
                    { callerId: userId },
                    {
                        participants: {
                            some: { userId },
                        },
                    },
                ],
            },
            take: limit + 1,
            ...(cursor && {
                skip: 1,
                cursor: { id: cursor },
            }),
            orderBy: { createdAt: 'desc' },
            include: {
                chat: {
                    include: {
                        members: {
                            where: { leftAt: null },
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        displayName: true,
                                        avatarUrl: true,
                                    },
                                },
                            },
                        },
                    },
                },
                caller: {
                    select: {
                        id: true,
                        displayName: true,
                        avatarUrl: true,
                    },
                },
                participants: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                displayName: true,
                                avatarUrl: true,
                            },
                        },
                    },
                },
            },
        });
        const hasMore = calls.length > limit;
        const items = hasMore ? calls.slice(0, limit) : calls;
        const nextCursor = hasMore ? items[items.length - 1]?.id : null;
        return {
            items,
            nextCursor,
        };
    }
    async getCallById(callId, userId) {
        const call = await this.prisma.call.findFirst({
            where: {
                id: callId,
                OR: [
                    { callerId: userId },
                    {
                        participants: {
                            some: { userId },
                        },
                    },
                ],
            },
            include: {
                chat: {
                    include: {
                        members: {
                            where: { leftAt: null },
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        displayName: true,
                                        avatarUrl: true,
                                    },
                                },
                            },
                        },
                    },
                },
                caller: {
                    select: {
                        id: true,
                        displayName: true,
                        avatarUrl: true,
                    },
                },
                participants: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                displayName: true,
                                avatarUrl: true,
                            },
                        },
                    },
                },
            },
        });
        if (!call) {
            throw new common_1.NotFoundException('Call not found');
        }
        return call;
    }
};
exports.CallsService = CallsService;
exports.CallsService = CallsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CallsService);
//# sourceMappingURL=calls.service.js.map