import { PrismaService } from '../prisma/prisma.service';
export declare class UnreadCounterJob {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    recalculateUnreadCounters(): Promise<void>;
}
