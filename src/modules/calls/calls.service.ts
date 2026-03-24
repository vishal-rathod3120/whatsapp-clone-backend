import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CallType, CallStatus } from '../../common/enums';

@Injectable()
export class CallsService {
  constructor(private prisma: PrismaService) {}

  async getCallsByUser(userId: string, limit: number = 20, cursor?: string) {
    const calls = await this.prisma.call.findMany({
      where: {
        OR: [
          { callerId: userId },
          {
            participants: {
              some: { userId },
            },
          },
        ],
      },
      take: limit + 1,
      ...(cursor && {
        skip: 1,
        cursor: { id: cursor },
      }),
      orderBy: { createdAt: 'desc' },
      include: {
        chat: {
          include: {
            members: {
              where: { leftAt: null },
              include: {
                user: {
                  select: {
                    id: true,
                    displayName: true,
                    avatarUrl: true,
                  },
                },
              },
            },
          },
        },
        caller: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    const hasMore = calls.length > limit;
    const items = hasMore ? calls.slice(0, limit) : calls;
    const nextCursor = hasMore ? items[items.length - 1]?.id : null;

    return {
      items,
      nextCursor,
    };
  }

  async getCallById(callId: string, userId: string) {
    const call = await this.prisma.call.findFirst({
      where: {
        id: callId,
        OR: [
          { callerId: userId },
          {
            participants: {
              some: { userId },
            },
          },
        ],
      },
      include: {
        chat: {
          include: {
            members: {
              where: { leftAt: null },
              include: {
                user: {
                  select: {
                    id: true,
                    displayName: true,
                    avatarUrl: true,
                  },
                },
              },
            },
          },
        },
        caller: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    if (!call) {
      throw new NotFoundException('Call not found');
    }

    return call;
  }
}
