import { PrismaService } from '../prisma/prisma.service';
export declare class CallTimeoutJob {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    handleCallTimeouts(): Promise<void>;
}
