import { PrismaService } from '../../prisma/prisma.service';
import { Call, CallParticipant } from '@prisma/client';
export declare class CallsRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    createCall(data: {
        chatId: string;
        callerId: string;
        type: string;
        status: string;
    }): Promise<Call>;
    findCallById(id: string): Promise<Call | null>;
    updateCallStatus(id: string, status: string, endReason?: string): Promise<Call>;
    addParticipant(data: {
        callId: string;
        userId: string;
    }): Promise<CallParticipant>;
    updateParticipant(data: {
        callId: string;
        userId: string;
        joinedAt?: Date;
        leftAt?: Date;
    }): Promise<CallParticipant>;
}
