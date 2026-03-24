import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CleanupPresenceJob {
  private readonly logger = new Logger(CleanupPresenceJob.name);

  constructor(private prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async cleanupStalePresence(): Promise<void> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const staleDevices = await this.prisma.device.findMany({
      where: {
        lastActiveAt: {
          lt: oneHourAgo,
        },
        refreshTokenHash: {
          not: null,
        },
      },
    });

    for (const device of staleDevices) {
      await this.prisma.device.update({
        where: { id: device.id },
        data: {
          refreshTokenHash: null,
        },
      });

      this.logger.log(`Cleared refresh token for stale device ${device.id}`);
    }
  }
}
