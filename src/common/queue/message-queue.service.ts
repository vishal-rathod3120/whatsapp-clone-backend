import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
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

@Injectable()
export class MessageQueueService {
  private readonly logger = new Logger(MessageQueueService.name);

  constructor(@InjectQueue('message_queue') private readonly messageQueue: Queue) {}

  async enqueue(job: MessageQueueJob): Promise<void> {
    const defaultMaxAttempts = job.maxAttempts || 3;
    const defaultPriority = job.priority || 5;

    await this.messageQueue.add(
      job.type,
      job.data,
      {
        priority: defaultPriority,
        attempts: defaultMaxAttempts,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      }
    );
    this.logger.log(`Enqueued job of type ${job.type} into BullMQ`);
  }

  async bulkEnqueue(jobs: MessageQueueJob[]): Promise<void> {
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

  async getQueueLength(): Promise<number> {
    return await this.messageQueue.count();
  }

  async getProcessingLength(): Promise<number> {
    const active = await this.messageQueue.getActiveCount();
    return active;
  }
}
