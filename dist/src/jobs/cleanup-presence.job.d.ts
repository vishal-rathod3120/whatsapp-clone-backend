import { PrismaService } from '../prisma/prisma.service';
export declare class CleanupPresenceJob {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    cleanupStalePresence(): Promise<void>;
}
