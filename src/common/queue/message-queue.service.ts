import { Injectable, Logger } from '@nestjs/common';
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

@Injectable()
export class MessageQueueService {
  private readonly logger = new Logger(MessageQueueService.name);
  private readonly QUEUE_KEY = 'message_queue';
  private readonly PROCESSING_KEY = 'message_queue:processing';

  constructor(private readonly redis: RedisService) {}

  async enqueue(job: Omit<MessageQueueJob, 'id' | 'createdAt' | 'attempts'>): Promise<void> {
    const fullJob: MessageQueueJob = {
      ...job,
      id: this.generateJobId(),
      createdAt: new Date(),
      attempts: 0,
    };

    await this.redis.lpush(this.QUEUE_KEY, JSON.stringify(fullJob));
    this.logger.log(`Enqueued job ${fullJob.id} of type ${job.type}`);
  }

  async dequeue(): Promise<MessageQueueJob | null> {
    const jobJson = await this.redis.brpoplpush(this.QUEUE_KEY, this.PROCESSING_KEY, 1);
    
    if (!jobJson) return null;

    try {
      const job = JSON.parse(jobJson) as MessageQueueJob;
      return job;
    } catch (error) {
      this.logger.error(`Failed to parse job: ${error.message}`);
      return null;
    }
  }

  async completeJob(jobId: string): Promise<void> {
    await this.redis.lrem(this.PROCESSING_KEY, 1, jobId);
    this.logger.log(`Completed job ${jobId}`);
  }

  async failJob(jobId: string, error: string): Promise<void> {
    const jobJson = await this.redis.lrange(this.PROCESSING_KEY, 0, -1);
    
    for (const json of jobJson) {
      try {
        const job = JSON.parse(json) as MessageQueueJob;
        if (job.id === jobId) {
          job.attempts++;
          
          if (job.attempts >= job.maxAttempts) {
            await this.redis.lrem(this.PROCESSING_KEY, 1, json);
            this.logger.error(`Job ${jobId} failed permanently after ${job.attempts} attempts: ${error}`);
          } else {
            // Re-queue with exponential backoff
            const delay = Math.pow(2, job.attempts) * 1000;
            job.scheduledAt = new Date(Date.now() + delay);
            await this.redis.lrem(this.PROCESSING_KEY, 1, json);
            await this.redis.lpush(this.QUEUE_KEY, JSON.stringify(job));
            this.logger.warn(`Job ${jobId} failed, retrying in ${delay}ms (attempt ${job.attempts})`);
          }
          break;
        }
      } catch (parseError) {
        this.logger.error(`Failed to parse job in failJob: ${parseError.message}`);
      }
    }
  }

  async getQueueLength(): Promise<number> {
    return await this.redis.llen(this.QUEUE_KEY);
  }

  async getProcessingLength(): Promise<number> {
    return await this.redis.llen(this.PROCESSING_KEY);
  }

  private generateJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }
}
