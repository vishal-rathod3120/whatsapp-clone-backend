import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { ModuleRef } from '@nestjs/core';

@Injectable()
export class DisappearingMessagesCron {
  private readonly logger = new Logger(DisappearingMessagesCron.name);

  constructor(
    private prisma: PrismaService,
    private moduleRef: ModuleRef
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleExpiredMessages() {
    this.logger.debug('Running Disappearing Messages Cron Job...');

    try {
      const expiredMessages = await this.prisma.message.findMany({
        where: {
          expiresAt: {
            lte: new Date(),
          },
          isDeleted: false,
        },
        select: {
          id: true,
          chatId: true,
        },
      });

      if (expiredMessages.length === 0) return;

      this.logger.log(`Found ${expiredMessages.length} expired messages to delete.`);

      const messageIds = expiredMessages.map(m => m.id);

      // Perform a soft delete as per standard implementation, or hard delete if preferred
      // Here we hard-delete to free up space, as disappearing messages are meant to be ephemeral
      await this.prisma.message.deleteMany({
        where: {
          id: { in: messageIds },
        },
      });

      // Notify clients
      try {
        const gateway = this.moduleRef.get('ChatGateway', { strict: false });
        if (gateway?.server) {
          // Group by chatId to reduce emissions
          const chatIds = [...new Set(expiredMessages.map(m => m.chatId))];
          for (const chatId of chatIds) {
            gateway.server.to(`chat:${chatId}`).emit('message:deleted:batch', {
              chatId,
              messageIds: expiredMessages.filter(m => m.chatId === chatId).map(m => m.id),
              forEveryone: true
            });
          }
        }
      } catch (err) {
        // Gateway not available or error emitting
      }

    } catch (error) {
      this.logger.error('Failed to run disappearing messages cron job', error);
    }
  }
}
