import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SecurityLogService {
  constructor(private prisma: PrismaService) {}

  async log(action: string, userId?: string, ipAddress?: string, userAgent?: string, metadata?: any) {
    return this.prisma.securityLog.create({
      data: {
        action,
        userId,
        ipAddress,
        userAgent,
        metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined,
      },
    });
  }
}
