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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var MessageQueueService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageQueueService = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
let MessageQueueService = MessageQueueService_1 = class MessageQueueService {
    constructor(messageQueue) {
        this.messageQueue = messageQueue;
        this.logger = new common_1.Logger(MessageQueueService_1.name);
    }
    async enqueue(job) {
        const defaultMaxAttempts = job.maxAttempts || 3;
        const defaultPriority = job.priority || 5;
        await this.messageQueue.add(job.type, job.data, {
            priority: defaultPriority,
            attempts: defaultMaxAttempts,
            backoff: {
                type: 'exponential',
                delay: 2000,
            },
            removeOnComplete: true,
            removeOnFail: false,
        });
        this.logger.log(`Enqueued job of type ${job.type} into BullMQ`);
    }
    async bulkEnqueue(jobs) {
        const formattedJobs = jobs.map((job) => ({
            name: job.type,
            data: job.data,
            opts: {
                priority: job.priority || 5,
                attempts: job.maxAttempts || 3,
                backoff: {
                    type: 'exponential',
                    delay: 2000,
                },
                removeOnComplete: true,
                removeOnFail: false,
            },
        }));
        await this.messageQueue.addBulk(formattedJobs);
        this.logger.log(`Enqueued ${jobs.length} bulk jobs into BullMQ`);
    }
    async getQueueLength() {
        return await this.messageQueue.count();
    }
    async getProcessingLength() {
        const active = await this.messageQueue.getActiveCount();
        return active;
    }
};
exports.MessageQueueService = MessageQueueService;
exports.MessageQueueService = MessageQueueService = MessageQueueService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, bullmq_1.InjectQueue)('message_queue')),
    __metadata("design:paramtypes", [bullmq_2.Queue])
], MessageQueueService);
//# sourceMappingURL=message-queue.service.js.map