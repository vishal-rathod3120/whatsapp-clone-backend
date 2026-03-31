import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MediaService } from '../modules/media/media.service';
import { OpenAIService } from '../modules/media/openai.service';
import { ModuleRef } from '@nestjs/core';

@Processor('message_queue')
export class MessageProcessor extends WorkerHost {
  private readonly logger = new Logger(MessageProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mediaService: MediaService,
    private readonly openaiService: OpenAIService,
    private readonly moduleRef: ModuleRef,
  ) {
    super();
  }

  private get chatGateway(): any {
    try {
      return this.moduleRef.get('ChatGateway', { strict: false });
    } catch (e) {
      return null;
    }
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.debug(`Processing job ${job.id} of type ${job.name}`);

    switch (job.name) {
      case 'create_receipts':
        await this.handleCreateReceipts(job.data);
        break;
      
      // Add other job types here (e.g., push notifications)
      case 'push_notification':
        // this.logger.log(`Handling push notification for ${job.data.userId}`);
        break;

      case 'fanout_delivery':
        await this.handleFanoutDelivery(job.data);
        break;

      case 'transcribe_audio':
        await this.handleTranscribeAudio(job.data);
        break;

      default:
        this.logger.warn(`Unknown job type: ${job.name}`);
    }

    return { success: true };
  }

  private async handleCreateReceipts(data: { messageId: string, recipientIds: string[] }) {
    const { messageId, recipientIds } = data;
    
    const receipts = recipientIds.map((userId: string) => ({
      messageId,
      userId,
    }));

    if (receipts.length > 0) {
      await this.prisma.messageReceipt.createMany({
        data: receipts,
        skipDuplicates: true,
      });
      this.logger.log(`Created batch of ${receipts.length} receipts for message ${messageId}`);
    }
  }

  private async handleFanoutDelivery(data: { messageId: string, chatId: string, recipientIds: string[], message: any }) {
    const { messageId, chatId, recipientIds, message } = data;
    
    if (!this.chatGateway?.server) {
      this.logger.warn(`ChatGateway server not available for fanout delivery of message ${messageId}`);
      return;
    }

    recipientIds.forEach((userId) => {
      this.chatGateway.server.to(`user:${userId}`).emit('message:receive', {
        chatId,
        message,
      });
    });

    this.logger.log(`Delivered message ${messageId} to ${recipientIds.length} recipients via background fan-out`);
  }

  private async handleTranscribeAudio(data: { attachmentId: string }) {
    const { attachmentId } = data;
    this.logger.log(`Starting transcription for attachment ${attachmentId}`);

    try {
      const attachment = await this.prisma.attachment.findUnique({
        where: { id: attachmentId },
        include: { messages: true },
      });

      if (!attachment) {
        this.logger.warn(`Attachment ${attachmentId} not found, skipping transcription.`);
        return;
      }

      const buffer = await this.mediaService.downloadAttachment(attachmentId);
      if (!buffer) {
        this.logger.warn(`Failed to retrieve buffer for ${attachmentId}, skipping.`);
        return;
      }

      // Generate transcript
      const ext = attachment.originalName ? attachment.originalName.split('.').pop() : 'ogg';
      const transcript = await this.openaiService.transcribeAudio(buffer, ext || 'ogg');

      if (!transcript) {
        this.logger.warn(`Transcription API returned null for ${attachmentId}`);
        return;
      }

      // Update Database
      await this.prisma.attachment.update({
        where: { id: attachmentId },
        data: { transcript },
      });

      this.logger.log(`Successfully transcribed attachment ${attachmentId}.`);

      // Notify clients
      if (attachment.messages && attachment.messages.length > 0 && this.chatGateway?.server) {
        for (const message of attachment.messages) {
          const members = await this.prisma.chatMember.findMany({
            where: { chatId: message.chatId, leftAt: null },
            select: { userId: true },
          });

          members.forEach((m) => {
            this.chatGateway.server.to(`user:${m.userId}`).emit('message:transcript:ready', {
              messageId: message.id,
              attachmentId,
              transcript,
            });
          });
        }
      }

    } catch (e: any) {
      this.logger.error(`Error transcribing audio ${attachmentId}: ${e.message}`);
    }
  }
}
