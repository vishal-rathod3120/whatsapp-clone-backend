import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { CallStatus } from '@prisma/client';

@Injectable()
export class CallTimeoutJob {
  private readonly logger = new Logger(CallTimeoutJob.name);

  constructor(private prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_30_SECONDS)
  async handleCallTimeouts(): Promise<void> {
    const thirtySecondsAgo = new Date(Date.now() - 30000);

    const timedOutCalls = await this.prisma.call.findMany({
      where: {
        status: CallStatus.RINGING,
        createdAt: {
          lt: thirtySecondsAgo,
        },
      },
    });

    for (const call of timedOutCalls) {
      await this.prisma.call.update({
        where: { id: call.id },
        data: {
          status: CallStatus.MISSED,
          endReason: 'timeout',
        },
      });

      this.logger.log(`Call ${call.id} marked as missed due to timeout`);
    }
  }
}
