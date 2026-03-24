import { PrismaService } from '../../prisma/prisma.service';
import { Attachment } from '@prisma/client';
export declare class MediaRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    createAttachment(data: {
        uploaderId: string;
        storageKey: string;
        originalName?: string;
        mimeType: string;
        sizeBytes: bigint;
        width?: number;
        height?: number;
        durationSeconds?: number;
        thumbnailKey?: string;
    }): Promise<Attachment>;
    findAttachmentById(id: string): Promise<Attachment | null>;
    findAttachmentsByUploader(uploaderId: string): Promise<Attachment[]>;
    deleteAttachment(id: string): Promise<Attachment>;
}
