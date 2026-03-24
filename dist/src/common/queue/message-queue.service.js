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
var MessageQueueService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageQueueService = void 0;
const common_1 = require("@nestjs/common");
const redis_service_1 = require("../../redis/redis.service");
let MessageQueueService = MessageQueueService_1 = class MessageQueueService {
    constructor(redis) {
        this.redis = redis;
        this.logger = new common_1.Logger(MessageQueueService_1.name);
        this.QUEUE_KEY = 'message_queue';
        this.PROCESSING_KEY = 'message_queue:processing';
    }
    async enqueue(job) {
        const fullJob = {
            ...job,
            id: this.generateJobId(),
            createdAt: new Date(),
            attempts: 0,
        };
        await this.redis.lpush(this.QUEUE_KEY, JSON.stringify(fullJob));
        this.logger.log(`Enqueued job ${fullJob.id} of type ${job.type}`);
    }
    async dequeue() {
        const jobJson = await this.redis.brpoplpush(this.QUEUE_KEY, this.PROCESSING_KEY, 1);
        if (!jobJson)
            return null;
        try {
            const job = JSON.parse(jobJson);
            return job;
        }
        catch (error) {
            this.logger.error(`Failed to parse job: ${error.message}`);
            return null;
        }
    }
    async completeJob(jobId) {
        await this.redis.lrem(this.PROCESSING_KEY, 1, jobId);
        this.logger.log(`Completed job ${jobId}`);
    }
    async failJob(jobId, error) {
        const jobJson = await this.redis.lrange(this.PROCESSING_KEY, 0, -1);
        for (const json of jobJson) {
            try {
                const job = JSON.parse(json);
                if (job.id === jobId) {
                    job.attempts++;
                    if (job.attempts >= job.maxAttempts) {
                        await this.redis.lrem(this.PROCESSING_KEY, 1, json);
                        this.logger.error(`Job ${jobId} failed permanently after ${job.attempts} attempts: ${error}`);
                    }
                    else {
                        const delay = Math.pow(2, job.attempts) * 1000;
                        job.scheduledAt = new Date(Date.now() + delay);
                        await this.redis.lrem(this.PROCESSING_KEY, 1, json);
                        await this.redis.lpush(this.QUEUE_KEY, JSON.stringify(job));
                        this.logger.warn(`Job ${jobId} failed, retrying in ${delay}ms (attempt ${job.attempts})`);
                    }
                    break;
                }
            }
            catch (parseError) {
                this.logger.error(`Failed to parse job in failJob: ${parseError.message}`);
            }
        }
    }
    async getQueueLength() {
        return await this.redis.llen(this.QUEUE_KEY);
    }
    async getProcessingLength() {
        return await this.redis.llen(this.PROCESSING_KEY);
    }
    generateJobId() {
        return `job_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    }
};
exports.MessageQueueService = MessageQueueService;
exports.MessageQueueService = MessageQueueService = MessageQueueService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [redis_service_1.RedisService])
], MessageQueueService);
//# sourceMappingURL=message-queue.service.js.map