import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Call, CallParticipant } from '@prisma/client';

@Injectable()
export class CallsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createCall(data: {
    chatId: string;
    callerId: string;
    type: string;
    status: string;
  }): Promise<Call> {
    return this.prisma.call.create({
      data: {
        chatId: data.chatId,
        callerId: data.callerId,
        type: data.type as any,
        status: data.status as any,
      },
    });
  }

  async findCallById(id: string): Promise<Call | null> {
    return this.prisma.call.findUnique({
      where: { id },
      include: {
        participants: true,
        caller: true,
      },
    });
  }

  async updateCallStatus(
    id: string,
    status: string,
    endReason?: string,
  ): Promise<Call> {
    const updateData: any = { status: status as any };
    if (status === 'ACCEPTED') {
      updateData.answeredAt = new Date();
    }
    if (status === 'ENDED' || status === 'REJECTED' || status === 'MISSED') {
      updateData.endedAt = new Date();
      if (endReason) {
        updateData.endReason = endReason;
      }
    }
    return this.prisma.call.update({
      where: { id },
      data: updateData,
    });
  }

  async addParticipant(data: {
    callId: string;
    userId: string;
  }): Promise<CallParticipant> {
    return this.prisma.callParticipant.create({
      data: {
        callId: data.callId,
        userId: data.userId,
      },
    });
  }

  async updateParticipant(data: {
    callId: string;
    userId: string;
    joinedAt?: Date;
    leftAt?: Date;
  }): Promise<CallParticipant> {
    return this.prisma.callParticipant.update({
      where: {
        callId_userId: {
          callId: data.callId,
          userId: data.userId,
        },
      },
      data: {
        joinedAt: data.joinedAt,
        leftAt: data.leftAt,
      },
    });
  }
}
