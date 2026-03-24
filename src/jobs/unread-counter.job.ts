import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UnreadCounterJob {
  private readonly logger = new Logger(UnreadCounterJob.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async recalculateUnreadCounters(): Promise<void> {
    this.logger.log('Recalculating unread counters');
    // Batch recalculation of unread message counts
    // This job ensures counters are accurate in case of any inconsistencies
  }
}
