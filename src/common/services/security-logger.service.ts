import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export enum SecurityAction {
  LOGIN_FAILED = 'LOGIN_FAILED',
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  ACCOUNT_UNLOCKED = 'ACCOUNT_UNLOCKED',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  TOKEN_REFRESHED = 'TOKEN_REFRESHED',
}

@Injectable()
export class SecurityLoggerService {
  private readonly logger = new Logger(SecurityLoggerService.name);

  constructor(private prisma: PrismaService) {}

  async logEvent(
    action: SecurityAction,
    options?: {
      userId?: string;
      ipAddress?: string;
      userAgent?: string;
      metadata?: Record<string, any>;
    },
  ) {
    try {
      await this.prisma.securityLog.create({
        data: {
          action,
          userId: options?.userId,
          ipAddress: options?.ipAddress,
          userAgent: options?.userAgent,
          metadata: options?.metadata ?? undefined,
        },
      });
    } catch (error) {
      // Don't let logging failures break the app flow
      this.logger.error(`Failed to log security event: ${error.message}`);
    }
  }

  async getRecentEvents(userId: string, limit = 20) {
    return this.prisma.securityLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
