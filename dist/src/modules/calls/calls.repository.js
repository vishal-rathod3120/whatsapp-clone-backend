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
exports.CallsRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let CallsRepository = class CallsRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createCall(data) {
        return this.prisma.call.create({
            data: {
                chatId: data.chatId,
                callerId: data.callerId,
                type: data.type,
                status: data.status,
            },
        });
    }
    async findCallById(id) {
        return this.prisma.call.findUnique({
            where: { id },
            include: {
                participants: true,
                caller: true,
            },
        });
    }
    async updateCallStatus(id, status, endReason) {
        const updateData = { status: status };
        if (status === 'ACCEPTED') {
            updateData.answeredAt = new Date();
        }
        if (status === 'ENDED' || status === 'REJECTED' || status === 'MISSED') {
            updateData.endedAt = new Date();
            if (endReason) {
                updateData.endReason = endReason;
            }
        }
        return this.prisma.call.update({
            where: { id },
            data: updateData,
        });
    }
    async addParticipant(data) {
        return this.prisma.callParticipant.create({
            data: {
                callId: data.callId,
                userId: data.userId,
            },
        });
    }
    async updateParticipant(data) {
        return this.prisma.callParticipant.update({
            where: {
                callId_userId: {
                    callId: data.callId,
                    userId: data.userId,
                },
            },
            data: {
                joinedAt: data.joinedAt,
                leftAt: data.leftAt,
            },
        });
    }
};
exports.CallsRepository = CallsRepository;
exports.CallsRepository = CallsRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CallsRepository);
//# sourceMappingURL=calls.repository.js.map