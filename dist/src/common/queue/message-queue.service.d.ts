import { RedisService } from '../../redis/redis.service';
export interface MessageQueueJob {
    id: string;
    type: 'push_notification' | 'cleanup_presence' | 'unread_counter' | 'create_receipts';
    data: any;
    priority: number;
    attempts: number;
    maxAttempts: number;
    scheduledAt?: Date;
    createdAt: Date;
}
export declare class MessageQueueService {
    private readonly redis;
    private readonly logger;
    private readonly QUEUE_KEY;
    private readonly PROCESSING_KEY;
    constructor(redis: RedisService);
    enqueue(job: Omit<MessageQueueJob, 'id' | 'createdAt' | 'attempts'>): Promise<void>;
    dequeue(): Promise<MessageQueueJob | null>;
    completeJob(jobId: string): Promise<void>;
    failJob(jobId: string, error: string): Promise<void>;
    getQueueLength(): Promise<number>;
    getProcessingLength(): Promise<number>;
    private generateJobId;
}
