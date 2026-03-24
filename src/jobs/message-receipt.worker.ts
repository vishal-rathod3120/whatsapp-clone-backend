import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { MessageQueueService, MessageQueueJob } from '../common/queue/message-queue.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MessageReceiptWorker implements OnApplicationBootstrap {
  private readonly logger = new Logger(MessageReceiptWorker.name);
  private isProcessing = false;

  constructor(
    private readonly messageQueue: MessageQueueService,
    private readonly prisma: PrismaService,
  ) {}

  onApplicationBootstrap() {
    this.pollQueue();
  }

  private async pollQueue() {
    while (true) {
      if (!this.isProcessing) {
        this.isProcessing = true;
        try {
          const job = await this.messageQueue.dequeue();
          if (job) {
            await this.processJob(job);
            await this.messageQueue.completeJob(job.id);
          }
        } catch (error: any) {
          this.logger.error(`Error processing job: ${error.message}`);
        } finally {
          this.isProcessing = false;
        }
      }
      // Delay before next poll to conserve CPU
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  private async processJob(job: MessageQueueJob) {
    if (job.type === 'create_receipts') {
      const { messageId, recipientIds } = job.data;
      
      const receipts = recipientIds.map((userId: string) => ({
        messageId,
        userId,
      }));

      if (receipts.length > 0) {
        await this.prisma.messageReceipt.createMany({
          data: receipts,
          skipDuplicates: true,
        });
        this.logger.log(`Created ${receipts.length} receipts for message ${messageId}`);
      }
    }
  }
}
