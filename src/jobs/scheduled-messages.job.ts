import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { MessagesService } from '../modules/messages/messages.service';

@Injectable()
export class ScheduledMessagesJob {
  private readonly logger = new Logger(ScheduledMessagesJob.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly messagesService: MessagesService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async processScheduledMessages() {
    this.logger.debug('Executing scheduled messages job...');
    
    try {
      // Find all pending messages where the scheduled time is now or in the past
      const pendingMessages = await this.prisma.scheduledMessage.findMany({
        where: {
          scheduledAt: { lte: new Date() },
          status: 'PENDING',
        },
      });

      if (pendingMessages.length === 0) {
        return;
      }

      this.logger.log(`Found ${pendingMessages.length} scheduled message(s) to process.`);

      for (const msg of pendingMessages) {
        try {
          await this.messagesService.createMessage(msg.chatId, msg.userId, {
            clientTempId: `scheduled_${msg.id}`,
            type: msg.type as any,
            textContent: msg.textContent || undefined,
            attachmentId: msg.attachmentId || undefined,
          });

          // Mark as SENT
          await this.prisma.scheduledMessage.update({
            where: { id: msg.id },
            data: { status: 'SENT' },
          });

          this.logger.log(`Successfully processed scheduled message: ${msg.id}`);
        } catch (jobError) {
          this.logger.error(`Failed to process scheduled message ${msg.id}: ${jobError.message}`);
          
          // Depending on logic, we could mark it CANCELLED or leave it PENDING.
          // Let's mark it as CANCELLED so it doesn't infinite loop.
          await this.prisma.scheduledMessage.update({
             where: { id: msg.id },
             data: { status: 'CANCELLED' }
          });
        }
      }
    } catch (error) {
       this.logger.error(`Error querying scheduled messages: ${error.message}`);
    }
  }
}
