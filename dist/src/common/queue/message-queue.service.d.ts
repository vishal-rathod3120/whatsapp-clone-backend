import { Queue } from 'bullmq';
export interface MessageQueueJob {
    id?: string;
    type: 'push_notification' | 'cleanup_presence' | 'unread_counter' | 'create_receipts' | 'transcribe_audio' | 'fanout_delivery';
    data: any;
    priority?: number;
    attempts?: number;
    maxAttempts?: number;
    scheduledAt?: Date;
    createdAt?: Date;
}
export declare class MessageQueueService {
    private readonly messageQueue;
    private readonly logger;
    constructor(messageQueue: Queue);
    enqueue(job: MessageQueueJob): Promise<void>;
    bulkEnqueue(jobs: MessageQueueJob[]): Promise<void>;
    getQueueLength(): Promise<number>;
    getProcessingLength(): Promise<number>;
}
