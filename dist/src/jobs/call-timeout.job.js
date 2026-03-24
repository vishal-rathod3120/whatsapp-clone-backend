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
var CallTimeoutJob_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CallTimeoutJob = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let CallTimeoutJob = CallTimeoutJob_1 = class CallTimeoutJob {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(CallTimeoutJob_1.name);
    }
    async handleCallTimeouts() {
        const thirtySecondsAgo = new Date(Date.now() - 30000);
        const timedOutCalls = await this.prisma.call.findMany({
            where: {
                status: client_1.CallStatus.RINGING,
                createdAt: {
                    lt: thirtySecondsAgo,
                },
            },
        });
        for (const call of timedOutCalls) {
            await this.prisma.call.update({
                where: { id: call.id },
                data: {
                    status: client_1.CallStatus.MISSED,
                    endReason: 'timeout',
                },
            });
            this.logger.log(`Call ${call.id} marked as missed due to timeout`);
        }
    }
};
exports.CallTimeoutJob = CallTimeoutJob;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_30_SECONDS),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CallTimeoutJob.prototype, "handleCallTimeouts", null);
exports.CallTimeoutJob = CallTimeoutJob = CallTimeoutJob_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CallTimeoutJob);
//# sourceMappingURL=call-timeout.job.js.map